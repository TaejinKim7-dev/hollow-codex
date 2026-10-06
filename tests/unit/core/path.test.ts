import { describe, expect, it } from "vitest"
import { findPath } from "../../../src/core/world/path.ts"
import { testContent } from "./fixture.ts"

const c = testContent()

describe("findPath", () => {
  it("finds the shortest path around walls", () => {
    expect(findPath(c, "map.a", { x: 1, y: 1 }, { x: 4, y: 3 }, () => false)).toHaveLength(5)
  })
  it("routes around a blocked tile", () => {
    const path = findPath(c, "map.a", { x: 2, y: 3 }, { x: 4, y: 3 }, (p) => p.x === 3 && p.y === 3)
    expect(path).toEqual(["n", "e", "e", "s"])
  })
  it("returns null when unreachable", () => {
    expect(findPath(c, "map.a", { x: 1, y: 1 }, { x: 0, y: 0 }, () => false)).toBeNull()
  })
  it("returns [] when already there", () => {
    expect(findPath(c, "map.a", { x: 1, y: 1 }, { x: 1, y: 1 }, () => false)).toEqual([])
  })
})
