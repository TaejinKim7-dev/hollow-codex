import { DEFAULT_COMBAT_RULES, type CombatRules, type GameContent } from "../../content/types.ts"
import type { CombatAction, CombatState, CombatUnit, Dir, GameEvent, GameState, Id, Pos, StepResult } from "../types.ts"
import { recordDeed } from "../virtue/conduct.ts"
import { findPathOnGrid, gridTileAt, offset } from "../world/path.ts"
import { attackDamage, chainHits, facingToward, sideOf } from "./rules.ts"
import { alive, computeIntents, manhattan, MAX_STEPS, nextActive, occupied, samePos } from "./intents.ts"

export { computeIntents } from "./intents.ts"

const rulesOf = (content: GameContent): CombatRules => content.combat ?? DEFAULT_COMBAT_RULES

type Outcome = "victory" | "defeat" | "fled"

/** 조우를 시작한다(D6, D12, D13). 유닛을 배치하고 첫 라운드의 예고를 계산한다. */
export function startCombat(state: GameState, content: GameContent, encounterId: Id, returnPos: Pos): GameState {
  const encounter = content.encounters[encounterId]
  if (!encounter) throw new Error(`unknown encounter: ${encounterId}`)
  const fresh = { defending: false, moved: false, acted: false, gone: null } as const
  const allyStats: { id: Id; hp: number; attack: number; maxHp: number }[] = [
    { id: "player", hp: state.player.hp, attack: state.player.attack, maxHp: state.player.maxHp },
    ...state.party.map((id) => {
      const companion = content.npcs[id]?.companion
      if (!companion) throw new Error(`party member without companion: ${id}`)
      return { id, hp: companion.hp, attack: companion.attack, maxHp: companion.hp }
    })
  ]
  const allies: CombatUnit[] = allyStats.flatMap((a, i) => {
    const pos = encounter.allyStart[i]
    return pos ? [{ id: a.id, side: "ally", creature: null, pos, hp: a.hp, attack: a.attack, maxHp: a.maxHp, ...fresh }] : []
  })
  const enemies: CombatUnit[] = encounter.enemies.map((e, i) => {
    const creature = content.creatures[e.creature]
    if (!creature) throw new Error(`unknown creature: ${e.creature}`)
    return { id: `${e.creature}#${i}`, side: "enemy", creature: e.creature, pos: e.at, hp: creature.hp, attack: creature.attack, maxHp: creature.hp, morale: creature.morale ?? creature.hp, maxMorale: creature.morale ?? creature.hp, ...fresh }
  })
  const placed = [...allies, ...enemies]
  const units = placed.map((u) => {   // 처음엔 가장 가까운 상대 쪽을 본다
    const foes = placed.filter((o) => o.side !== u.side)
    const near = foes.reduce<CombatUnit | null>((best, o) => (best === null || manhattan(u.pos, o.pos) < manhattan(u.pos, best.pos) ? o : best), null)
    return near === null ? u : { ...u, facing: facingToward(u.pos, near.pos) }
  })
  const base: CombatState = {
    encounterId, grid: encounter.grid, units, active: nextActive(units) ?? "player", round: 1, intents: {}, returnPos
  }
  return { ...state, combat: { ...base, intents: computeIntents(base, content) } }
}

