// The ring menu: lists known destinations, says where the player stands, and only enables travel on a ring.
import { describe, expect, it } from "vitest"
import type { GameContent } from "../../../src/content/types.ts"
import type { Pos } from "../../../src/core/types.ts"
import { ringsView } from "../../../src/ui/view-model.ts"
import { stateWith, testContent } from "../core/fixture.ts"

const ring = (at: Pos, fact: string, key: string) => ({ at, nameKey: `${key}.name`, songKey: `${key}.song`, fact, onOverworld: "map.a" })
const base = testContent()
const c: GameContent = {
  ...base,
  rings: { "ring.a": ring({ x: 1, y: 1 }, "fact.alpha", "word.alpha"), "ring.c": ring({ x: 4, y: 1 }, "fact.gamma", "word.gamma") },
  strings: { ko: { ...base.strings["ko"], "word.alpha.name": "A", "word.alpha.song": "a-song", "word.gamma.name": "C", "word.gamma.song": "c-song" } }
}
const at = (pos: Pos, knownFacts: string[]) => stateWith({ player: { ...stateWith({}).player, pos }, rings: { visited: [], knownFacts } })

describe("ringsView", () => {
  it("on a ring: the other known rings are travel targets (the current one is not)", () => {
    const v = ringsView(at({ x: 1, y: 1 }, ["fact.alpha", "fact.gamma"]), c)
    expect(v.here).toBe("A")
    expect(v.rings).toEqual([{ id: "ring.c", name: "C", song: "c-song", canTravel: true }])
  })
  it("off a ring: destinations are listed but travel is disabled", () => {
    const v = ringsView(at({ x: 3, y: 2 }, ["fact.alpha", "fact.gamma"]), c)
    expect(v.here).toBeNull()
    expect(v.rings.map((r) => [r.id, r.canTravel])).toEqual([["ring.a", false], ["ring.c", false]])
  })
  it("no known rings: empty list", () => {
    expect(ringsView(at({ x: 1, y: 1 }, []), c).rings).toEqual([])
  })
})
