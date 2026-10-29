import type { CombatUnit, GameEvent, GameState } from "../core/types.ts"
import { endedCombatUnits } from "./combat-linger.ts"

/** 외부 `fx` 객체 중 전투 추적에 필요한 최소 인터페이스. */
export interface CombatFx {
  reset(units: readonly CombatUnit[]): void
  enqueue(events: readonly GameEvent[], before: readonly CombatUnit[], after: readonly CombatUnit[], now: number, enemyPhase?: boolean): void
  clear(): void
  busy(now: number): boolean
}

export interface CombatTrack {
  /** 마지막 일격 뒤 남겨 둔 직전 전투 장면. 없으면 현재 상태를 그린다. */
  readonly lingerState: GameState | null
  /** 프레임마다 불러 연출이 끝난 lingerState를 해제한다. */
  update(now: number): void
  /** 상태 전환에 따라 전투 연출을 시작/진행/마무리한다. */
  apply(prev: GameState, next: GameState, events: readonly GameEvent[], now: number): void
  /** 즉시 남은 연출과 lingerState를 버린다. */
  release(): void
}

/** 전투 연출의 시작·진행·마무리와, 마지막 일격 뒤 남는 장면을 관리한다. */
export function createCombatTrack(fx: CombatFx): CombatTrack {
  let lingerState: GameState | null = null

  const release = (): void => {
    lingerState = null
    fx.clear()
  }

  return {
    get lingerState() {
      return lingerState
    },

    update(now: number): void {
      if (lingerState !== null && !fx.busy(now)) {
        release()
      }
    },

    apply(prev: GameState, next: GameState, events: readonly GameEvent[], now: number): void {
      const pc = prev.combat
      const nc = next.combat
      if (pc === null && nc !== null) {
        lingerState = null
        fx.reset(nc.units)
        return
      }
      if (pc !== null && nc !== null) {
        fx.enqueue(events, pc.units, nc.units, now, pc.round !== nc.round)
        return
      }
      if (pc !== null && nc === null) {
        if (events.some((e) => e.type === "combatHit" || e.type === "combatYield")) {
          const units = endedCombatUnits(pc.units, events)
          fx.enqueue(events, pc.units, units, now)
          lingerState = { ...prev, combat: { ...pc, units } }
        } else {
          release()
        }
      }
    },

    release
  }
}
