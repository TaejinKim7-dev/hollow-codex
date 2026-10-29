export type Id = string
export type Dir = "n" | "e" | "s" | "w"
export type Virtue = "honesty" | "compassion" | "valor" | "justice" | "sacrifice" | "honor" | "spirituality" | "humility"
export interface Pos { readonly x: number; readonly y: number }

/** 책략(각각 능력 해금 필요): calm 달래기(마음 감소) · guard 막기(주변 아군 방어) · mark 표식(다음 타격이 더 아픔) · declare 선언(그 적이 다음에 나를 노림) · share 나눔(내 체력을 덜어 인접 아군 회복) · still 가라앉힘(주변 2칸 적의 마음 감소). */
export type SkillId = "calm" | "guard" | "mark" | "declare" | "share" | "still"
export const SKILL_ABILITY: Readonly<Record<SkillId, string>> = {
  calm: "ability.compassion-persuade", guard: "ability.valor-shield", mark: "ability.justice-eye",
  declare: "ability.honor-truth", share: "ability.sacrifice-meaning", still: "ability.spirituality-mind"
}

export interface CombatUnit {
  readonly id: Id; readonly side: "ally" | "enemy"; readonly creature: Id | null; readonly pos: Pos
  readonly hp: number; readonly attack: number; readonly defending: boolean
  readonly moved: boolean; readonly acted: boolean; readonly gone: null | "dead" | "retreated" | "fled"
  readonly taunt?: Id                                              // 선언: 이 적은 이번 라운드 이 아군을 노린다(라운드가 바뀌면 사라짐)
  readonly marked?: boolean                                        // 표식(라운드가 바뀌면 사라짐): 맞는 피해 ×markBonus
  readonly morale?: number; readonly maxMorale?: number            // 마음(적만). 없으면 마음 규칙 없음
  readonly maxHp?: number                                          // 체력 막대의 가득 찬 값(없으면 시작 hp). 패배 뒤 낮은 hp로 시작해도 막대가 가득 차 보이지 않게
  readonly facing?: Dir                                            // 바라보는 방향(없으면 방향 보정 없음). 이동·공격 때 갱신
}
export interface CombatState {
  readonly encounterId: Id; readonly grid: readonly string[]; readonly units: readonly CombatUnit[]
  readonly active: Id; readonly round: number
  readonly intents: Readonly<Record<Id, { readonly moveTo: Pos; readonly attack: Id | null }>>
  readonly returnPos: Pos                                         // D12
  readonly breath?: number                                        // 숨(책략 자원)
  readonly momentum?: number                                      // 기세(없으면 0). 가득 차면 special 가능
}
export type CombatAction =
  | { kind: "move"; to: Pos } | { kind: "attack"; dir: Dir } | { kind: "defend" } | { kind: "push"; dir: Dir }
  | { kind: "persuade"; dir: Dir } | { kind: "flee" } | { kind: "endTurn" } | { kind: "special"; dir: Dir }
  | { kind: "skill"; skill: SkillId; dir?: Dir }

export type Command =
  | { type: "move"; dir: Dir } | { type: "moveTo"; target: Pos } | { type: "interact"; at?: Pos }
  | { type: "ask"; topic: string } | { type: "choose"; optionId: Id } | { type: "endTalk" }
  | { type: "fillSlot"; deductionId: Id; slot: number; word: Id | null }
  | { type: "resolveCrisis"; crisisId: Id; optionId: Id } | { type: "recruit"; npcId: Id }
  | { type: "combat"; action: CombatAction }
  | { type: "ringStep"; to: Id }
  | { type: "setLanguage"; language: "ko" | "en" }
  | { type: "writeCodex"; deductionId: Id; word: Id }
  | { type: "writeFinal"; word: Id }

export type GameEvent =
  | { type: "moved"; pos: Pos } | { type: "bumped" } | { type: "mapChanged"; mapId: Id }
  | { type: "said"; npcId: Id; textKey: string; lie: boolean }
  | { type: "factLearned"; id: Id }
  | { type: "deductionConfirmed"; id: Id } | { type: "abilityUnlocked"; id: Id }
  | { type: "deed"; virtue: Virtue; deed: Id }
  | { type: "companionJoined"; npcId: Id } | { type: "companionLeft"; npcId: Id }
  | { type: "crisisResolved"; crisisId: Id; optionId: Id }
  | { type: "combatStarted"; encounterId: Id } | { type: "combatEnded"; outcome: "victory" | "defeat" | "fled" }
  | { type: "combatHit"; attacker: Id; target: Id; amount: number; defeated: boolean; hp: number; at: Pos; chain?: number; special?: boolean }   // 연출용: 맞은 뒤 남은 hp, at = 때린 순간 공격자 칸
  | { type: "combatYield"; target: Id; how: "persuaded" | "retreated" }                              // 연출용: 죽지 않고 물러남
  | { type: "sfx"; name: string } | { type: "music"; track: Id }
  | { type: "timePassed"; hour: number; day: number } | { type: "dayPassed"; day: number }
  | { type: "ringTraveled"; from: Id; to: Id }
  | { type: "ringUnlocked"; ringId: Id; fact: Id }
  | { type: "companionJoinRejected"; npcId: Id }
  | { type: "codexWritten"; deductionId: Id; word: Id }
  | { type: "codexFinalChosen"; word: Id }
  | { type: "epilogue"; kind: "truth" | "love" | "courage" }

export interface TimeState { readonly hour: number; readonly day: number }

/** 봉인 서고의 빈 경전 8쪽과 마지막 장 (M5, D11–D14). */
export interface CodexState {
  readonly answers: Readonly<Record<Id, Id>>   // deductionId → wordId (그 쪽에 적은 한 단어)
  readonly finalWord: Id | null                  // 마지막 장에 고른 단어
  readonly finalOpen: boolean                    // 8쪽이 모두 적히면 true
}

export interface GameState {
  readonly version: 1
  readonly rng: number
  readonly turn: number
  readonly language: "ko" | "en"                              // i18n: UI/locale
  readonly time: TimeState                                    // D12 — move 1회당 1시간
  readonly rings: { readonly visited: readonly Id[]; readonly knownFacts: readonly Id[] }   // D15
  readonly codex: CodexState                                  // M5 — 빈 경전
  readonly mapId: Id
  readonly player: { readonly pos: Pos; readonly facing: Dir; readonly hp: number; readonly maxHp: number; readonly attack: number }
  readonly facts: readonly Id[]                                  // 정렬·중복 없음
  readonly deductions: Readonly<Record<Id, { readonly slots: readonly (Id | null)[]; readonly confirmed: boolean }>>
  readonly abilities: readonly Id[]                              // 정렬·중복 없음
  readonly deeds: readonly { readonly virtue: Virtue; readonly deed: Id; readonly turn: number }[]
  readonly party: readonly Id[]
  readonly departed: readonly Id[]
  readonly joinedAt: Readonly<Record<Id, number>>                // D11
  readonly crises: Readonly<Record<Id, Id>>
  readonly flags: readonly Id[]                                  // 정렬·중복 없음
  readonly dialogue: { readonly npcId: Id; readonly pendingChoice: string | null } | null   // pendingChoice = 선택을 기다리는 topic 키
  readonly combat: CombatState | null
  readonly clearedEncounters: readonly Id[]
}

export interface StepResult { readonly state: GameState; readonly events: readonly GameEvent[] }
