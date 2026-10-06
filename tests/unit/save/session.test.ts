// Boot / autosave / slot handling that main.ts wires to the DOM. Runs against the memory store.
import { describe, expect, it } from "vitest"
import { createSession } from "../../../src/save/session.ts"
import { createMemorySlotStore } from "../../../src/save/slot-store.ts"
import type { SlotRecord, SlotStore } from "../../../src/save/slot-store.ts"
import { AUTO_SLOT, STATE_FILE, saveToSlot } from "../../../src/save/slots.ts"
import { createInitialState } from "../../../src/core/state.ts"
import { loadRealContent } from "../../scenario/play.ts"

const content = loadRealContent()
const enc = (text: string): Uint8Array => new TextEncoder().encode(text)
const raw = (id: string, text: string): SlotRecord => ({ id, name: id, createdAt: 1, updatedAt: 1, files: [{ path: STATE_FILE, data: enc(text) }] })
const opts = (store: SlotStore) => ({ store, content, now: () => 1000, seed: () => 7 })

describe("session boot and the unreadable-slot guard", () => {
  for (const [label, text] of [
    ["corrupt JSON", "{not json"],
    ["a future-version save", JSON.stringify({ format: "hollow-codex-save", version: 99, state: {} })]
  ] as const) {
    it(`an unreadable auto slot (${label}) is never overwritten by autosave`, async () => {
      const store = createMemorySlotStore()
      await store.put(raw(AUTO_SLOT, text))
      const session = createSession(opts(store))
      const boot = await session.boot()
      expect(boot.notices).toContain("load-failed")
      expect(boot.state.turn).toBe(0)
      await session.autosave({ ...boot.state, turn: 60 })
      const after = await store.get(AUTO_SLOT)
      expect(new TextDecoder().decode(after!.files[0]!.data)).toBe(text)
    })
  }

  it("keeps a copy of the unreadable record under another id", async () => {
    const store = createMemorySlotStore()
    await store.put(raw(AUTO_SLOT, "{broken"))
    await createSession(opts(store)).boot()
    const copies = (await store.list()).filter((r) => r.id !== AUTO_SLOT)
    expect(copies).toHaveLength(1)
    expect(copies[0]!.id).toMatch(/^auto-unreadable-/)
    expect(new TextDecoder().decode(copies[0]!.files[0]!.data)).toBe("{broken")
  })

  it("autosave resumes after the player starts a new game", async () => {
    const store = createMemorySlotStore()
    await store.put(raw(AUTO_SLOT, "{broken"))
    const session = createSession(opts(store))
    await session.boot()
    const fresh = session.newGame()
    await session.autosave({ ...fresh, turn: 3 })
    const back = await session.load(AUTO_SLOT)
    expect(back.state?.turn).toBe(3)
  })

  it("autosave resumes after the player successfully loads another slot", async () => {
    const store = createMemorySlotStore()
    await store.put(raw(AUTO_SLOT, "{broken"))
    await saveToSlot(store, "slot-1", "slot-1", { ...createInitialState(content, 1), turn: 12 }, 5)
    const session = createSession(opts(store))
    await session.boot()
    const loaded = await session.load("slot-1")
    expect(loaded.notice).toBe("loaded")
    await session.autosave({ ...loaded.state!, turn: 20 })
    expect((await session.load(AUTO_SLOT)).state?.turn).toBe(20)
  })

  it("boot normalizes a loaded old save against content (missing deduction pages)", async () => {
    const store = createMemorySlotStore()
    const m1 = {
      version: 1, rng: 1, turn: 9, mapId: "map.kalas",
      player: { pos: { x: 10, y: 10 }, facing: "s", hp: 12, maxHp: 12, attack: 3 },
      facts: [], deductions: { "deduction.honesty": { slots: [null, null, null], confirmed: false } },
      abilities: [], deeds: [], party: [], departed: [], joinedAt: {}, crises: {}, flags: [],
      dialogue: null, combat: null, clearedEncounters: []
    }
    await store.put(raw(AUTO_SLOT, JSON.stringify({ format: "hollow-codex-save", version: 1, state: m1 })))
    const boot = await createSession(opts(store)).boot()
    expect(boot.notices).toEqual([])
    expect(boot.state.turn).toBe(9)
    expect(boot.state.deductions["deduction.compassion"]).toEqual({ slots: [null, null, null], confirmed: false })
  })

  it("a fresh browser boots a new game with no notice", async () => {
    const boot = await createSession(opts(createMemorySlotStore())).boot()
    expect(boot.notices).toEqual([])
    expect(boot.state).toEqual(createInitialState(content, 7))
  })
})
