import type { Dir, Pos } from "../core/types.ts"

/** 한 칸 걷는 시간. core는 칸 단위로 순간 이동하므로 보간은 화면에서만 한다. */
export const WALK_MS = 130
const WALK_FRAMES = 4

export interface MotionFrame {
  readonly x: number
  readonly y: number
  readonly moving: boolean
  readonly frame: number
  readonly dir: Dir
}

export interface Motion {
  /** 새 칸으로 이동. 보간 중이었다면 이전 이동은 즉시 끝점에서 끝난 것으로 보고 거기서 시작한다. */
  onMoved(to: Pos, dir: Dir, nowMs: number): Motion
  /** 보간 없이 즉시 이동(지도 이동 등). */
  onTeleport(to: Pos, dir: Dir): Motion
  sample(nowMs: number): MotionFrame
  /** 이 보간이 끝나는 칸. */
  target(): Pos
}

interface Step { readonly from: Pos; readonly to: Pos; readonly startMs: number; readonly dir: Dir }

function make(rest: Pos, dir: Dir, step: Step | null): Motion {
  return {
    onMoved: (to, d, nowMs) => make(step === null ? rest : step.to, d, { from: step === null ? rest : step.to, to, startMs: nowMs, dir: d }),
    onTeleport: (to, d) => make(to, d, null),
    target: () => (step === null ? rest : step.to),
    sample(nowMs) {
      if (step === null) return { x: rest.x, y: rest.y, moving: false, frame: 0, dir }
      const t = Math.max(0, nowMs - step.startMs)
      if (t >= WALK_MS) return { x: step.to.x, y: step.to.y, moving: false, frame: 0, dir: step.dir }
      const k = t / WALK_MS
      return {
        x: step.from.x + (step.to.x - step.from.x) * k,
        y: step.from.y + (step.to.y - step.from.y) * k,
        moving: true,
        frame: Math.min(WALK_FRAMES - 1, Math.floor((t / WALK_MS) * WALK_FRAMES)),
        dir: step.dir
      }
    }
  }
}

export function createMotion(start: Pos, dir: Dir): Motion {
  return make(start, dir, null)
}

/** `moved` 이벤트 없이 플레이어 칸이 바뀐 경우(열석 고리 이동, 도망, 패배)를 맞춘다. 이미 그 칸에서 끝나면 그대로, 아니면 보간 없이 옮긴다. */
export function resyncMotion(motion: Motion, playerPos: Pos, dir: Dir): Motion {
  const t = motion.target()
  return t.x === playerPos.x && t.y === playerPos.y ? motion : motion.onTeleport(playerPos, dir)
}
