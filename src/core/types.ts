export type Id = string
export type Dir = "n" | "e" | "s" | "w"
export type Virtue = "honesty" | "compassion" | "valor" | "justice" | "sacrifice" | "honor" | "spirituality" | "humility"
export interface Pos { readonly x: number; readonly y: number }

export interface CombatUnit {
  readonly id: Id; readonly side: "ally" | "enemy"; readonly creature: Id | null; readonly pos: Pos
  readonly hp: number; readonly attack: number; readonly defending: boolean
  readonly moved: boolean; readonly acted: boolean; readonly gone: null | "dead" | "retreated" | "fled"
}
export interface CombatState {
  readonly encounterId: Id; readonly grid: readonly string[]; readonly units: readonly CombatUnit[]
  readonly active: Id; readonly round: number
  readonly intents: Readonly<Record<Id, { readonly moveTo: Pos; readonly attack: Id | null }>>
  readonly returnPos: Pos                                         // D12
}
export type CombatAction =
  | { kind: "move"; to: Pos } | { kind: "attack"; dir: Dir } | { kind: "defend" } | { kind: "push"; dir: Dir }
  | { kind: "persuade"; dir: Dir } | { kind: "flee" } | { kind: "endTurn" }

export type Command =
  | { type: "move"; dir: Dir } | { type: "moveTo"; target: Pos } | { type: "interact"; at?: Pos }
  | { type: "ask"; topic: string } | { type: "choose"; optionId: Id } | { type: "endTalk" }
  | { type: "fillSlot"; deductionId: Id; slot: number; word: Id | null }
  | { type: "resolveCrisis"; crisisId: Id; optionId: Id } | { type: "recruit"; npcId: Id }
  | { type: "combat"; action: CombatAction }

export type GameEvent =
  | { type: "moved"; pos: Pos } | { type: "bumped" } | { type: "mapChanged"; mapId: Id }
  | { type: "said"; npcId: Id; textKey: string; lie: boolean }
  | { type: "factLearned"; id: Id }
  | { type: "deductionConfirmed"; id: Id } | { type: "abilityUnlocked"; id: Id }
  | { type: "deed"; virtue: Virtue; deed: Id }
  | { type: "companionJoined"; npcId: Id } | { type: "companionLeft"; npcId: Id }
  | { type: "crisisResolved"; crisisId: Id; optionId: Id }
  | { type: "combatStarted"; encounterId: Id } | { type: "combatEnded"; outcome: "victory" | "defeat" | "fled" }
  | { type: "sfx"; name: string } | { type: "music"; track: Id }

export interface GameState {
  readonly version: 1
  readonly rng: number
  readonly turn: number
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
