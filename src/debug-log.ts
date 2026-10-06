// Key-point debug log so a reported issue can be traced. Quiet by default;
// `?debug=1` prints each entry as console.warn; the last entries stay in
// memory (`window.hollowDebugLog.entries()`).

export interface DebugLogEntry {
  readonly t: number
  readonly event: string
  readonly data: unknown
}

export interface DebugLog {
  log(event: string, data?: unknown): void
  entries(): readonly DebugLogEntry[]
}

export interface DebugLogOptions {
  readonly enabled: boolean
  readonly limit?: number
  readonly warn?: (...args: unknown[]) => void
  readonly now?: () => number
  /** Receives every entry (the dev server's file log); a throwing sink is ignored. */
  readonly sink?: (entry: DebugLogEntry) => void
}

export function createDebugLog(options: DebugLogOptions): DebugLog {
  const limit = options.limit ?? 300
  const warn = options.warn ?? ((...args: unknown[]) => console.warn(...args))
  const now = options.now ?? (() => Date.now())
  const buffer: DebugLogEntry[] = []
  return {
    log(event, data) {
      const entry = { t: now(), event, data }
      buffer.push(entry)
      if (buffer.length > limit) buffer.splice(0, buffer.length - limit)
      if (options.enabled) warn("[hc]", event, data)
      try {
        options.sink?.(entry)
      } catch {
        // logging must never affect play
      }
    },
    entries() {
      return buffer.slice()
    }
  }
}

/** `?debug=1` in the page URL turns console output on. */
export function debugEnabledFromUrl(href: string): boolean {
  try {
    return new URL(href).searchParams.get("debug") === "1"
  } catch {
    return false
  }
}