/** combat 명령 하나. 무효한 행동은 무시(같은 state, 이벤트 0). */
export function combatStep(state: GameState, action: CombatAction, content: GameContent): StepResult {
  const ignored: StepResult = { state, events: [] }
  const combat = state.combat
  if (combat === null) return ignored
  const actor = combat.units.find((u) => u.id === combat.active)
  if (!actor || actor.side !== "ally" || !alive(actor) || actor.acted) return ignored

  switch (action.kind) {
    case "move": {
      if (actor.moved) return ignored
      const blocked = (p: Pos) => occupied(combat.units, p, actor.id)
      const path = findPathOnGrid(combat.grid, content.tiles, actor.pos, action.to, blocked)
      if (path === null || path.length < 1 || path.length > MAX_STEPS) return ignored
      const last = path[path.length - 1]
      return settle(withUnit(state, actor.id, { pos: action.to, moved: true, ...(last === undefined ? {} : { facing: last }) }), [], content)
    }
    case "defend":
      return settle(withUnit(state, actor.id, { defending: true, acted: true }), [], content)
    case "endTurn":
      return settle(withUnit(state, actor.id, { acted: true }), [], content)
    case "flee":
      return onEdge(combat.grid, actor.pos) ? endCombat(state, content, "fled", []) : ignored
    case "special": {
      const target = enemyAt(combat.units, offset(actor.pos, action.dir))
      const rules = rulesOf(content)
      if (!target || (combat.momentum ?? 0) < rules.momentum.max) return ignored
      return special(withUnit(state, actor.id, { acted: true, facing: action.dir }), content, { ...actor, facing: action.dir }, target)
    }
    case "attack":
    case "push":
    case "persuade": {
      const target = enemyAt(combat.units, offset(actor.pos, action.dir))
      if (!target) return ignored
      const done = withUnit(state, actor.id, { acted: true, facing: action.dir })
      if (action.kind === "attack") {
        const facingActor = { ...actor, facing: action.dir }
        return harm(done, content, facingActor, target, attackDamage(combat, rulesOf(content), facingActor, target), [{ type: "sfx", name: "hit" }], true)
      }
      if (action.kind === "push") return push(done, content, actor, target, action.dir)
      const yielded = persuaded(state, content, target)
      const events: GameEvent[] = yielded ? [{ type: "combatYield", target: target.id, how: "persuaded" }] : []
      return settle(yielded ? withUnit(done, target.id, { gone: "retreated" }) : done, events, content)
    }
  }
}

/** 필살기: 대상에게 정상 피해 × specialMultiplier, 대상과 인접한 다른 적에게는 그 피해의 splashRatio. 기세를 비운다. */
function special(state: GameState, content: GameContent, attacker: CombatUnit, target: CombatUnit): StepResult {
  const rules = rulesOf(content)
  let next: GameState = { ...state, combat: { ...state.combat!, momentum: 0 } }
  const main = Math.max(1, Math.round(attackDamage(next.combat!, rules, attacker, target) * rules.momentum.specialMultiplier))
  const victims: { unit: CombatUnit; amount: number }[] = [{ unit: target, amount: main }]
  for (const o of next.combat!.units) {
    if (o.id !== target.id && o.side === "enemy" && alive(o) && manhattan(o.pos, target.pos) === 1) victims.push({ unit: o, amount: Math.max(1, Math.round(main * rules.momentum.splashRatio)) })
  }
  const events: GameEvent[] = []
  for (const v of victims) {
    const hurt = wound(v.unit, v.amount)
    next = withUnit(next, v.unit.id, { ...hurt, ...moraleAfterHit(content, attacker, v.unit, v.amount) })
    events.push({ type: "combatHit", attacker: attacker.id, target: v.unit.id, amount: v.amount, defeated: hurt.gone === "dead", hp: Math.max(0, hurt.hp), at: attacker.pos, special: true }, { type: "sfx", name: "hit" })
    const creature = v.unit.creature === null ? undefined : content.creatures[v.unit.creature]
    if (hurt.gone === "dead" && creature !== undefined && !creature.evil) {
      const deed = recordDeed(next, content, "compassion", "deed.kill-innocent")
      next = deed.state
      events.push(...deed.events)
    }
  }
  return settle(next, events, content)
}

/** 규칙 6: 격자 밖 → 물러남, 막힌 타일·유닛 → 제자리 피해 1, 그 외 1칸 이동. */
function push(state: GameState, content: GameContent, attacker: CombatUnit, target: CombatUnit, dir: Dir): StepResult {
  const combat = state.combat!
  const dest = offset(target.pos, dir)
  const tile = gridTileAt(combat.grid, content.tiles, dest)
  const events: GameEvent[] = [{ type: "sfx", name: "push" }]
  if (tile === null) return settle(withUnit(state, target.id, { gone: "retreated" }), [{ type: "combatYield", target: target.id, how: "retreated" }, ...events], content)
  if (tile.walk === null || occupied(combat.units, dest, target.id)) return harm(state, content, attacker, target, 1, [])   // 막힌 밀치기는 타격음(연출 큐)만. 밀치기 소리까지 겹치지 않는다
  return settle(withUnit(state, target.id, { pos: dest }), events, content)
}

