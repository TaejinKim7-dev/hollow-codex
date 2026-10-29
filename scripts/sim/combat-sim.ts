// 전투 자동 대전: 조우마다 단순한 탐욕 정책으로 끝까지 돌려 승패·라운드 수·남은 체력을 표로 낸다(난수 없음 → 결정적).
// 사용: node scripts/sim/combat-sim.ts [조우 id 접두어]    예: node scripts/sim/combat-sim.ts enc.arena
// 정책(플레이어와 동료 모두): 인접한 적이 있으면 가장 약한 적을 공격, 없으면 가장 가까운 적의 빈 인접 칸으로 이동한 뒤 대기. 필살 가능하면 인접 적에게 필살.
import { compileContent } from "../../src/content/compile.ts"
import { loadContentDir } from "../../src/content/load-node.ts"
import { createInitialState } from "../../src/core/state.ts"
import { step } from "../../src/core/step.ts"
import { startCombat } from "../../src/core/combat/grid.ts"
import { attackTargets, reachableCells } from "../../src/core/combat/preview.ts"
import { alive, manhattan } from "../../src/core/combat/intents.ts"
import type { CombatAction, CombatUnit, GameState } from "../../src/core/types.ts"

const prefix = process.argv[2] ?? ""
const { content, errors } = compileContent(loadContentDir("content"))
if (content === null) { console.error(errors.join("\n")); process.exit(1) }

function pickAction(state: GameState, actor: CombatUnit): CombatAction {
  const combat = state.combat!
  const foes = combat.units.filter((u) => u.side === "enemy" && alive(u))
  const objective = content!.encounters[combat.encounterId]?.objective
  if (objective?.kind === "escort" && actor.id === "ward") {   // 호위 대상은 싸우지 않고 목표 칸으로 걷는다
    if (!actor.moved) {
      const cells = reachableCells(combat, content!, actor.id)
      const best = cells.reduce<{ x: number; y: number } | null>((b, c) => (b === null || manhattan(c, objective.at) < manhattan(b, objective.at) ? c : b), null)
      if (best !== null && manhattan(best, objective.at) < manhattan(actor.pos, objective.at)) return { kind: "move", to: best }
    }
    return { kind: "endTurn" }
  }
  const shots = attackTargets(combat, content!, actor.id).map((t) => ({ ...t, hp: foes.find((f) => f.id === t.id)?.hp ?? 99 })).sort((a, b) => a.hp - b.hp)   // 사거리 안의 가장 약한 적(병과 사거리 반영)
  const max = (content!.combat?.momentum.max ?? 6)
  if (shots.length > 0 && !actor.acted) {
    const t = shots[0]!
    return (combat.momentum ?? 0) >= max ? { kind: "special", dir: t.dir } : { kind: "attack", dir: t.dir }
  }
  if (!actor.moved && foes.length > 0) {
    const goal = foes.reduce((b, f) => (manhattan(f.pos, actor.pos) < manhattan(b.pos, actor.pos) ? f : b))
    const cells = reachableCells(combat, content!, actor.id)
    const best = cells.reduce<{ x: number; y: number } | null>((b, c) => (b === null || manhattan(c, goal.pos) < manhattan(b, goal.pos) ? c : b), null)
    if (best !== null && manhattan(best, goal.pos) < manhattan(actor.pos, goal.pos)) return { kind: "move", to: best }
  }
  return { kind: "endTurn" }
}

function run(encId: string, withTrainer: boolean): { outcome: string; rounds: number; hp: number } {
  let s: GameState = createInitialState(content!, 1)
  if (withTrainer) s = { ...s, party: ["npc.arena.trainer"] }
  s = startCombat(s, content!, encId, s.player.pos)
  for (let guard = 0; guard < 400 && s.combat !== null; guard++) {
    const combat = s.combat
    const actor = combat.units.find((u) => u.id === combat.active)!
    const before = s
    const r = step(s, { type: "combat", action: pickAction(s, actor) }, content!)
    s = r.state
    const ended = r.events.find((e) => e.type === "combatEnded")
    if (ended && ended.type === "combatEnded") return { outcome: ended.outcome, rounds: before.combat!.round, hp: s.player.hp }
    if (s === before) s = step(s, { type: "combat", action: { kind: "endTurn" } }, content!).state
  }
  return { outcome: "stalled", rounds: s.combat?.round ?? 0, hp: s.player.hp }
}

console.log("조우".padEnd(26), "동료", "결과".padEnd(8), "라운드", "플레이어 hp")
for (const id of Object.keys(content.encounters).filter((e) => e.startsWith(prefix))) {
  for (const t of [false, true]) {
    const r = run(id, t)
    console.log(id.padEnd(26), t ? " 교관" : " 없음", r.outcome.padEnd(8), String(r.rounds).padStart(5), String(r.hp).padStart(8))
  }
}
