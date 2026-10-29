import type { Id, Pos, Virtue } from "../core/types.ts"
import type { Ground, ObjectDef } from "./ground.ts"

export type FactKind = "person" | "place" | "word" | "song" | "meaning" | "creature"
/** 옛 시트 칸 `[sheet, index]` 또는 새 캐릭터 그림 `char.<이름>`(assets/sprites/characters/<이름>/). */
export type SpriteRef = { readonly sheet: string; readonly index: number } | { readonly char: string }

/** content/audio.yaml: 소리 이름 → 파일 키(assets/audio/sfx/<키>.ogg, assets/audio/bgm/<키>.ogg). */
export interface AudioMap {
  readonly sfx: Readonly<Record<string, string>>
  readonly footsteps: Readonly<Partial<Record<Ground, string>>>
  readonly music: Readonly<Record<Id, string>>
}

/** content/combat.yaml: 전투 규칙 수치(없으면 DEFAULT_COMBAT_RULES). */
export interface CombatRules {
  /** 대상이 바라보는 방향에 대한 공격 위치별 배율 */
  readonly direction: { readonly front: number; readonly side: number; readonly back: number; readonly vsAllies: boolean }   // vsAllies: 아군도 방향 보정을 받는가(기본 꺼짐: 적만 측면·배후에 약하다)
  /** 연계 추가타: ratio = 그 유닛의 정상 피해에 곱함, enemies = 적 쪽 연계 허용 */
  readonly chain: { readonly ratio: number; readonly enemies: boolean }
  /** 전투 격자 타일 글자 → 방어 보정(그 칸에 선 유닛이 받는 피해에서 뺀다, 최소 피해 1) */
  readonly terrain: Readonly<Record<string, { readonly defense: number }>>
}
export const DEFAULT_COMBAT_RULES: CombatRules = { direction: { front: 1, side: 1.25, back: 1.5, vsAllies: false }, chain: { ratio: 0.5, enemies: false }, terrain: {} }

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
  readonly isOverworld?: boolean                                  // D20 — M2 신규
  readonly terrainCost?: Readonly<Record<string, number | null>>  // D20 — 글리프 → 이동 비용(null = 통행 불가)
  readonly objects?: readonly { readonly id: Id; readonly at: Pos }[]   // 집·나무 같은 물건(발자국은 rows에 합쳐진다)
  readonly ground?: readonly (readonly (Ground | null)[])[]             // 칸마다 땅 종류(옛 그림 타일은 null). 땅이 하나도 없으면 생략
}
export interface NpcDef {
  readonly map: Id; readonly pos: Pos; readonly nameKey: string; readonly greetKey: string; readonly sprite: SpriteRef
  readonly topics: Readonly<Record<string, readonly Topic[]>>      // 키: "name" | "job" | 단서 id (D8, D9)
  readonly companion?: CompanionDef
  readonly schedule?: Readonly<Record<string, Pos>>                // D13 — 키: "0" | "6" | "12" | "18"
}
export interface RingDef {
  readonly at: Pos
  readonly nameKey: string
  readonly songKey: string
  readonly fact: Id        // fact required to unlock (D10)
  readonly onOverworld: Id // which MapDef.id this ring is on
}
export interface CrisisOptionDef {
  readonly requires: readonly Id[]; readonly requiresDeductions: readonly Id[]
  readonly setsFlags: readonly Id[]; readonly labelKey: string; readonly textKey: string
}
export interface GameContent {
  readonly sheets: Readonly<Record<string, { readonly file: string; readonly columns: number; readonly tile: number }>>
  readonly tiles: Readonly<Record<string, { readonly sprite?: SpriteRef; readonly ground?: Ground; readonly object?: Id; readonly walk: number | null }>>   // ASCII 1글자 → 타일
  readonly objects: Readonly<Record<Id, ObjectDef>>
  readonly audio: AudioMap
  readonly combat?: CombatRules
  readonly playerSprite: SpriteRef
  readonly maps: Readonly<Record<Id, MapDef>>
  readonly npcs: Readonly<Record<Id, NpcDef>>
  readonly facts: Readonly<Record<Id, { readonly kind: FactKind; readonly labelKey: string; readonly hintKey: string }>>
  readonly deductions: Readonly<Record<Id, {
    readonly sentenceKey: string; readonly hintKey: string; readonly answer: readonly [Id, Id, Id]; readonly unlocks: readonly Id[]
    readonly codexWord?: Id   // M5: the one word this virtue's codex page takes; must be one of answer
  }>>
  readonly crises: Readonly<Record<Id, { readonly npc: Id; readonly textKey: string; readonly options: Readonly<Record<Id, CrisisOptionDef>> }>>
  readonly creatures: Readonly<Record<Id, { readonly nameKey: string; readonly evil: boolean; readonly hp: number; readonly attack: number; readonly sprite: SpriteRef; readonly lore: Id }>>
  readonly encounters: Readonly<Record<Id, { readonly map: Id; readonly grid: readonly string[]; readonly allyStart: readonly Pos[]; readonly enemies: readonly { readonly creature: Id; readonly at: Pos }[]; readonly music: Id; readonly repeatable?: boolean }>>
  readonly abilities: Readonly<Record<Id, { readonly nameKey: string }>>
  readonly strings: Readonly<Record<string, Readonly<Record<string, string>>>>   // 언어 코드 → 키 → 문구
  readonly rings: Readonly<Record<Id, RingDef>>   // D14
  readonly start: { readonly map: Id; readonly pos: Pos; readonly hp: number; readonly attack: number }
}

/** content/ 아래 상대 경로("towns/kalas/npcs.yaml") → YAML 파싱 결과 */
export type RawContent = Readonly<Record<string, unknown>>