/** 규칙 7: evil 아님 ∧ (플레이어가 그 생물의 lore 단서를 앎 ∨ 마음이 최대의 persuadeRatio 이하). */
function persuaded(state: GameState, content: GameContent, target: CombatUnit): boolean {
  const creature = target.creature === null ? undefined : content.creatures[target.creature]
  if (creature === undefined || creature.evil) return false
  if (state.facts.includes(creature.lore)) return true
  return target.morale !== undefined && target.maxMorale !== undefined && target.morale <= Math.ceil(target.maxMorale * rulesOf(content).morale.persuadeRatio)
}

/** 맞은 적의 마음 줄이기: 피해 만큼, 옆·등 타격이면 weakLoss 더. 마음 규칙이 없는 유닛(아군 등)은 그대로. */
function moraleAfterHit(content: GameContent, attacker: CombatUnit, target: CombatUnit, amount: number): Pick<CombatUnit, "morale"> | Record<string, never> {
  if (target.morale === undefined) return {}
  const weak = target.side === "enemy" && sideOf(target, attacker.pos) !== "front" ? rulesOf(content).morale.weakLoss : 0
  return { morale: Math.max(0, target.morale - amount - weak) }
}

/** 악한 적의 마음이 0이면 항복 대신 퇴각한다. */
function breakMorale(state: GameState, content: GameContent, events: GameEvent[]): GameState {
  let next = state
  for (const u of state.combat!.units) {
    if (u.side !== "enemy" || !alive(u) || u.morale === undefined || u.morale > 0) continue
    const creature = u.creature === null ? undefined : content.creatures[u.creature]
    if (creature === undefined || !creature.evil) continue
    next = withUnit(next, u.id, { gone: "retreated" })
    events.push({ type: "combatYield", target: u.id, how: "retreated" })
  }
  return next
}

/**
 * 적에게 피해를 준다. 죽은 생물이 evil 아니면 compassion 행실(D7).
 * withChain이면 주 타격 뒤 연계 추가타를 이어 낸다(규칙: rules.ts chainHits).
 */
function harm(state: GameState, content: GameContent, attacker: CombatUnit, target: CombatUnit, amount: number, events: GameEvent[], withChain = false): StepResult {
  const hurt = wound(target, amount)
  let next = withUnit(state, target.id, { ...hurt, ...moraleAfterHit(content, attacker, target, amount) })
  const all: GameEvent[] = [{ type: "combatHit", attacker: attacker.id, target: target.id, amount, defeated: hurt.gone === "dead", hp: Math.max(0, hurt.hp), at: attacker.pos }, ...events]
  const creature = target.creature === null ? undefined : content.creatures[target.creature]
  const innocent = creature !== undefined && !creature.evil
  let dead = hurt.gone === "dead"
  if (dead && innocent) {
    const deed = recordDeed(next, content, "compassion", "deed.kill-innocent")
    next = deed.state
    all.push(...deed.events)
  }
  if (withChain && !dead) {
    const chain = chainHits(next.combat!, rulesOf(content), attacker, { ...target, ...hurt })
    chain.forEach((h, i) => {
      all.push({ type: "combatHit", attacker: h.attacker, target: h.target, amount: h.amount, defeated: h.defeated, hp: h.hp, at: h.at, chain: i + 1 }, { type: "sfx", name: "hit" })
      const chainer = next.combat!.units.find((u) => u.id === h.attacker)!
      const cur = next.combat!.units.find((u) => u.id === target.id)!
      next = withUnit(next, target.id, { hp: h.hp, gone: h.defeated ? "dead" : null, ...moraleAfterHit(content, chainer, cur, h.amount) })
      if (h.defeated) dead = true
    })
    if (dead && !(hurt.gone === "dead") && innocent) {
      const deed = recordDeed(next, content, "compassion", "deed.kill-innocent")
      next = deed.state
      all.push(...deed.events)
    }
  }
  if (withChain) next = addMomentum(next, rulesOf(content), gainOf(rulesOf(content), target, attacker, all))
  return settle(next, all, content)
}

