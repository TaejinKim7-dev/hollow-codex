import { describe, expect, it } from "vitest"
import { findDenied, parseDenylist } from "../../src/content/denylist.ts"

// Stand-in terms: the real list may only appear in content/ip-denylist.yaml.
const deny = { latin: ["zorvania", "nook", "lord zorvan"], hangul: ["조르바니아"] }

describe("findDenied", () => {
  it("catches a denied word regardless of case", () => {
    const out = findDenied([{ where: "strings:greet", text: "Welcome to ZORVANIA" }], deny)
    expect(out).toEqual(['strings:greet: denied term "zorvania"'])
  })
  it("catches a Hangul transliteration", () => {
    expect(findDenied([{ where: "w", text: "조르바니아의 땅" }], deny)).toHaveLength(1)
  })
  it("matches multi-word terms across spaces, underscores and hyphens", () => {
    expect(findDenied([{ where: "w", text: "npc.lord_zorvan" }, { where: "v", text: "Lord-Zorvan" }], deny)).toHaveLength(2)
  })
  it("does not flag a denied term inside a longer word", () => {
    expect(findDenied([{ where: "w", text: "they played snooker in the nooks" }], deny)).toEqual([])
  })
  it("ignores clean text", () => {
    expect(findDenied([{ where: "w", text: "칼라스의 등불" }], deny)).toEqual([])
  })
})

describe("parseDenylist", () => {
  it("reads latin and hangul lists, lower-casing latin", () => {
    expect(parseDenylist({ latin: ["Zorvania"], hangul: ["조르바니아"] })).toEqual({ latin: ["zorvania"], hangul: ["조르바니아"] })
  })
  it("treats a missing file as empty lists", () => {
    expect(parseDenylist(undefined)).toEqual({ latin: [], hangul: [] })
  })
})
