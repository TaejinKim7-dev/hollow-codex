// 공용 core 테스트 fixture (Task 5가 만들고 Task 6–13이 쓴다). 좌표·id를 바꾸지 말 것.
import type { GameContent, Score } from "../../../src/content/types.ts"
import type { Command, GameEvent, GameState } from "../../../src/core/types.ts"
import { createInitialState } from "../../../src/core/state.ts"
import { step } from "../../../src/core/step.ts"

const oneNote: Score = { tempo: 120, loop: true, channels: [{ wave: "square50", volume: 0.5, notes: "A4/4" }] }

const factIds = [
  "word.alpha", "word.beta", "word.gamma", "word.decoy",
  "fact.secret", "fact.person.sage", "fact.slime-lore", "fact.bandit-lore"
] as const

const stringKeys = [
  ...factIds.flatMap((id) => [`${id}.label`, `${id}.hint`]),
  "sage.name", "sage.greet", "sage.job", "sage.alpha", "sage.beta", "sage.self", "sage.ask", "sage.asked",
  "o.h", "o.h.t", "o.l", "o.l.t",
  "ally.name", "ally.greet", "ally.job",
  "deduction.test.sentence", "deduction.test.hint",
  "crisis.test.text", "opt.a.label", "opt.a.text", "opt.b.label", "opt.b.text",
  "creature.slime.name", "creature.bandit.name",
  "ability.see-lies.name",
  "npc.default.unknown", "topic.name", "topic.job"
]