/** 이번 공격 이벤트들에서 쌓일 기세: 옆·등 타격, 연계 추가타, 처치. */
function gainOf(rules: CombatRules, target: CombatUnit, attacker: CombatUnit, events: readonly GameEvent[]): number {
  const m = rules.momentum
  let gain = sideOf(target, attacker.pos) === "front" ? 0 : m.weak
  for (const e of events) {
    if (e.type !== "combatHit") continue
    if (e.chain !== undefined) gain += m.chain
    if (e.defeated) gain += m.defeat
  }
  return gain
}

function addMomentum(state: GameState, rules: CombatRules, gain: number): GameState {
  if (gain <= 0) return state
  const combat = state.combat!
  return { ...state, combat: { ...combat, momentum: Math.min(rules.momentum.max, (combat.momentum ?? 0) + gain) } }
}

/**
 * 명령 처리 뒤: 종료 확인 → (아군이 모두 행동했으면) 적 단계 → 다시 종료 확인 → active 재계산.
 */
function settle(state0: GameState, events: GameEvent[], content: GameContent): StepResult {
  const state = breakMorale(state0, content, events)
  const ended = checkEnd(state, content, events)
  if (ended) return ended
  let combat = state.combat!
  const all = [...events]
  if (nextActive(combat.units) === null) {
    const phase = enemyPhase(combat, content)
    combat = phase.combat
    all.push(...phase.events)
  }
  const next: GameState = breakMorale({ ...state, combat: { ...combat, active: nextActive(combat.units) ?? combat.active } }, content, all)   // 적 단계의 고립으로 마음이 0이 된 악한 적도 바로 물러난다
  return checkEnd(next, content, all) ?? { state: next, events: all }
}

/** 규칙 9: units 순서로 살아 있는 적마다 예고대로 이동·공격, 그 뒤 새 라운드. */
function enemyPhase(combat: CombatState, content: GameContent): { combat: CombatState; events: GameEvent[] } {
  const units = [...combat.units]
  const events: GameEvent[] = []
  for (let i = 0; i < units.length; i++) {
    const enemy = units[i]!
    const intent = combat.intents[enemy.id]
    if (enemy.side !== "enemy" || !alive(enemy) || !intent) continue
    const pos = occupied(units, intent.moveTo, enemy.id) ? enemy.pos : intent.moveTo
    units[i] = { ...enemy, pos }
    const j = intent.attack === null ? -1 : units.findIndex((u) => u.id === intent.attack)
    const target = units[j]
    if (target && alive(target) && manhattan(pos, target.pos) === 1) {
      units[i] = { ...units[i]!, facing: facingToward(pos, target.pos) }
      const striker = units[i]!
      const rules = rulesOf(content)
      const amount = attackDamage(combat, rules, striker, target)
      const hurt = wound(target, amount)
      units[j] = { ...target, ...hurt }
      events.push({ type: "combatHit", attacker: enemy.id, target: target.id, amount, defeated: hurt.gone === "dead", hp: Math.max(0, hurt.hp), at: pos })
      events.push({ type: "sfx", name: "hit" })
      if (hurt.gone !== "dead") {
        chainHits({ ...combat, units }, rules, striker, units[j]!).forEach((h, k) => {
          const t = units[j]!
          units[j] = { ...t, hp: h.hp, gone: h.defeated ? "dead" : null }
          events.push({ type: "combatHit", attacker: h.attacker, target: h.target, amount: h.amount, defeated: h.defeated, hp: h.hp, at: h.at, chain: k + 1 }, { type: "sfx", name: "hit" })
        })
      }
    } else if (pos !== enemy.pos && !samePos(pos, enemy.pos)) {
      units[i] = { ...units[i]!, facing: facingToward(enemy.pos, pos) }
    }
  }
  const lone = (u: CombatUnit): boolean => !units.some((o) => o.id !== u.id && o.side === "enemy" && alive(o) && manhattan(o.pos, u.pos) <= 2)
  const isolation = rulesOf(content).morale.isolationLoss
  const reset = units.map((u) => {
    if (u.side === "ally" && alive(u)) return { ...u, moved: false, acted: false, defending: false }
    if (u.side === "enemy" && alive(u) && u.morale !== undefined && lone(u)) return { ...u, morale: Math.max(0, u.morale - isolation) }
    return u
  })
  const next: CombatState = { ...combat, units: reset, round: combat.round + 1 }
  return { combat: { ...next, intents: computeIntents(next, content) }, events }
}

