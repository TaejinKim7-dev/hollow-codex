import type { GameContent } from "../../content/types.ts"
import type { CombatAction, CombatState, CombatUnit, Dir, GameEvent, GameState, Id, Pos, StepResult } from "../types.ts"
import { recordDeed } from "../virtue/conduct.ts"
import { findPathOnGrid, gridTileAt, offset } from "../world/path.ts"
import { alive, computeIntents, manhattan, MAX_STEPS, nextActive, occupied, samePos } from "./intents.ts"

export { computeIntents } from "./intents.ts"

type Outcome = "victory" | "defeat" | "fled"

/** 조우를 시작한다(D6, D12, D13). 유닛을 배치하고 첫 라운드의 예고를 계산한다. */
export function startCombat(state: GameState, content: GameContent, encounterId: Id, returnPos: Pos): GameState {
  const encounter = content.encounters[encounterId]
  if (!encounter) throw new Error(`unknown encounter: ${encounterId}`)
  const fresh = { defending: false, moved: false, acted: false, gone: null } as const
  const allyStats: { id: Id; hp: number; attack: number }[] = [
    { id: "player", hp: state.player.hp, attack: state.player.attack },
    ...state.party.map((id) => {
      const companion = content.npcs[id]?.companion
      if (!companion) throw new Error(`party member without companion: ${id}`)
      return { id, hp: companion.hp, attack: companion.attack }
    })
  ]
  const allies: CombatUnit[] = allyStats.flatMap((a, i) => {
    const pos = encounter.allyStart[i]
    return pos ? [{ id: a.id, side: "ally", creature: null, pos, hp: a.hp, attack: a.attack, ...fresh }] : []
  })
  const enemies: CombatUnit[] = encounter.enemies.map((e, i) => {
    const creature = content.creatures[e.creature]
    if (!creature) throw new Error(`unknown creature: ${e.creature}`)
    return { id: `${e.creature}#${i}`, side: "enemy", creature: e.creature, pos: e.at, hp: creature.hp, attack: creature.attack, ...fresh }
  })
  const units = [...allies, ...enemies]
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
      return settle(withUnit(state, actor.id, { pos: action.to, moved: true }), [], content)
    }
    case "defend":
      return settle(withUnit(state, actor.id, { defending: true, acted: true }), [], content)
    case "endTurn":
      return settle(withUnit(state, actor.id, { acted: true }), [], content)
    case "flee":
      return onEdge(combat.grid, actor.pos) ? endCombat(state, content, "fled", []) : ignored
    case "attack":
    case "push":
    case "persuade": {
      const target = enemyAt(combat.units, offset(actor.pos, action.dir))
      if (!target) return ignored
      const done = withUnit(state, actor.id, { acted: true })
      if (action.kind === "attack") {
        return harm(done, content, target, damage(actor.attack, target), [{ type: "sfx", name: "hit" }])
      }
      if (action.kind === "push") return push(done, content, target, action.dir)
      return settle(persuaded(state, content, target) ? withUnit(done, target.id, { gone: "retreated" }) : done, [], content)
    }
  }
}

/** 규칙 6: 격자 밖 → 물러남, 막힌 타일·유닛 → 제자리 피해 1, 그 외 1칸 이동. */
function push(state: GameState, content: GameContent, target: CombatUnit, dir: Dir): StepResult {
  const combat = state.combat!
  const dest = offset(target.pos, dir)
  const tile = gridTileAt(combat.grid, content.tiles, dest)
  const events: GameEvent[] = [{ type: "sfx", name: "push" }]
  if (tile === null) return settle(withUnit(state, target.id, { gone: "retreated" }), events, content)
  if (tile.walk === null || occupied(combat.units, dest, target.id)) return harm(state, content, target, 1, events)
  return settle(withUnit(state, target.id, { pos: dest }), events, content)
}

/** 규칙 7: evil 아님 ∧ 플레이어가 그 생물의 lore 단서를 앎. */
function persuaded(state: GameState, content: GameContent, target: CombatUnit): boolean {
  const creature = target.creature === null ? undefined : content.creatures[target.creature]
  return creature !== undefined && !creature.evil && state.facts.includes(creature.lore)
}

/** 적에게 피해를 준다. 죽은 생물이 evil 아니면 compassion 행실(D7). */
function harm(state: GameState, content: GameContent, target: CombatUnit, amount: number, events: GameEvent[]): StepResult {
  const hurt = wound(target, amount)
  let next = withUnit(state, target.id, hurt)
  const all = [...events]
  const creature = target.creature === null ? undefined : content.creatures[target.creature]
  if (hurt.gone === "dead" && creature !== undefined && !creature.evil) {
    const deed = recordDeed(next, content, "compassion", "deed.kill-innocent")
    next = deed.state
    all.push(...deed.events)
  }
  return settle(next, all, content)
}

/**
 * 명령 처리 뒤: 종료 확인 → (아군이 모두 행동했으면) 적 단계 → 다시 종료 확인 → active 재계산.
 */
function settle(state: GameState, events: GameEvent[], content: GameContent): StepResult {
  const ended = checkEnd(state, content, events)
  if (ended) return ended
  let combat = state.combat!
  const all = [...events]
  if (nextActive(combat.units) === null) {
    const phase = enemyPhase(combat, content)
    combat = phase.combat
    all.push(...phase.events)
  }
  const next: GameState = { ...state, combat: { ...combat, active: nextActive(combat.units) ?? combat.active } }
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
      units[j] = { ...target, ...wound(target, damage(enemy.attack, target)) }
      events.push({ type: "sfx", name: "hit" })
    }
  }
  const reset = units.map((u) => (u.side === "ally" && alive(u) ? { ...u, moved: false, acted: false, defending: false } : u))
  const next: CombatState = { ...combat, units: reset, round: combat.round + 1 }
  return { combat: { ...next, intents: computeIntents(next, content) }, events }
}

/** 규칙 11: 살아 있는 적 없음 → 승리, 살아 있는 아군 없음 → 패배. 아니면 null. */
function checkEnd(state: GameState, content: GameContent, events: GameEvent[]): StepResult | null {
  const units = state.combat!.units
  if (!units.some((u) => u.side === "enemy" && alive(u))) return endCombat(state, content, "victory", events)
  if (!units.some((u) => u.side === "ally" && alive(u))) return endCombat(state, content, "defeat", events)
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
    const cleared = state.clearedEncounters.includes(combat.encounterId)
      ? state.clearedEncounters
      : [...state.clearedEncounters, combat.encounterId]
    next = { ...state, combat: null, clearedEncounters: cleared, player: { ...state.player, hp: unitHp } }
  }
  const music = content.maps[next.mapId]?.music
  const tail: GameEvent[] = [{ type: "combatEnded", outcome }]
  if (music !== undefined) tail.push({ type: "music", track: music })
  return { state: next, events: [...events, ...tail] }
}

/** 규칙 4: 방어 중이면 공격력의 절반(올림). */
const damage = (attack: number, target: CombatUnit): number => (target.defending ? Math.ceil(attack / 2) : attack)

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
