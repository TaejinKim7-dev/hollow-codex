import type { Id, Pos, Virtue } from "../core/types.ts"

export type FactKind = "person" | "place" | "word" | "song" | "meaning" | "creature"
export interface SpriteRef { readonly sheet: string; readonly index: number }

export interface Score {                        // D5. 형식은 Task 14
  readonly tempo: number                        // 4분음표 bpm
  readonly loop: boolean
  readonly channels: readonly { readonly wave: "square50" | "square25" | "triangle" | "noise"; readonly volume: number; readonly notes: string }[]
}

export interface ChoiceOption {
  readonly optionId: Id; readonly labelKey: string; readonly textKey: string
  readonly deed?: { readonly virtue: Virtue; readonly deed: Id }
  readonly grants?: readonly Id[]; readonly setsFlags?: readonly Id[]
}
export interface Topic {
  readonly textKey: string
  readonly requires?: readonly Id[]; readonly requiresFlags?: readonly Id[]; readonly excludeFlags?: readonly Id[]
  readonly grants?: readonly Id[]; readonly setsFlags?: readonly Id[]
  readonly lie?: boolean
  readonly choice?: readonly ChoiceOption[]
}
export interface CompanionDef {
  readonly virtue: Virtue; readonly joinRequires: readonly Id[]; readonly leaveAfterDeeds: number
  readonly rejoinRequires: readonly Id[]; readonly hp: number; readonly attack: number
}
export interface MapDef {
  readonly rows: readonly string[]
  readonly exits: readonly { readonly at: Pos; readonly to: Id; readonly arrive: Pos }[]
  readonly music: Id
  readonly encounters: readonly { readonly at: Pos; readonly id: Id }[]
  readonly enterFlags: readonly Id[]
  readonly heals: boolean
}
export interface NpcDef {
  readonly map: Id; readonly pos: Pos; readonly nameKey: string; readonly greetKey: string; readonly sprite: SpriteRef
  readonly topics: Readonly<Record<string, readonly Topic[]>>      // 키: "name" | "job" | 단서 id (D8, D9)
  readonly companion?: CompanionDef
}
export interface CrisisOptionDef {
  readonly requires: readonly Id[]; readonly requiresDeductions: readonly Id[]
  readonly setsFlags: readonly Id[]; readonly labelKey: string; readonly textKey: string
}
export interface GameContent {
  readonly sheets: Readonly<Record<string, { readonly file: string; readonly columns: number }>>
  readonly tiles: Readonly<Record<string, { readonly sprite: SpriteRef; readonly walk: number | null }>>   // ASCII 1글자 → 타일
  readonly playerSprite: SpriteRef
  readonly maps: Readonly<Record<Id, MapDef>>
  readonly npcs: Readonly<Record<Id, NpcDef>>
  readonly facts: Readonly<Record<Id, { readonly kind: FactKind; readonly labelKey: string; readonly hintKey: string }>>
  readonly deductions: Readonly<Record<Id, { readonly sentenceKey: string; readonly hintKey: string; readonly answer: readonly [Id, Id, Id]; readonly unlocks: readonly Id[] }>>
  readonly crises: Readonly<Record<Id, { readonly npc: Id; readonly textKey: string; readonly options: Readonly<Record<Id, CrisisOptionDef>> }>>
  readonly creatures: Readonly<Record<Id, { readonly nameKey: string; readonly evil: boolean; readonly hp: number; readonly attack: number; readonly sprite: SpriteRef; readonly lore: Id }>>
  readonly encounters: Readonly<Record<Id, { readonly map: Id; readonly grid: readonly string[]; readonly allyStart: readonly Pos[]; readonly enemies: readonly { readonly creature: Id; readonly at: Pos }[]; readonly music: Id }>>
  readonly abilities: Readonly<Record<Id, { readonly nameKey: string }>>
  readonly music: Readonly<Record<Id, Score>>
  readonly strings: Readonly<Record<string, string>>
  readonly start: { readonly map: Id; readonly pos: Pos; readonly hp: number; readonly attack: number }
}

/** content/ 아래 상대 경로("towns/kalas/npcs.yaml") → YAML 파싱 결과 */
export type RawContent = Readonly<Record<string, unknown>>
