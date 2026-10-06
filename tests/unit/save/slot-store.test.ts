// B-4(d): a blocked or stalled indexedDB.open must not hang the boot or leak an unhandled rejection.
// createIndexedDbSlotStore falls back to the in-memory store on timeout or onblocked.
import { afterEach, describe, expect, it, vi } from "vitest"
import { createIndexedDbSlotStore } from "../../../src/save/slot-store.ts"
import type { SlotRecord } from "../../../src/save/slot-store.ts"

const record = (id: string): SlotRecord => ({ id, name: id, createdAt: 1, updatedAt: 2, files: [] })

/** An open request that never fires onsuccess, onerror or onblocked, like a stalled upgrade. */
function neverOpens(): IDBFactory {
  return {
    open: () => ({ onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null, result: null, error: null })
  } as unknown as IDBFactory
}

describe("createIndexedDbSlotStore fallback", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("falls back to a memory store when open never completes within the timeout", async () => {
    vi.useFakeTimers()
    const store = createIndexedDbSlotStore(neverOpens())
    const put = store.put(record("slot-1"))
    await vi.advanceTimersByTimeAsync(3001)
    await expect(put).resolves.toBeUndefined()
    await expect(store.get("slot-1")).resolves.toEqual(record("slot-1"))
  })

  it("falls back when the upgrade is blocked", async () => {
    const factory = {
      open: () => {
        const req: Record<string, unknown> = {}
        setTimeout(() => (req["onblocked"] as (() => void) | undefined)?.(), 0)
        return req
      }
    } as unknown as IDBFactory
    const store = createIndexedDbSlotStore(factory)
    const put = store.put(record("slot-2"))
    await expect(put).resolves.toBeUndefined()
    await expect(store.get("slot-2")).resolves.toEqual(record("slot-2"))
  })
})
