// Save session: boot load, autosave and slot load/save, without the DOM. main.ts wires it to the page.
// Rule: a slot that failed to load is never overwritten by autosave until the player starts a new
// game or successfully loads a slot. The unreadable record is also copied to another id first.
import type { GameContent } from "../content/types.ts"
import { normalizeLoaded } from "../core/save/normalize.ts"
import { createInitialState } from "../core/state.ts"
import type { GameState } from "../core/types.ts"
import type { SlotStore } from "./slot-store.ts"
import { AUTO_SLOT, loadSlot, saveToSlot } from "./slots.ts"

/** Messages for the player. main.ts shows each one as `ui.notice.<name>`. */
export type SessionNotice = "load-failed" | "loaded"

export interface SessionOptions {
  readonly store: SlotStore
  readonly content: GameContent
  readonly now: () => number
  readonly seed: () => number
  readonly log?: (event: string, data?: unknown) => void
}

export interface Session {
  boot(): Promise<{ readonly state: GameState; readonly notices: readonly SessionNotice[] }>
  /** Writes the auto slot unless it is guarded. */
  autosave(state: GameState): Promise<void>
  load(slotId: string): Promise<{ readonly state: GameState | null; readonly notice: SessionNotice }>
  newGame(): GameState
  autosaveBlocked(): boolean
}

export function createSession(options: SessionOptions): Session {
  const { content, now, seed } = options
  const log = options.log ?? ((): void => {})
  const store = options.store
  let autoBlocked = false

  const fresh = (): GameState => createInitialState(content, seed() >>> 0)

  /** Copies an unreadable record so that nothing is lost even after the guard is lifted. */
  async function keepUnreadable(slotId: string): Promise<void> {
    const record = await store.get(slotId)
    if (record === null) return
    await store.put({ ...record, id: `${slotId}-unreadable-${now()}` })
  }

  return {
    async boot() {
      const loaded = await loadSlot(store, AUTO_SLOT)
      if (loaded === null) return { state: fresh(), notices: [] }
      if (loaded.ok) return { state: normalizeLoaded(loaded.state, content), notices: [] }
      log("load-failed", loaded.reason)
      autoBlocked = true
      await keepUnreadable(AUTO_SLOT)
      return { state: fresh(), notices: ["load-failed"] }
    },

    async autosave(state) {
      if (autoBlocked) {
        log("autosave-skipped", "auto slot unreadable")
        return
      }
      await saveToSlot(store, AUTO_SLOT, "auto", state, now())
    },

    async load(slotId) {
      const loaded = await loadSlot(store, slotId)
      if (loaded === null || !loaded.ok) {
        log("load-failed", loaded === null ? "empty" : loaded.reason)
        return { state: null, notice: "load-failed" }
      }
      autoBlocked = false
      return { state: normalizeLoaded(loaded.state, content), notice: "loaded" }
    },

    newGame() {
      autoBlocked = false
      return fresh()
    },

    autosaveBlocked: () => autoBlocked
  }
}