/** 규칙 11: 살아 있는 적 없음 → 승리, 살아 있는 아군 없음 → 패배, 조우 목표(버티기·탈출)를 이루면 승리. 아니면 null. */
function checkEnd(state: GameState, content: GameContent, events: GameEvent[]): StepResult | null {
  const combat = state.combat!
  const units = combat.units
  if (!units.some((u) => u.side === "enemy" && alive(u))) return endCombat(state, content, "victory", events)
  if (!units.some((u) => u.side === "ally" && alive(u))) return endCombat(state, content, "defeat", events)
  const objective = content.encounters[combat.encounterId]?.objective
  if (objective?.kind === "escape" && units.some((u) => u.side === "ally" && alive(u) && samePos(u.pos, objective.at))) return endCombat(state, content, "victory", events)
  if (objective?.kind === "survive" && combat.round > objective.rounds) return endCombat(state, content, "victory", events)
  return null
}

/** 전투를 끝낸다(D12). 승리는 조우 칸에 머묾, 패배는 시작 지점 hp 1, 도주는 returnPos. */
function endCombat(state: GameState, content: GameContent, outcome: Outcome, events: GameEvent[]): StepResult {
  const combat = state.combat!
  const unitHp = Math.max(1, combat.units.find((u) => u.id === "player")?.hp ?? 1)
  let next: GameState
  if (outcome === "defeat") {
    next = { ...state, combat: null, mapId: content.start.map, player: { ...state.player, pos: content.start.pos, hp: 1 } }
  } else if (outcome === "fled") {
    next = { ...state, combat: null, player: { ...state.player, pos: combat.returnPos, hp: unitHp } }
  } else {
    const cleared = state.clearedEncounters.includes(combat.encounterId) || content.encounters[combat.encounterId]?.repeatable === true
      ? state.clearedEncounters
      : [...state.clearedEncounters, combat.encounterId]
    next = { ...state, combat: null, clearedEncounters: cleared, player: { ...state.player, hp: unitHp } }
  }
  const music = content.maps[next.mapId]?.music
  const tail: GameEvent[] = [{ type: "combatEnded", outcome }]
  if (music !== undefined) tail.push({ type: "music", track: music })
  return { state: next, events: [...events, ...tail] }
}

/** 규칙 4(방향·지형 없는 기본형): 방어 중이면 공격력의 절반(올림). 실제 공격은 rules.ts `attackDamage`. */
export const damage = (attack: number, target: CombatUnit): number => (target.defending ? Math.ceil(attack / 2) : attack)

const wound = (unit: CombatUnit, amount: number): Pick<CombatUnit, "hp" | "gone"> => {
  const hp = unit.hp - amount
  return { hp, gone: hp <= 0 ? "dead" : unit.gone }
}

const enemyAt = (units: readonly CombatUnit[], p: Pos): CombatUnit | undefined =>
  units.find((u) => u.side === "enemy" && alive(u) && samePos(u.pos, p))

function onEdge(grid: readonly string[], p: Pos): boolean {
  const width = grid[0]?.length ?? 0
  return p.x === 0 || p.y === 0 || p.x === width - 1 || p.y === grid.length - 1
}

function withUnit(state: GameState, id: Id, patch: Partial<CombatUnit>): GameState {
  const combat = state.combat!
  return { ...state, combat: { ...combat, units: combat.units.map((u) => (u.id === id ? { ...u, ...patch } : u)) } }
}
