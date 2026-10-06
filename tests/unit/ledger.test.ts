import { describe, expect, it } from "vitest"
import { ALLOWED_LICENSES, checkLedger, parseLedger, toCredits } from "../../src/content/ledger.ts"

const md = [
  "# Asset ledger", "",
  "| path | source | author | license |",
  "|---|---|---|---|",
  "| `assets/fonts/neodgm.woff2` | https://github.com/neodgm/neodgm | Eunbin Jeong | OFL-1.1 |"
].join("\n")
const row = (license: string, path = "assets/x.png") => ({ path, source: "s", author: "a", license })

describe("asset ledger", () => {
  it("parses the ledger table", () => {
    expect(parseLedger(md)).toEqual([{ path: "assets/fonts/neodgm.woff2", source: "https://github.com/neodgm/neodgm", author: "Eunbin Jeong", license: "OFL-1.1" }])
  })
  it("flags an asset file missing from the ledger", () => {
    expect(checkLedger([], ["assets/tiles/a.png"])).toEqual(["assets/tiles/a.png: not in assets/LEDGER.md"])
  })
  it("flags a ledger row whose file does not exist", () => {
    expect(checkLedger([row("CC0-1.0")], [])).toEqual(["assets/x.png: listed in assets/LEDGER.md but missing"])
  })
  it("rejects NC and ND licenses", () => {
    expect(checkLedger([row("CC-BY-NC-4.0")], ["assets/x.png"])).toHaveLength(1)
    expect(checkLedger([row("CC-BY-ND-4.0")], ["assets/x.png"])).toHaveLength(1)
  })
  it("accepts every allowed license", () => {
    for (const l of ALLOWED_LICENSES) expect(checkLedger([row(l)], ["assets/x.png"])).toEqual([])
  })
  it("ignores LEDGER.md and license text files themselves", () => {
    expect(checkLedger([], ["assets/LEDGER.md", "assets/fonts/LICENSE-neodgm.txt", "assets/tiles/LICENSE-kenney.txt"])).toEqual([])
  })
  it("credits strip the URL scheme", () => {
    expect(toCredits(parseLedger(md))[0]?.source).toBe("github.com/neodgm/neodgm")
  })
})
