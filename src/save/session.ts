// Save session: boot load, autosave and slot load/save, without the DOM. main.ts wires it to the page.
// Rule: a slot that failed to load is never overwritten by autosave until the player starts a new
// game or successfully loads a slot. The unreadable record is also copied to another id first.
import type { GameContent } from "../content/types.ts"
import { normalizeLoaded } from "../core/save/normalize.ts"
import { createInitialState } from "../core/state.ts"
import type { GameState } from "../core/types.ts"
import { createMemorySlotStore } from "./slot-store.ts"
import type { SlotStore } from "./slot-store.ts"
import { AUTO_SLOT, loadSlot, saveToSlot } from "./slots.ts"

/** Messages for the player. main.ts shows each one as `ui.notice.<name>`. */
export type SessionNotice = "load-failed" | "loaded" | "storage-unavailable" | "autosave-failed"

export interface SessionOptions {
  /** null when the browser has no usable storage (no indexedDB global); a memory store is used then. */
  readonly store: SlotStore | null
  readonly content: GameContent
  readonly now: () => number
  readonly seed: () => number
  readonly log?: (event: string, data?: unknown) => void
}

export interface Session {
  boot(): Promise<{ readonly state: GameState; readonly notices: readonly SessionNotice[] }>
  /** Writes the auto slot unless it is guarded. Never rejects; returns a notice only for the first failure in a row. */
  autosave(state: GameState): Promise<SessionNotice | null>
  load(slotId: string): Promise<{ readonly state: GameState | null; readonly notice: SessionNotice }>
  newGame(): GameState
  autosaveBlocked(): boolean
}

export function createSession(options: SessionOptions): Session {
  const { content, now, seed } = options
  const log = options.log ?? ((): void => {})
  // Falls back to a memory store (this tab only) when the real store is missing or rejects.
  let store: SlotStore = options.store ?? createMemorySlotStore()
  let autoBlocked = false
  let autosaveFailing = false

  const fresh = (): GameState => createInitialState(content, seed() >>> 0)

  /** Copies an unreadable record so that nothing is lost even after the guard is lifted. */
  async function keepUnreadable(slotId: string): Promise<void> {
    const record = await store.get(slotId)
    if (record === null) return
    await store.put({ ...record, id: `${slotId}-unreadable-${now()}` })
  }

  return {
    async boot() {
      if (options.store === null) return { state: fresh(), notices: ["storage-unavailable"] }
      let loaded: Awaited<ReturnType<typeof loadSlot>>
      try {
        loaded = await loadSlot(store, AUTO_SLOT)
      } catch (error) {
        log("storage-unavailable", String(error))
        store = createMemorySlotStore()
        return { state: fresh(), notices: ["storage-unavailable"] }
      }
      if (loaded === null) return { state: fresh(), notices: [] }
      if (loaded.ok) return { state: normalizeLoaded(loaded.state, content), notices: [] }
      log("load-failed", loaded.reason)
      autoBlocked = true
      try {
        await keepUnreadable(AUTO_SLOT)
      } catch (error) {
        log("keep-unreadable-failed", String(error))
      }
      return { state: fresh(), notices: ["load-failed"] }
    },

    async autosave(state) {
      if (autoBlocked) {
        log("autosave-skipped", "auto slot unreadable")
        return null
      }
      try {
        await saveToSlot(store, AUTO_SLOT, "auto", state, now())
        autosaveFailing = false
        return null
      } catch (error) {
        log("autosave-failed", String(error))
        if (autosaveFailing) return null
        autosaveFailing = true
        return "autosave-failed"
      }
    },

    async load(slotId) {
      let loaded: Awaited<ReturnType<typeof loadSlot>>
      try {
        loaded = await loadSlot(store, slotId)
      } catch (error) {
        log("load-failed", String(error))
        return { state: null, notice: "load-failed" }
      }
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
