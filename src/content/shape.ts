// Shape readers for raw YAML values. Each reader pushes an error and returns a
// fallback on bad input; callers compare `errors.length` before/after reading an
// entry to decide whether to keep it.
import type { Pos } from "../core/types.ts"
import type { SpriteRef } from "./types.ts"

export type Obj = Record<string, unknown>

export const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v)

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v)

export interface Reader {
  readonly file: string
  readonly errors: string[]
  fail(where: string, msg: string): void
  obj(v: unknown, where: string): Obj
  arr(v: unknown, where: string): unknown[]
  /** Top-level list file: null/undefined (empty file) → []. */
  listFile(v: unknown): unknown[]
  str(o: Obj, key: string, where: string): string
  optStr(o: Obj, key: string, where: string): string | undefined
  num(o: Obj, key: string, where: string): number
  bool(o: Obj, key: string, where: string, dflt?: boolean): boolean
  optBool(o: Obj, key: string, where: string): boolean | undefined
  strList(o: Obj, key: string, where: string): string[]
  /** Missing → [] */
  strListOr(o: Obj, key: string, where: string): string[]
  optStrList(o: Obj, key: string, where: string): string[] | undefined
  pos(v: unknown, where: string): Pos
  sprite(v: unknown, where: string): SpriteRef
}

export function makeReader(file: string, errors: string[]): Reader {
  const fail = (where: string, msg: string): void => {
    errors.push(where === "" ? `${file}: ${msg}` : `${file}: ${where}: ${msg}`)
  }
  const field = (where: string, key: string): string => (where === "" ? key : `${where}.${key}`)
  const readStrList = (v: unknown, where: string): string[] => {
    if (!Array.isArray(v) || !v.every((x) => typeof x === "string")) {
      fail(where, "expected a list of strings")
      return []
    }
    return v as string[]
  }
  const r: Reader = {
    file,
    errors,
    fail,
    obj(v, where) {
      if (isObj(v)) return v
      fail(where, "expected a mapping")
      return {}
    },
    arr(v, where) {
      if (Array.isArray(v)) return v
      fail(where, "expected a list")
      return []
    },
    listFile(v) {
      if (v === null || v === undefined) return []
      return r.arr(v, "")
    },
    str(o, key, where) {
      const v = o[key]
      if (typeof v === "string" && v !== "") return v
      fail(field(where, key), v === undefined ? "missing required string" : "expected a non-empty string")
      return ""
    },
    optStr(o, key, where) {
      return o[key] === undefined ? undefined : r.str(o, key, where)
    },
    num(o, key, where) {
      const v = o[key]
      if (typeof v === "number" && Number.isFinite(v)) return v
      fail(field(where, key), v === undefined ? "missing required number" : "expected a number")
      return 0
    },
    bool(o, key, where, dflt) {
      const v = o[key]
      if (v === undefined && dflt !== undefined) return dflt
      if (typeof v === "boolean") return v
      fail(field(where, key), v === undefined ? "missing required boolean" : "expected a boolean")
      return false
    },
    optBool(o, key, where) {
      return o[key] === undefined ? undefined : r.bool(o, key, where)
    },
    strList(o, key, where) {
      if (o[key] === undefined) {
        fail(field(where, key), "missing required list")
        return []
      }
      return readStrList(o[key], field(where, key))
    },
    strListOr(o, key, where) {
      return o[key] === undefined ? [] : readStrList(o[key], field(where, key))
    },
    optStrList(o, key, where) {
      return o[key] === undefined ? undefined : readStrList(o[key], field(where, key))
    },
    pos(v, where) {
      if (Array.isArray(v) && v.length === 2 && isInt(v[0]) && isInt(v[1])) return { x: v[0], y: v[1] }
      fail(where, "expected [x, y] integers")
      return { x: 0, y: 0 }
    },
    sprite(v, where) {
      if (Array.isArray(v) && v.length === 2 && typeof v[0] === "string" && isInt(v[1]) && v[1] >= 0) {
        return { sheet: v[0], index: v[1] }
      }
      fail(where, "expected [sheet, index]")
      return { sheet: "", index: 0 }
    }
  }
  return r
}