export function testContent(): GameContent {
  return {
    sheets: { t: { file: "t.png", columns: 4 } },
    tiles: {
      ".": { sprite: { sheet: "t", index: 0 }, walk: 1 },
      ",": { sprite: { sheet: "t", index: 1 }, walk: 2 },
      ">": { sprite: { sheet: "t", index: 2 }, walk: 1 },
      "#": { sprite: { sheet: "t", index: 3 }, walk: null }
    },
    playerSprite: { sheet: "t", index: 0 },
    maps: {
      "map.a": {
        rows: ["######", "#..,.#", "#....>", "#....#", "######"],
        exits: [{ at: { x: 5, y: 2 }, to: "map.b", arrive: { x: 1, y: 1 } }],
        music: "music.a",
        encounters: [{ at: { x: 1, y: 3 }, id: "enc.a" }],
        enterFlags: [],
        heals: true
      },
      "map.b": {
        rows: ["####", "#..#", "####"],
        exits: [],
        music: "music.b",
        encounters: [],
        enterFlags: ["flag.visited-b"],
        heals: false
      }
    },
    npcs: {
      "npc.sage": {
        map: "map.a", pos: { x: 3, y: 3 }, nameKey: "sage.name", greetKey: "sage.greet", sprite: { sheet: "t", index: 0 },
        topics: {
          name: [{ textKey: "sage.name", grants: ["fact.person.sage"] }],
          job: [{ textKey: "sage.job", grants: ["word.alpha", "word.decoy"] }],
          "word.alpha": [{ textKey: "sage.alpha", grants: ["word.beta"] }],
          "word.beta": [{ textKey: "sage.beta", requires: ["fact.secret"], grants: ["word.gamma"] }],
          "fact.person.sage": [{ textKey: "sage.self", lie: true }],
          "word.decoy": [
            {
              textKey: "sage.ask",
              excludeFlags: ["flag.asked"],
              choice: [
                { optionId: "opt.honest", labelKey: "o.h", textKey: "o.h.t", grants: ["fact.secret"], setsFlags: ["flag.asked"] },
                { optionId: "opt.lie", labelKey: "o.l", textKey: "o.l.t", deed: { virtue: "honesty", deed: "deed.lie" }, setsFlags: ["flag.asked"] }
              ]
            },
            { textKey: "sage.asked" }
          ]
        }
      },
      "npc.ally": {
        map: "map.b", pos: { x: 2, y: 1 }, nameKey: "ally.name", greetKey: "ally.greet", sprite: { sheet: "t", index: 1 },
        topics: {
          name: [{ textKey: "ally.name" }],
          job: [{ textKey: "ally.job" }]
        },
        companion: { virtue: "honesty", joinRequires: ["fact.secret"], leaveAfterDeeds: 2, rejoinRequires: ["word.gamma"], hp: 6, attack: 2 }
      }
    },
    facts: {
      "word.alpha": { kind: "word", labelKey: "word.alpha.label", hintKey: "word.alpha.hint" },
      "word.beta": { kind: "word", labelKey: "word.beta.label", hintKey: "word.beta.hint" },
      "word.gamma": { kind: "word", labelKey: "word.gamma.label", hintKey: "word.gamma.hint" },
      "word.decoy": { kind: "word", labelKey: "word.decoy.label", hintKey: "word.decoy.hint" },
      "fact.secret": { kind: "meaning", labelKey: "fact.secret.label", hintKey: "fact.secret.hint" },
      "fact.person.sage": { kind: "person", labelKey: "fact.person.sage.label", hintKey: "fact.person.sage.hint" },
      "fact.slime-lore": { kind: "creature", labelKey: "fact.slime-lore.label", hintKey: "fact.slime-lore.hint" },
      "fact.bandit-lore": { kind: "creature", labelKey: "fact.bandit-lore.label", hintKey: "fact.bandit-lore.hint" }
    },
    deductions: {
      "deduction.test": {
        sentenceKey: "deduction.test.sentence",
        hintKey: "deduction.test.hint",
        answer: ["word.alpha", "word.beta", "word.gamma"],
        unlocks: ["ability.see-lies"]
      }
    },
    crises: {
      "crisis.test": {
        npc: "npc.sage",
        textKey: "crisis.test.text",
        options: {
          "opt.a": { requires: ["fact.secret"], requiresDeductions: [], setsFlags: ["flag.a"], labelKey: "opt.a.label", textKey: "opt.a.text" },
          "opt.b": { requires: [], requiresDeductions: ["deduction.test"], setsFlags: ["flag.b"], labelKey: "opt.b.label", textKey: "opt.b.text" }
        }
      }
    },
    creatures: {
      "creature.slime": { nameKey: "creature.slime.name", evil: false, hp: 4, attack: 2, sprite: { sheet: "t", index: 2 }, lore: "fact.slime-lore" },
      "creature.bandit": { nameKey: "creature.bandit.name", evil: true, hp: 3, attack: 4, sprite: { sheet: "t", index: 3 }, lore: "fact.bandit-lore" }
    },
    encounters: {
      "enc.a": {
        map: "map.a",
        grid: [".....", ".....", ".....", ".....", "....."],
        allyStart: [{ x: 2, y: 4 }, { x: 1, y: 4 }, { x: 3, y: 4 }],
        enemies: [{ creature: "creature.slime", at: { x: 2, y: 0 } }, { creature: "creature.bandit", at: { x: 4, y: 1 } }],
        music: "music.battle"
      }
    },
    abilities: { "ability.see-lies": { nameKey: "ability.see-lies.name" } },
    music: { "music.a": oneNote, "music.b": oneNote, "music.battle": oneNote },
    strings: Object.fromEntries(stringKeys.map((k) => [k, k])),
    start: { map: "map.a", pos: { x: 1, y: 1 }, hp: 10, attack: 3 }
  }
}

export function deepFreeze<T>(x: T): T {
  if (x !== null && typeof x === "object") {
    Object.freeze(x)
    for (const v of Object.values(x)) deepFreeze(v)
  }
  return x
}

export function stateWith(patch: Partial<GameState>): GameState {
  return deepFreeze({ ...createInitialState(testContent(), 1), ...patch })
}

export function run(state: GameState, commands: readonly Command[]): { state: GameState; events: GameEvent[] } {
  const content = testContent()
  const events: GameEvent[] = []
  let current = state
  for (const command of commands) {
    const r = step(current, command, content)
    current = r.state
    events.push(...r.events)
  }
  return { state: current, events }
}

export function at(x: number, y: number): GameState {
  return stateWith({ player: { ...stateWith({}).player, pos: { x, y } } })
}
