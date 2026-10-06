import { describe, expect, it } from "vitest"
import { compileContent } from "../../src/content/compile.ts"
import { loadContentDir, parseYamlFile } from "../../src/content/load-node.ts"

const raw = () => loadContentDir("tests/fixtures/content-min")
const withFile = (path: string, value: unknown) => ({ ...raw(), [path]: value })

type Obj = Record<string, unknown>
const sage = (): Obj => {
  const list = raw()["towns/min/npcs.yaml"] as Obj[]
  return structuredClone(list[0] as Obj)
}
const npcsWith = (patch: (npc: Obj) => void): Obj[] => {
  const npc = sage()
  patch(npc)
  return [npc]
}
const topicsOf = (npc: Obj) => npc["topics"] as Record<string, Obj>
const mapWith = (patch: Obj): Obj[] => {
  const list = raw()["towns/min/maps.yaml"] as Obj[]
  return [{ ...structuredClone(list[0] as Obj), ...patch }]
}

describe("compileContent", () => {
  it("compiles the minimal fixture without errors", () => {
    const { content, errors } = compileContent(raw())
    expect(errors).toEqual([])
    expect(content?.maps["map.min"]?.rows).toEqual(["####", "#..#", "####"])
    expect(content?.npcs["npc.min.sage"]?.topics["job"]?.[0]?.grants).toEqual(["word.min.answer"])
    expect(content?.tiles["."]).toEqual({ sprite: { sheet: "test", index: 0 }, walk: 1 })
    expect(content?.start).toEqual({ map: "map.min", pos: { x: 1, y: 1 }, hp: 10, attack: 3 })
  })

  it("reports a topic that grants an unknown fact", () => {
    const npcs = npcsWith((n) => { (topicsOf(n)["job"] as Obj)["grants"] = ["word.min.answer", "fact.missing"] })
    const { content, errors } = compileContent(withFile("towns/min/npcs.yaml", npcs))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("towns/min/npcs.yaml") && e.includes("fact.missing"))).toBe(true)
  })

  it("reports a missing string key", () => {
    const npcs = npcsWith((n) => { n["name"] = "npc.nobody.name" })
    const { content, errors } = compileContent(withFile("towns/min/npcs.yaml", npcs))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("npc.nobody.name"))).toBe(true)
  })

  it("reports a map exit to an unknown map", () => {
    const maps = mapWith({ exits: [{ at: [1, 1], to: "map.nowhere", arrive: [1, 1] }] })
    const { content, errors } = compileContent(withFile("towns/min/maps.yaml", maps))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("towns/min/maps.yaml") && e.includes("map.nowhere"))).toBe(true)
  })

  it("reports rows of unequal width", () => {
    const maps = mapWith({ rows: ["####", "#..", "####"] })
    const { content, errors } = compileContent(withFile("towns/min/maps.yaml", maps))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("unequal width"))).toBe(true)
  })

  it("reports a deduction answer word nobody can grant", () => {
    const npcs = npcsWith((n) => { (topicsOf(n)["job"] as Obj)["grants"] = [] })
    const { content, errors } = compileContent(withFile("towns/min/npcs.yaml", npcs))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("word.min.answer has no grant path"))).toBe(true)
  })

  it("reports a tile character missing from tiles.yaml", () => {
    const maps = mapWith({ rows: ["####", "#.~#", "####"] })
    const { content, errors } = compileContent(withFile("towns/min/maps.yaml", maps))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes('tile "~" missing'))).toBe(true)
  })

  it("reports a topic key that is not name, job or a fact id", () => {
    const npcs = npcsWith((n) => { topicsOf(n)["아무거나"] = { text: "npc.min.sage.job.t" } })
    const { content, errors } = compileContent(withFile("towns/min/npcs.yaml", npcs))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes("towns/min/npcs.yaml") && e.includes("아무거나"))).toBe(true)
  })

  it("reports every error at once", () => {
    const npcs = npcsWith((n) => { n["name"] = "npc.nobody.name" })
    const maps = mapWith({ rows: ["####", "#..", "####"] })
    const { content, errors } = compileContent({ ...raw(), "towns/min/npcs.yaml": npcs, "towns/min/maps.yaml": maps })
    expect(content).toBeNull()
    expect(errors.length).toBeGreaterThanOrEqual(2)
    expect(errors.some((e) => e.includes("npc.nobody.name"))).toBe(true)
    expect(errors.some((e) => e.includes("unequal width"))).toBe(true)
  })

  it("reports a denied term in a string value", () => {
    const strings = { ...(raw()["strings/ko.yaml"] as Obj), x: "금지된땅의 노래" }
    const { content, errors } = compileContent(withFile("strings/ko.yaml", strings))
    expect(content).toBeNull()
    expect(errors.some((e) => e.includes('denied term "금지된땅"'))).toBe(true)
  })

  it("reports a file at an unknown path", () => {
    const { errors } = compileContent(withFile("towns/min/extra.yaml", []))
    expect(errors).toContain("towns/min/extra.yaml: unknown content file")
  })

  it("reports a missing or malformed denylist", () => {
    const { ["ip-denylist.yaml"]: _drop, ...without } = raw()
    for (const bad of [without, withFile("ip-denylist.yaml", null), withFile("ip-denylist.yaml", { latin: ["x"], hangl: ["y"] }), withFile("ip-denylist.yaml", { latin: "x", hangul: [] })]) {
      const { content, errors } = compileContent(bad)
      expect(content).toBeNull()
      expect(errors.some((e) => e.startsWith("ip-denylist.yaml: "))).toBe(true)
    }
  })

  it("names the offending id in a denied-term error", () => {
    const facts = [...(raw()["towns/min/facts.yaml"] as Obj[]), { id: "fact.forbiddenland", kind: "place", label: "fact.min.person.label", hint: "fact.min.person.hint" }]
    const { content, errors } = compileContent(withFile("towns/min/facts.yaml", facts))
    expect(content).toBeNull()
    expect(errors).toContain('towns/min/facts.yaml: id fact.forbiddenland: denied term "forbiddenland"')
  })
})

describe("parseYamlFile", () => {
  it("prefixes YAML syntax errors with the relative file path", () => {
    expect(() => parseYamlFile("towns/min/npcs.yaml", "a: [1, 2\nb: c")).toThrow(/^towns\/min\/npcs\.yaml: /)
  })
})
