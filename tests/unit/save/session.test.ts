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

/** A store whose every call rejects, like IndexedDB when storage is blocked. */
function brokenStore(): SlotStore {
  const fail = (): Promise<never> => Promise.reject(new Error("indexedDB blocked"))
  return { list: fail, get: fail, put: fail, remove: fail, getActive: fail, setActive: fail }
}

describe("session when storage fails", () => {
  it("boots a new game on a memory store when the store rejects", async () => {
    const session = createSession(opts(brokenStore()))
    const boot = await session.boot()
    expect(boot.notices).toEqual(["storage-unavailable"])
    expect(boot.state).toEqual(createInitialState(content, 7))
    // the memory fallback really stores: a later load sees the autosave
    await expect(session.autosave({ ...boot.state, turn: 4 })).resolves.toBeNull()
    expect((await session.load(AUTO_SLOT)).state?.turn).toBe(4)
  })

  it("boots on a memory store when there is no store at all (no indexedDB global)", async () => {
    const session = createSession({ ...opts(createMemorySlotStore()), store: null })
    const boot = await session.boot()
    expect(boot.notices).toEqual(["storage-unavailable"])
    expect(boot.state.turn).toBe(0)
  })

  it("autosave never rejects; it reports the first failure once until a save succeeds", async () => {
    let failing = true
    const memory = createMemorySlotStore()
    const flaky: SlotStore = {
      ...memory,
      put: (r) => (failing ? Promise.reject(new Error("quota")) : memory.put(r))
    }
    const session = createSession(opts(flaky))
    const boot = await session.boot()
    await expect(session.autosave(boot.state)).resolves.toBe("autosave-failed")
    await expect(session.autosave(boot.state)).resolves.toBeNull()
    failing = false
    await expect(session.autosave(boot.state)).resolves.toBeNull()
    failing = true
    await expect(session.autosave(boot.state)).resolves.toBe("autosave-failed")
  })
})

describe("menu save / load / new game", () => {
  it("saves to a manual slot and loads it back (normalized, same state)", async () => {
    const store = createMemorySlotStore()
    const session = createSession(opts(store))
    const boot = await session.boot()
    const played = { ...boot.state, turn: 33, facts: ["word.truth"] }
    expect(await session.save("slot-2", played)).toBe("saved")
    const back = await session.load("slot-2")
    expect(back).toEqual({ state: played, notice: "loaded" })
  })

  it("loading an empty slot changes nothing and says so", async () => {
    const session = createSession(opts(createMemorySlotStore()))
    await session.boot()
    expect(await session.load("slot-3")).toEqual({ state: null, notice: "slot-empty" })
  })

  it("loading an unreadable manual slot fails without lifting the auto guard", async () => {
    const store = createMemorySlotStore()
    await store.put(raw(AUTO_SLOT, "{broken"))
    await store.put(raw("slot-1", "{also broken"))
    const session = createSession(opts(store))
    await session.boot()
    expect(await session.load("slot-1")).toEqual({ state: null, notice: "load-failed-kept" })
    expect(session.autosaveBlocked()).toBe(true)
  })

  it("a failing manual save reports save-failed and does not reject", async () => {
    const memory = createMemorySlotStore()
    const store: SlotStore = { ...memory, put: () => Promise.reject(new Error("quota")) }
    const session = createSession(opts(store))
    const boot = await session.boot()
    await expect(session.save("slot-1", boot.state)).resolves.toBe("save-failed")
  })

  it("new game returns the initial state from content", async () => {
    const session = createSession(opts(createMemorySlotStore()))
    await session.boot()
    expect(session.newGame()).toEqual(createInitialState(content, 7))
  })

  it("lists the four menu slots with their last update time", async () => {
    const store = createMemorySlotStore()
    const session = createSession({ ...opts(store), now: () => 4242 })
    const boot = await session.boot()
    await session.save("slot-1", boot.state)
    const slots = await session.slots()
    expect(slots.map((s) => s.id)).toEqual(["auto", "slot-1", "slot-2", "slot-3"])
    expect(slots.find((s) => s.id === "slot-1")?.updatedAt).toBe(4242)
    expect(slots.find((s) => s.id === "slot-2")?.updatedAt).toBeNull()
  })
})

describe("failed menu load keeps the current game and says so", () => {
  it("a store that throws on load reports load-failed-kept, not the boot notice", async () => {
    let throwing = false
    const memory = createMemorySlotStore()
    const store: SlotStore = { ...memory, get: (id) => (throwing ? Promise.reject(new Error("io")) : memory.get(id)) }
    const session = createSession(opts(store))
    await session.boot()
    throwing = true
    expect(await session.load("slot-1")).toEqual({ state: null, notice: "load-failed-kept" })
  })
  it("the boot notice talks about a new game; the menu notice says the current game is kept (ko and en)", () => {
    const ko = content.strings["ko"]!
    const en = content.strings["en"]!
    expect(ko["ui.notice.load-failed-kept"]).toBeDefined()
    expect(en["ui.notice.load-failed-kept"]).toBeDefined()
    expect(ko["ui.notice.load-failed-kept"]).not.toContain("새로 시작")
    expect(en["ui.notice.load-failed-kept"]).not.toMatch(/new game/i)
  })
})
