import { describe, expect, it } from "vitest"
import { findDenied, parseDenylist, scanRepoText } from "../../src/content/denylist.ts"

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
    // "nooks" used to be here; plurals are now caught on purpose (see the next test)
    expect(findDenied([{ where: "w", text: "they played snooker by the nookery" }], deny)).toEqual([])
  })
  it("catches English plural and possessive endings of a Latin term", () => {
    for (const text of ["the zorvanias", "two nooks", "Lord Zorvan's hall", "many nookes", "content.zorvanias"]) {
      expect(findDenied([{ where: "w", text }], deny), text).toHaveLength(1)
    }
  })
  it("ignores clean text", () => {
    expect(findDenied([{ where: "w", text: "칼라스의 등불" }], deny)).toEqual([])
  })
})

describe("camelCase and y→ies variants", () => {
  it("catches a denied term as a camelCase compound part", () => {
    for (const text of ["openZorvaniaGate", "myLordZorvanHall", "ZorvaniaHub"]) {
      expect(findDenied([{ where: "w", text }], deny), text).toHaveLength(1)
    }
  })
  it("catches the -ies plural of a term ending in y", () => {
    const y = { latin: ["fazolmy"], hangul: [] }
    for (const text of ["fazolmy", "two fazolmies", "the fazolmies"]) {
      expect(findDenied([{ where: "w", text }], y), text).toHaveLength(1)
    }
  })
  it("scanRepoText catches a camelCase file name", () => {
    const out = scanRepoText([{ path: "src/zorvaniaGate.ts", text: "ok\n" }], deny)
    expect(out).toEqual(['src/zorvaniaGate.ts: path: denied term "zorvania"'])
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

describe("scanRepoText", () => {
  it("reports denied terms in file names and in file lines, with line numbers", () => {
    const files = [
      { path: "src/zorvania-gate.ts", text: "export const a = 1\n" },
      { path: "tests/x.test.ts", text: "ok line\n// the nooks of the hall\n" },
      { path: "scripts/clean.ts", text: "nothing here\n" }
    ]
    expect(scanRepoText(files, deny)).toEqual([
      'src/zorvania-gate.ts: path: denied term "zorvania"',
      'tests/x.test.ts:2: denied term "nook"'
    ])
  })
})
