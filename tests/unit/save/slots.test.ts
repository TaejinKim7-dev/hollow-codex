import { describe, expect, it } from "vitest"
import { createMemorySlotStore } from "../../../src/save/slot-store.ts"
import { AUTO_SLOT, loadSlot, saveToSlot } from "../../../src/save/slots.ts"
import { stateWith } from "../core/fixture.ts"

describe("save slots", () => {
  it("saves and loads through the memory store", async () => {
    const store = createMemorySlotStore()
    await saveToSlot(store, "slot-1", "첫 저장", stateWith({}), 100)
    expect(await loadSlot(store, "slot-1")).toEqual({ ok: true, state: stateWith({}) })
    expect(await loadSlot(store, "missing")).toBeNull()
  })
  it("the auto slot is overwritten in place", async () => {
    const store = createMemorySlotStore()
    await saveToSlot(store, AUTO_SLOT, "auto", stateWith({}), 100)
    await saveToSlot(store, AUTO_SLOT, "auto", stateWith({ turn: 5 }), 200)
    const all = await store.list()
    expect(all).toHaveLength(1)
    expect(all[0]).toMatchObject({ id: "auto", createdAt: 100, updatedAt: 200 })
  })
})