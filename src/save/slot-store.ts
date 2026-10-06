// Save slots live in one IndexedDB database in the player's browser only.
// A memory store backs the unit tests.

export interface SlotFile {
  readonly path: string
  readonly data: Uint8Array
}

export interface SlotRecord {
  readonly id: string
  readonly name: string
  readonly createdAt: number
  readonly updatedAt: number
  readonly files: readonly SlotFile[]
}

export interface SlotStore {
  list(): Promise<SlotRecord[]>
  get(id: string): Promise<SlotRecord | null>
  put(record: SlotRecord): Promise<void>
  remove(id: string): Promise<void>
  getActive(): Promise<string | null>
  setActive(id: string | null): Promise<void>
}

export function createMemorySlotStore(): SlotStore {
  const records = new Map<string, SlotRecord>()
  let active: string | null = null
  return {
    list: () => Promise.resolve([...records.values()]),
    get: (id) => Promise.resolve(records.get(id) ?? null),
    put: (record) => {
      records.set(record.id, record)
      return Promise.resolve()
    },
    remove: (id) => {
      records.delete(id)
      return Promise.resolve()
    },
    getActive: () => Promise.resolve(active),
    setActive: (id) => {
      active = id
      return Promise.resolve()
    }
  }
}

const DB_NAME = "hollow-codex-save-slots"
const SLOTS = "slots"
const META = "meta"
const ACTIVE_KEY = "active"
/** A stalled or blocked upgrade must not hang boot forever; fall back to memory after this. */
const OPEN_TIMEOUT_MS = 3000

function isRecord(value: unknown): value is SlotRecord {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  return (
    typeof record["id"] === "string" &&
    typeof record["name"] === "string" &&
    typeof record["createdAt"] === "number" &&
    typeof record["updatedAt"] === "number" &&
    Array.isArray(record["files"])
  )
}

/**
 * IndexedDB-backed store. Never touches localStorage/sessionStorage (audit:dist forbids them).
 * If open times out, is blocked or fails, every later call uses the in-memory store instead, so a
 * broken/blocked IndexedDB degrades to "this tab only" saves instead of hanging or rejecting.
 */
export function createIndexedDbSlotStore(factory: IDBFactory): SlotStore {
  const memory = createMemorySlotStore()
  let fellBack = false

  function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      let settled = false
      let timer: ReturnType<typeof setTimeout>
      const fail = (error: Error): void => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(error)
      }
      timer = setTimeout(() => fail(new Error("indexedDB open timed out")), OPEN_TIMEOUT_MS)
      let request: IDBOpenDBRequest
      try {
        request = factory.open(DB_NAME, 1)
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)))
        return
      }
      request.onupgradeneeded = () => {
        request.result.createObjectStore(SLOTS, { keyPath: "id" })
        request.result.createObjectStore(META)
      }
      request.onsuccess = () => {
        if (settled) {
          request.result.close()
          return
        }
        settled = true
        clearTimeout(timer)
        const db = request.result
        db.onversionchange = () => db.close()
        resolve(db)
      }
      request.onerror = () => fail(request.error ?? new Error("indexedDB open failed"))
      request.onblocked = () => fail(new Error("indexedDB open blocked"))
    })
  }

  async function run<T>(storeName: string, mode: IDBTransactionMode, body: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await open()
    try {
      return await new Promise<T>((resolve, reject) => {
        const request = body(db.transaction(storeName, mode).objectStore(storeName))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error("indexedDB request failed"))
      })
    } finally {
      db.close()
    }
  }

  /** Runs against IndexedDB until it fails once, then against the memory store for good. */
  async function viaDb<T>(indexed: () => Promise<T>, fromMemory: () => Promise<T>): Promise<T> {
    if (fellBack) return fromMemory()
    try {
      return await indexed()
    } catch {
      fellBack = true
      return fromMemory()
    }
  }

  return {
    list() {
      return viaDb(
        () => run(SLOTS, "readonly", (store) => store.getAll()).then((all) => (all as unknown[]).filter(isRecord)),
        () => memory.list()
      )
    },
    get(id) {
      return viaDb(
        () => run(SLOTS, "readonly", (store) => store.get(id)).then((value) => (isRecord(value) ? value : null)),
        () => memory.get(id)
      )
    },
    put(record) {
      return viaDb(
        () => run(SLOTS, "readwrite", (store) => store.put(record)).then(() => undefined),
        () => memory.put(record)
      )
    },
    remove(id) {
      return viaDb(
        () => run(SLOTS, "readwrite", (store) => store.delete(id)).then(() => undefined),
        () => memory.remove(id)
      )
    },
    getActive() {
      return viaDb(
        () => run(META, "readonly", (store) => store.get(ACTIVE_KEY)).then((value) => (typeof value === "string" ? value : null)),
        () => memory.getActive()
      )
    },
    setActive(id) {
      return viaDb(
        () =>
          (id === null
            ? run(META, "readwrite", (store) => store.delete(ACTIVE_KEY))
            : run(META, "readwrite", (store) => store.put(id, ACTIVE_KEY))
          ).then(() => undefined),
        () => memory.setActive(id)
      )
    }
  }
}