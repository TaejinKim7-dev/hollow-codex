import { describe, expect, it } from "vitest"
import { step } from "../../../src/core/step.ts"
import { keyToCommand, pointerToCommand } from "../../../src/input/commands.ts"
import { at, stateWith, testContent } from "../core/fixture.ts"

const c = testContent()

describe("keyToCommand", () => {
  it.each([["ArrowUp", "n"], ["w", "n"], ["D", "e"], ["ArrowDown", "s"], ["a", "w"]])("%s moves %s in explore", (k, d) => {
    expect(keyToCommand(k, "explore")).toEqual({ type: "move", dir: d })
  })
  it("Enter and Space interact; Escape opens the menu; Tab opens the notebook", () => {
    expect(keyToCommand("Enter", "explore")).toEqual({ type: "interact" })
    expect(keyToCommand(" ", "explore")).toEqual({ type: "interact" })
    expect(keyToCommand("Escape", "explore")).toEqual({ ui: "menu" })
    expect(keyToCommand("Escape", "combat")).toEqual({ ui: "menu" })
    for (const m of ["explore", "dialogue", "combat"] as const) expect(keyToCommand("Tab", m)).toEqual({ ui: "notebook" })
    expect(keyToCommand("ArrowUp", "combat")).toBeNull(); expect(keyToCommand("q", "explore")).toBeNull()
  })
  it("arrow keys do nothing in dialogue mode", () => { expect(keyToCommand("ArrowUp", "dialogue")).toBeNull() })
  it("Escape ends the talk in dialogue mode", () => { expect(keyToCommand("Escape", "dialogue")).toEqual({ type: "endTalk" }) })
})

describe("pointerToCommand", () => {
  it("combat mode turns a tap into a combat move", () => {
    const s = step(at(1, 2), { type: "move", dir: "s" }, c).state
    expect(pointerToCommand({ x: 2, y: 2 }, s, c)).toEqual({ type: "combat", action: { kind: "move", to: { x: 2, y: 2 } } })
  })
  it("tapping an adjacent NPC interacts", () => {
    const s = stateWith({ player: { ...stateWith({}).player, pos: { x: 2, y: 3 } } })
    expect(pointerToCommand({ x: 3, y: 3 }, s, c)).toEqual({ type: "interact", at: { x: 3, y: 3 } })
  })
  it("tapping a far NPC does nothing", () => { expect(pointerToCommand({ x: 3, y: 3 }, stateWith({}), c)).toBeNull() })
  it("tapping a far tile walks there", () => {
    expect(pointerToCommand({ x: 4, y: 2 }, stateWith({}), c)).toEqual({ type: "moveTo", target: { x: 4, y: 2 } })
  })
})