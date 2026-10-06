import type { GameState } from "../core/types.ts"
import { deserialize, serialize } from "../core/save/serialize.ts"
import type { SlotStore } from "./slot-store.ts"

export const AUTO_SLOT = "auto"
export const STATE_FILE = "state.json"
/** Slots the menu offers: the autosave slot plus three manual slots. */
export const MENU_SLOTS: readonly string[] = [AUTO_SLOT, "slot-1", "slot-2", "slot-3"]

export async function saveToSlot(store: SlotStore, slotId: string, name: string, state: GameState, now: number): Promise<void> {
  const existing = await store.get(slotId)
  await store.put({
    id: slotId,
    name,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    files: [{ path: STATE_FILE, data: new TextEncoder().encode(serialize(state)) }]
  })
}

export async function loadSlot(store: SlotStore, slotId: string): Promise<ReturnType<typeof deserialize> | null> {
  const record = await store.get(slotId)
  if (record === null) return null
  const file = record.files.find((f) => f.path === STATE_FILE)
  if (file === undefined) return { ok: false, reason: "corrupt" }
  return deserialize(new TextDecoder().decode(file.data))
}