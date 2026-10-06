// Pure YAML → GameContent compiler. Collects every error; content is null if any.
// Check groups run in order: 1 shape, 2 duplicate ids, 3 references, 4 string keys,
// 5 map/grid geometry, 6 grant paths, 7 deduction answers, 8 denied terms.
import type { Id, Pos, Virtue } from "../core/types.ts"
import { findDenied, parseDenylist } from "./denylist.ts"
import { isObj, makeReader } from "./shape.ts"
import type { Obj, Reader } from "./shape.ts"
import type {
  ChoiceOption, CompanionDef, CrisisOptionDef, FactKind, GameContent, MapDef, NpcDef, RawContent, Score, SpriteRef, Topic
} from "./types.ts"

const VIRTUES: readonly Virtue[] = ["honesty", "compassion", "valor", "justice", "sacrifice", "honor", "spirituality", "humility"]
const FACT_KINDS: readonly FactKind[] = ["person", "place", "word", "song", "meaning", "creature"]
const WAVES: readonly string[] = ["square50", "square25", "triangle", "noise"]
const ALWAYS_REQUIRED_STRINGS: readonly string[] = ["npc.default.unknown", "topic.name", "topic.job"]
const DENYLIST_FILE = "ip-denylist.yaml"
const KO_STRINGS_FILE = "strings/ko.yaml"
/** 언어 파일 이름 패턴: strings/<lang>.yaml (ko는 필수, en은 선택). */
const STRINGS_FILE_RE = /^strings\/([a-z]+)\.yaml$/

type Mutable<T> = { -readonly [K in keyof T]: T[K] }
type Fact = GameContent["facts"][string]
type Deduction = Omit<GameContent["deductions"][string], "answer"> & { readonly answer: readonly Id[] }
type Crisis = GameContent["crises"][string]
type Creature = GameContent["creatures"][string]
type Encounter = GameContent["encounters"][string]
type Moongate = GameContent["moongates"][string]

/** Compiled entries of one kind plus the file each id came from. */
interface Table<T> { readonly items: Record<Id, T>; readonly file: Record<Id, string> }
const table = <T>(): Table<T> => ({ items: {}, file: {} })

interface Draft {
  sheets: Mutable<GameContent["sheets"]>
  tiles: Mutable<GameContent["tiles"]>
  playerSprite: SpriteRef | null
  maps: Table<MapDef>
  npcs: Table<NpcDef>
  facts: Table<Fact>
  deductions: Table<Deduction>
  crises: Table<Crisis>
  creatures: Table<Creature>
  encounters: Table<Encounter>
  abilities: Table<{ readonly nameKey: string }>
  music: Table<Score>
  moongates: Table<Moongate>
  strings: Record<string, Record<string, string>>   // 언어 → 키 → 문구
  start: GameContent["start"] | null
}

interface Ctx { readonly shape: string[]; readonly dups: string[] }

function put<T>(ctx: Ctx, t: Table<T>, kind: string, file: string, id: Id, value: T): void {
  const prev = t.file[id]
  if (prev !== undefined) {
    ctx.dups.push(`${file}: duplicate ${kind} id "${id}" (first defined in ${prev})`)
    return
  }
  t.items[id] = value
  t.file[id] = file
}

/** Reads each entry of a list file; keeps it only if reading it added no errors. */
function eachEntry(r: Reader, value: unknown, read: (o: Obj, id: Id, where: string) => void): void {
  r.listFile(value).forEach((entry, i) => {
    const o = r.obj(entry, `[${i}]`)
    const before = r.errors.length
    const id = r.str(o, "id", `[${i}]`)
    if (r.errors.length > before) return
    read(o, id, id)
  })
}

// ---------- group 1+2: shape and duplicates ----------

function readTiles(r: Reader, v: unknown, d: Draft): void {
  if (v === null || v === undefined) {
    r.fail("", "missing player sprite (file is empty)")
    return
  }
  const o = r.obj(v, "")
  for (const [id, s] of Object.entries(o["sheets"] === undefined ? {} : r.obj(o["sheets"], "sheets"))) {
    const before = r.errors.length
    const so = r.obj(s, `sheets.${id}`)
    const file = r.str(so, "file", `sheets.${id}`)
    const columns = r.num(so, "columns", `sheets.${id}`)
    if (r.errors.length === before && (!Number.isInteger(columns) || columns <= 0)) r.fail(`sheets.${id}.columns`, "expected a positive integer")
    if (r.errors.length === before) d.sheets[id] = { file, columns }
  }
  for (const [ch, t] of Object.entries(o["tiles"] === undefined ? {} : r.obj(o["tiles"], "tiles"))) {
    const before = r.errors.length
    if (ch.length !== 1) r.fail(`tiles."${ch}"`, "tile key must be exactly one character")
    const to = r.obj(t, `tiles."${ch}"`)
    const sprite = r.sprite(to["sprite"], `tiles."${ch}".sprite`)
    const walk = to["walk"]
    if (walk !== null && !(typeof walk === "number" && Number.isFinite(walk))) r.fail(`tiles."${ch}".walk`, "expected a number or null")
    if (r.errors.length === before) d.tiles[ch] = { sprite, walk: walk as number | null }
  }
  const before = r.errors.length
  const player = o["player"] === undefined ? (r.fail("player", "missing player sprite"), null) : r.sprite(o["player"], "player")
  if (player !== null && r.errors.length === before) d.playerSprite = player
}

function readStart(r: Reader, v: unknown, d: Draft): void {
  if (v === null || v === undefined) {
    r.fail("", "missing start definition (file is empty)")
    return
  }
  const o = r.obj(v, "")
  const before = r.errors.length
  const start = { map: r.str(o, "map", ""), pos: r.pos(o["pos"], "pos"), hp: r.num(o, "hp", ""), attack: r.num(o, "attack", "") }
  if (r.errors.length === before) d.start = start
}

function readAbilities(r: Reader, v: unknown, d: Draft, ctx: Ctx): void {
  eachEntry(r, v, (o, id, w) => {
    const before = r.errors.length
    const nameKey = r.str(o, "name", w)
    if (r.errors.length === before) put(ctx, d.abilities, "ability", r.file, id, { nameKey })
  })
}

/** strings/<lang>.yaml의 모든 키를 d.strings[lang]에 담는다. 같은 파일 안 중복 키는 나중 값이 덮는다. */
function readStrings(r: Reader, v: unknown, d: Draft, lang: string): void {
  if (v === null || v === undefined) return
  const target = d.strings[lang] ?? (d.strings[lang] = {})
  for (const [k, s] of Object.entries(r.obj(v, ""))) {
    if (typeof s === "string") target[k] = s
    else r.fail(k, "expected a string value")
  }
}

function readCreatures(r: Reader, v: unknown, d: Draft, ctx: Ctx): void {
  eachEntry(r, v, (o, id, w) => {
    const before = r.errors.length
    const c: Creature = {
      nameKey: r.str(o, "name", w), evil: r.bool(o, "evil", w), hp: r.num(o, "hp", w), attack: r.num(o, "attack", w),
      sprite: r.sprite(o["sprite"], `${w}.sprite`), lore: r.str(o, "lore", w)
    }
    if (r.errors.length === before) put(ctx, d.creatures, "creature", r.file, id, c)
  })
}

function readMusic(r: Reader, v: unknown, d: Draft, ctx: Ctx, id: Id): void {
  const o = r.obj(v, "")
  const before = r.errors.length
  const channels = r.arr(o["channels"], "channels").map((c, i) => {
    const co = r.obj(c, `channels[${i}]`)
    const wave = r.str(co, "wave", `channels[${i}]`)
    if (wave !== "" && !WAVES.includes(wave)) r.fail(`channels[${i}].wave`, `unknown wave "${wave}"`)
    return { wave: wave as Score["channels"][number]["wave"], volume: r.num(co, "volume", `channels[${i}]`), notes: r.str(co, "notes", `channels[${i}]`) }
  })
  const score: Score = { tempo: r.num(o, "tempo", ""), loop: r.bool(o, "loop", ""), channels }
  if (r.errors.length === before) put(ctx, d.music, "music", r.file, id, score)
}

function readMaps(r: Reader, v: unknown, d: Draft, ctx: Ctx): void {
  eachEntry(r, v, (o, id, w) => {
    const before = r.errors.length
    const exits = r.arr(o["exits"] ?? [], `${w}.exits`).map((e, i) => {
      const eo = r.obj(e, `${w}.exits[${i}]`)
      return { at: r.pos(eo["at"], `${w}.exits[${i}].at`), to: r.str(eo, "to", `${w}.exits[${i}]`), arrive: r.pos(eo["arrive"], `${w}.exits[${i}].arrive`) }
    })
    const encounters = r.arr(o["encounters"] ?? [], `${w}.encounters`).map((e, i) => {
      const eo = r.obj(e, `${w}.encounters[${i}]`)
      return { at: r.pos(eo["at"], `${w}.encounters[${i}].at`), id: r.str(eo, "id", `${w}.encounters[${i}]`) }
    })
    const m: Mutable<MapDef> = {
      rows: r.strList(o, "rows", w), exits, music: r.str(o, "music", w), encounters,
      enterFlags: r.strListOr(o, "enterFlags", w), heals: r.bool(o, "heals", w, false)
    }
    if (o["isOverworld"] !== undefined) m.isOverworld = r.bool(o, "isOverworld", w)
    if (o["terrainCost"] !== undefined) {
      const tco = r.obj(o["terrainCost"], `${w}.terrainCost`)
      const costs: Record<string, number | null> = {}
      for (const [glyph, cost] of Object.entries(tco)) {
        if (glyph.length !== 1 || glyph.charCodeAt(0) > 127) {
          r.fail(`${w}.terrainCost."${glyph}"`, `terrainCost glyphs must be single ASCII characters, got "${glyph}"`)
          continue
        }
        if (cost !== null && !(typeof cost === "number" && Number.isFinite(cost))) {
          r.fail(`${w}.terrainCost."${glyph}"`, "expected a number or null")
        } else {
          costs[glyph] = cost as number | null
        }
      }
      m.terrainCost = costs
    }
    if (r.errors.length === before) put(ctx, d.maps, "map", r.file, id, m)
  })
}

function readChoice(r: Reader, v: unknown, w: string): ChoiceOption[] {
  return r.arr(v, w).map((c, i) => {
    const cw = `${w}[${i}]`
    const co = r.obj(c, cw)
    const opt: Mutable<ChoiceOption> = { optionId: r.str(co, "id", cw), labelKey: r.str(co, "label", cw), textKey: r.str(co, "text", cw) }
    if (co["deed"] !== undefined) {
      const dd = r.obj(co["deed"], `${cw}.deed`)
      opt.deed = { virtue: r.str(dd, "virtue", `${cw}.deed`) as Virtue, deed: r.str(dd, "deed", `${cw}.deed`) }
    }
    const grants = r.optStrList(co, "grants", cw)
    if (grants !== undefined) opt.grants = grants
    const setsFlags = r.optStrList(co, "setsFlags", cw)
    if (setsFlags !== undefined) opt.setsFlags = setsFlags
    return opt
  })
}

function readTopic(r: Reader, v: unknown, w: string): Topic {
  const o = r.obj(v, w)
  const t: Mutable<Topic> = { textKey: r.str(o, "text", w) }
  for (const key of ["requires", "requiresFlags", "excludeFlags", "grants", "setsFlags"] as const) {
    const list = r.optStrList(o, key, w)
    if (list !== undefined) t[key] = list
  }
  const lie = r.optBool(o, "lie", w)
  if (lie !== undefined) t.lie = lie
  if (o["choice"] !== undefined) t.choice = readChoice(r, o["choice"], `${w}.choice`)
  return t
}

function readNpcs(r: Reader, v: unknown, d: Draft, ctx: Ctx): void {
  eachEntry(r, v, (o, id, w) => {
    // A malformed topic or companion drops only itself, so the NPC's other checks still run.
    const topics: Record<string, readonly Topic[]> = {}
    for (const [key, tv] of Object.entries(r.obj(o["topics"] ?? {}, `${w}.topics`))) {
      const tw = `${w}.topics.${key}`
      const tb = r.errors.length
      const variants = Array.isArray(tv) ? tv.map((x, i) => readTopic(r, x, `${tw}[${i}]`)) : [readTopic(r, tv, tw)]
      if (r.errors.length === tb) topics[key] = variants
    }
    const before = r.errors.length
    const npc: Mutable<NpcDef> = {
      map: r.str(o, "map", w), pos: r.pos(o["pos"], `${w}.pos`), nameKey: r.str(o, "name", w), greetKey: r.str(o, "greet", w),
      sprite: r.sprite(o["sprite"], `${w}.sprite`), topics
    }
    const npcOk = r.errors.length === before
    if (o["companion"] !== undefined) {
      const cw = `${w}.companion`
      const cb = r.errors.length
      const co = r.obj(o["companion"], cw)
      const comp: CompanionDef = {
        virtue: r.str(co, "virtue", cw) as Virtue, joinRequires: r.strListOr(co, "joinRequires", cw),
        leaveAfterDeeds: r.num(co, "leaveAfterDeeds", cw), rejoinRequires: r.strListOr(co, "rejoinRequires", cw),
        hp: r.num(co, "hp", cw), attack: r.num(co, "attack", cw)
      }
      if (r.errors.length === cb) npc.companion = comp
    }
    if (npcOk) put(ctx, d.npcs, "npc", r.file, id, npc)
  })
}

function readFacts(r: Reader, v: unknown, d: Draft, ctx: Ctx): void {
  eachEntry(r, v, (o, id, w) => {
    const before = r.errors.length
    const kind = r.str(o, "kind", w)
    if (kind !== "" && !FACT_KINDS.includes(kind as FactKind)) r.fail(`${w}.kind`, `unknown fact kind "${kind}"`)
    const f: Fact = { kind: kind as FactKind, labelKey: r.str(o, "label", w), hintKey: r.str(o, "hint", w) }
    if (r.errors.length === before) put(ctx, d.facts, "fact", r.file, id, f)
  })
}

function readDeductions(r: Reader, v: unknown, d: Draft, ctx: Ctx): void {
  eachEntry(r, v, (o, id, w) => {
    const before = r.errors.length
    const ded: Mutable<Deduction> = {
      sentenceKey: r.str(o, "sentence", w), hintKey: r.str(o, "hint", w), answer: r.strList(o, "answer", w), unlocks: r.strListOr(o, "unlocks", w)
    }
    if (o["codexWord"] !== undefined) ded.codexWord = r.str(o, "codexWord", w)
    if (r.errors.length === before) put(ctx, d.deductions, "deduction", r.file, id, ded)
  })
}

function readCrises(r: Reader, v: unknown, d: Draft, ctx: Ctx): void {
  eachEntry(r, v, (o, id, w) => {
    const before = r.errors.length
    const options: Record<Id, CrisisOptionDef> = {}
    for (const [optId, ov] of Object.entries(r.obj(o["options"], `${w}.options`))) {
      const ow = `${w}.options.${optId}`
      const oo = r.obj(ov, ow)
      options[optId] = {
        requires: r.strListOr(oo, "requires", ow), requiresDeductions: r.strListOr(oo, "requiresDeductions", ow),
        setsFlags: r.strListOr(oo, "setsFlags", ow), labelKey: r.str(oo, "label", ow), textKey: r.str(oo, "text", ow)
      }
    }
    const c: Crisis = { npc: r.str(o, "npc", w), textKey: r.str(o, "text", w), options }
    if (r.errors.length === before) put(ctx, d.crises, "crisis", r.file, id, c)
  })
}

function readEncounters(r: Reader, v: unknown, d: Draft, ctx: Ctx): void {
  eachEntry(r, v, (o, id, w) => {
    const before = r.errors.length
    const allyStart = r.arr(o["allyStart"], `${w}.allyStart`).map((p, i) => r.pos(p, `${w}.allyStart[${i}]`))
    const enemies = r.arr(o["enemies"], `${w}.enemies`).map((e, i) => {
      const eo = r.obj(e, `${w}.enemies[${i}]`)
      return { creature: r.str(eo, "creature", `${w}.enemies[${i}]`), at: r.pos(eo["at"], `${w}.enemies[${i}].at`) }
    })
    const enc: Encounter = { map: r.str(o, "map", w), grid: r.strList(o, "grid", w), allyStart, enemies, music: r.str(o, "music", w) }
    if (r.errors.length === before) put(ctx, d.encounters, "encounter", r.file, id, enc)
  })
}

function readMoongates(r: Reader, v: unknown, d: Draft, ctx: Ctx): void {
  eachEntry(r, v, (o, id, w) => {
    const before = r.errors.length
    const mg: Moongate = {
      at: r.pos(o["at"], `${w}.at`),
      nameKey: r.str(o, "name", w),
      songKey: r.str(o, "song", w),
      fact: r.str(o, "fact", w),
      onOverworld: r.str(o, "onOverworld", w)
    }
    if (r.errors.length === before) put(ctx, d.moongates, "moongate", r.file, id, mg)
  })
}

/** The IP guard must fail closed: a missing or malformed list is an error, never an empty list. */
function checkDenylistShape(r: Reader, v: unknown): void {
  if (!isObj(v)) {
    r.fail("", "expected a mapping with latin and hangul string lists")
    return
  }
  for (const key of ["latin", "hangul"]) {
    const list = v[key]
    if (!Array.isArray(list) || !list.every((x) => typeof x === "string" && x.trim() !== "")) {
      r.fail(key, "expected a list of non-empty strings")
    }
  }
}

function readAll(raw: RawContent, ctx: Ctx): Draft {
  const d: Draft = {
    sheets: {}, tiles: {}, playerSprite: null, maps: table(), npcs: table(), facts: table(), deductions: table(),
    crises: table(), creatures: table(), encounters: table(), abilities: table(), music: table(), moongates: table(), strings: {}, start: null
  }
  if (!("tiles.yaml" in raw)) ctx.shape.push("tiles.yaml: missing required file")
  if (!("start.yaml" in raw)) ctx.shape.push("start.yaml: missing required file")
  if (!(DENYLIST_FILE in raw)) ctx.shape.push(`${DENYLIST_FILE}: missing required file`)
  for (const [file, v] of Object.entries(raw)) {
    const r = makeReader(file, ctx.shape)
    const music = /^music\/([^/]+)\.yaml$/.exec(file)
    const town = /^towns\/[^/]+\/(maps|npcs|facts|deduction|crisis|encounters)\.yaml$/.exec(file)
    if (file === DENYLIST_FILE) checkDenylistShape(r, v)
    else if (file === "tiles.yaml") readTiles(r, v, d)
    else if (file === "start.yaml") readStart(r, v, d)
    else if (file === "abilities.yaml") readAbilities(r, v, d, ctx)
    else if (STRINGS_FILE_RE.test(file)) {
      readStrings(r, v, d, STRINGS_FILE_RE.exec(file)?.[1] ?? "ko")
    }
    else if (file === "creatures.yaml") readCreatures(r, v, d, ctx)
    else if (file === "moongates.yaml") readMoongates(r, v, d, ctx)
    else if (music !== null) {
      if (v !== null && v !== undefined) readMusic(r, v, d, ctx, `music.${music[1] ?? ""}`)
    } else if (town !== null) {
      const kind = town[1]
      if (kind === "maps") readMaps(r, v, d, ctx)
      else if (kind === "npcs") readNpcs(r, v, d, ctx)
      else if (kind === "facts") readFacts(r, v, d, ctx)
      else if (kind === "deduction") readDeductions(r, v, d, ctx)
      else if (kind === "crisis") readCrises(r, v, d, ctx)
      else readEncounters(r, v, d, ctx)
    } else ctx.shape.push(`${file}: unknown content file`)
  }
  return d
}

// ---------- group 3: references ----------

function checkReferences(d: Draft, out: string[]): void {
  const ref = (file: string, where: string, kind: string, id: Id, t: Readonly<Record<Id, unknown>>): void => {
    if (!(id in t)) out.push(`${file}: ${where}: unknown ${kind} "${id}"`)
  }
  const refs = (file: string, where: string, kind: string, ids: readonly Id[] | undefined, t: Readonly<Record<Id, unknown>>): void => {
    for (const id of ids ?? []) ref(file, where, kind, id, t)
  }
  const virtue = (file: string, where: string, v: string): void => {
    if (!VIRTUES.includes(v as Virtue)) out.push(`${file}: ${where}: unknown virtue "${v}"`)
  }
  const sheet = (file: string, where: string, s: SpriteRef): void => {
    if (!(s.sheet in d.sheets)) out.push(`${file}: ${where}: unknown sprite sheet "${s.sheet}"`)
  }
  const facts = d.facts.items
  if (d.playerSprite !== null) sheet("tiles.yaml", "player", d.playerSprite)
  for (const [ch, t] of Object.entries(d.tiles)) sheet("tiles.yaml", `tiles."${ch}"`, t.sprite)
  if (d.start !== null) ref("start.yaml", "map", "map", d.start.map, d.maps.items)

  for (const [id, m] of Object.entries(d.maps.items)) {
    const f = d.maps.file[id] ?? ""
    m.exits.forEach((e, i) => ref(f, `${id}.exits[${i}].to`, "map", e.to, d.maps.items))
    m.encounters.forEach((e, i) => ref(f, `${id}.encounters[${i}].id`, "encounter", e.id, d.encounters.items))
    ref(f, `${id}.music`, "music", m.music, d.music.items)
  }
  for (const [id, n] of Object.entries(d.npcs.items)) {
    const f = d.npcs.file[id] ?? ""
    ref(f, `${id}.map`, "map", n.map, d.maps.items)
    sheet(f, `${id}.sprite`, n.sprite)
    for (const [key, variants] of Object.entries(n.topics)) {
      const tw = `${id}.topics.${key}`
      if (key !== "name" && key !== "job" && !(key in facts)) out.push(`${f}: ${tw}: topic key "${key}" is not name, job or a fact id`)
      variants.forEach((t, i) => {
        refs(f, `${tw}[${i}].requires`, "fact", t.requires, facts)
        refs(f, `${tw}[${i}].grants`, "fact", t.grants, facts)
        ;(t.choice ?? []).forEach((c, j) => {
          refs(f, `${tw}[${i}].choice[${j}].grants`, "fact", c.grants, facts)
          if (c.deed !== undefined) virtue(f, `${tw}[${i}].choice[${j}].deed.virtue`, c.deed.virtue)
        })
      })
    }
    if (n.companion !== undefined) {
      virtue(f, `${id}.companion.virtue`, n.companion.virtue)
      refs(f, `${id}.companion.joinRequires`, "fact", n.companion.joinRequires, facts)
      refs(f, `${id}.companion.rejoinRequires`, "fact", n.companion.rejoinRequires, facts)
    }
  }
  for (const [id, ded] of Object.entries(d.deductions.items)) {
    const f = d.deductions.file[id] ?? ""
    refs(f, `${id}.answer`, "fact", ded.answer, facts)
    if (ded.codexWord !== undefined) ref(f, `${id}.codexWord`, "fact", ded.codexWord, facts)
    refs(f, `${id}.unlocks`, "ability", ded.unlocks, d.abilities.items)
  }
  for (const [id, c] of Object.entries(d.crises.items)) {
    const f = d.crises.file[id] ?? ""
    ref(f, `${id}.npc`, "npc", c.npc, d.npcs.items)
    for (const [optId, o] of Object.entries(c.options)) {
      refs(f, `${id}.options.${optId}.requires`, "fact", o.requires, facts)
      refs(f, `${id}.options.${optId}.requiresDeductions`, "deduction", o.requiresDeductions, d.deductions.items)
    }
  }
  for (const [id, c] of Object.entries(d.creatures.items)) {
    const f = d.creatures.file[id] ?? ""
    ref(f, `${id}.lore`, "fact", c.lore, facts)
    sheet(f, `${id}.sprite`, c.sprite)
  }
  for (const [id, e] of Object.entries(d.encounters.items)) {
    const f = d.encounters.file[id] ?? ""
    ref(f, `${id}.map`, "map", e.map, d.maps.items)
    ref(f, `${id}.music`, "music", e.music, d.music.items)
    e.enemies.forEach((en, i) => ref(f, `${id}.enemies[${i}].creature`, "creature", en.creature, d.creatures.items))
  }
  for (const [id, mg] of Object.entries(d.moongates.items)) {
    const f = d.moongates.file[id] ?? ""
    ref(f, `${id}.fact`, "fact", mg.fact, facts)
    ref(f, `${id}.onOverworld`, "map", mg.onOverworld, d.maps.items)
  }
}

// ---------- group 4: string keys ----------

function checkStringKeys(d: Draft, out: string[]): void {
  const ko = d.strings["ko"] ?? {}
  const need = (file: string, where: string, key: string): void => {
    if (!(key in ko)) out.push(`${file}: ${where}: string key "${key}" missing from ${KO_STRINGS_FILE}`)
  }
  for (const key of ALWAYS_REQUIRED_STRINGS) {
    if (!(key in ko)) out.push(`${KO_STRINGS_FILE}: required string key "${key}" missing`)
  }
  for (const [id, n] of Object.entries(d.npcs.items)) {
    const f = d.npcs.file[id] ?? ""
    need(f, `${id}.name`, n.nameKey)
    need(f, `${id}.greet`, n.greetKey)
    for (const [key, variants] of Object.entries(n.topics)) {
      variants.forEach((t, i) => {
        need(f, `${id}.topics.${key}[${i}].text`, t.textKey)
        ;(t.choice ?? []).forEach((c, j) => {
          need(f, `${id}.topics.${key}[${i}].choice[${j}].label`, c.labelKey)
          need(f, `${id}.topics.${key}[${i}].choice[${j}].text`, c.textKey)
        })
      })
    }
  }
  for (const [id, x] of Object.entries(d.facts.items)) {
    need(d.facts.file[id] ?? "", `${id}.label`, x.labelKey)
    need(d.facts.file[id] ?? "", `${id}.hint`, x.hintKey)
  }
  for (const [id, x] of Object.entries(d.deductions.items)) {
    need(d.deductions.file[id] ?? "", `${id}.sentence`, x.sentenceKey)
    need(d.deductions.file[id] ?? "", `${id}.hint`, x.hintKey)
  }
  for (const [id, c] of Object.entries(d.crises.items)) {
    const f = d.crises.file[id] ?? ""
    need(f, `${id}.text`, c.textKey)
    for (const [optId, o] of Object.entries(c.options)) {
      need(f, `${id}.options.${optId}.label`, o.labelKey)
      need(f, `${id}.options.${optId}.text`, o.textKey)
    }
  }
  for (const [id, c] of Object.entries(d.creatures.items)) need(d.creatures.file[id] ?? "", `${id}.name`, c.nameKey)
  for (const [id, a] of Object.entries(d.abilities.items)) need(d.abilities.file[id] ?? "", `${id}.name`, a.nameKey)
  // 언어 파일은 ko와 키 집합이 일치해야 한다. en이 없으면 ko만으로 충분하다.
  for (const [lang, strings] of Object.entries(d.strings)) {
    if (lang === "ko") continue
    for (const key of Object.keys(ko)) {
      if (!(key in strings)) out.push(`strings/${lang}.yaml: string key "${key}" missing (present in ${KO_STRINGS_FILE})`)
    }
    for (const key of Object.keys(strings)) {
      if (!(key in ko)) out.push(`strings/${lang}.yaml: string key "${key}" not present in ${KO_STRINGS_FILE}`)
    }
  }
}

// ---------- group 5: map and grid geometry ----------

function checkGeometry(d: Draft, out: string[]): void {
  const grid = (file: string, where: string, rows: readonly string[]): void => {
    if (rows.length === 0) out.push(`${file}: ${where}: no rows`)
    const w = rows[0]?.length ?? 0
    if (rows.some((row) => row.length !== w)) out.push(`${file}: ${where}: rows of unequal width`)
    const missing = new Set<string>()
    for (const row of rows) for (const ch of row) if (!(ch in d.tiles)) missing.add(ch)
    for (const ch of missing) out.push(`${file}: ${where}: tile "${ch}" missing from tiles.yaml`)
  }
  const cell = (file: string, where: string, rows: readonly string[], p: Pos): void => {
    const ch = p.y >= 0 && p.x >= 0 ? rows[p.y]?.[p.x] : undefined
    if (ch === undefined) out.push(`${file}: ${where}: [${p.x}, ${p.y}] is outside the map`)
    else if (d.tiles[ch]?.walk === null) out.push(`${file}: ${where}: [${p.x}, ${p.y}] is not walkable`)
  }
  for (const [id, m] of Object.entries(d.maps.items)) {
    const f = d.maps.file[id] ?? ""
    grid(f, id, m.rows)
    m.exits.forEach((e, i) => {
      cell(f, `${id}.exits[${i}].at`, m.rows, e.at)
      const target = d.maps.items[e.to]
      if (target !== undefined) cell(f, `${id}.exits[${i}].arrive`, target.rows, e.arrive)
    })
    m.encounters.forEach((e, i) => cell(f, `${id}.encounters[${i}].at`, m.rows, e.at))
  }
  for (const [id, n] of Object.entries(d.npcs.items)) {
    const m = d.maps.items[n.map]
    if (m !== undefined) cell(d.npcs.file[id] ?? "", `${id}.pos`, m.rows, n.pos)
  }
  if (d.start !== null) {
    const m = d.maps.items[d.start.map]
    if (m !== undefined) cell("start.yaml", "pos", m.rows, d.start.pos)
  }
  for (const [id, e] of Object.entries(d.encounters.items)) {
    const f = d.encounters.file[id] ?? ""
    grid(f, `${id}.grid`, e.grid)
    e.allyStart.forEach((p, i) => cell(f, `${id}.allyStart[${i}]`, e.grid, p))
    e.enemies.forEach((en, i) => cell(f, `${id}.enemies[${i}].at`, e.grid, en.at))
  }
}

// ---------- group 5+: overworld maps (D20) ----------

function checkOverworld(d: Draft, out: string[]): void {
  for (const [id, m] of Object.entries(d.maps.items)) {
    if (m.isOverworld !== true) continue
    const f = d.maps.file[id] ?? ""
    if (m.exits.length === 0) out.push(`${f}: ${id}: isOverworld maps must define at least one exits entry`)
    if (m.terrainCost === undefined || Object.keys(m.terrainCost).length === 0) {
      out.push(`${f}: ${id}: isOverworld maps must define a non-empty terrainCost`)
    }
  }
}

// ---------- group 6: grant paths ----------

function checkGrantPaths(d: Draft, out: string[]): void {
  const granted = new Set<Id>()
  for (const n of Object.values(d.npcs.items)) {
    for (const variants of Object.values(n.topics)) {
      for (const t of variants) {
        for (const g of t.grants ?? []) granted.add(g)
        for (const c of t.choice ?? []) for (const g of c.grants ?? []) granted.add(g)
      }
    }
  }
  for (const [id, ded] of Object.entries(d.deductions.items)) {
    for (const w of new Set(ded.answer)) {
      if (!granted.has(w)) out.push(`${d.deductions.file[id] ?? ""}: ${id}: answer word ${w} has no grant path`)
    }
  }
}

// ---------- group 7: deduction answers ----------

function checkAnswers(d: Draft, out: string[]): void {
  for (const [id, ded] of Object.entries(d.deductions.items)) {
    const f = d.deductions.file[id] ?? ""
    if (ded.answer.length !== 3) out.push(`${f}: ${id}.answer: expected exactly 3 words, got ${ded.answer.length}`)
    for (const w of new Set(ded.answer)) {
      const fact = d.facts.items[w]
      if (fact !== undefined && fact.kind !== "word") out.push(`${f}: ${id}.answer: "${w}" has kind ${fact.kind}, expected word`)
    }
    if (ded.codexWord !== undefined && !ded.answer.includes(ded.codexWord)) {
      out.push(`${f}: ${id}.codexWord: "${ded.codexWord}" is not one of the answer words`)
    }
  }
}

// ---------- group 8: denied terms ----------

function checkDenied(raw: RawContent, d: Draft, out: string[]): void {
  const deny = parseDenylist(raw[DENYLIST_FILE])
  const texts: { where: string; text: string }[] = []
  const add = (where: string, text: string): void => { texts.push({ where, text }) }
  for (const file of Object.keys(raw)) if (file !== DENYLIST_FILE) add(`${file}: path`, file)
  for (const [lang, strings] of Object.entries(d.strings)) {
    for (const [k, s] of Object.entries(strings)) {
      add(`strings/${lang}.yaml: key ${k}`, k)
      add(`strings/${lang}.yaml: ${k}`, s)
    }
  }
  for (const id of Object.keys(d.sheets)) add(`tiles.yaml: sheet id ${id}`, id)
  const tables: readonly Table<unknown>[] = [d.maps, d.npcs, d.facts, d.deductions, d.crises, d.creatures, d.encounters, d.abilities, d.music, d.moongates]
  for (const t of tables) for (const [id, f] of Object.entries(t.file)) add(`${f}: id ${id}`, id)
  const flags = (file: string, where: string, ids: readonly Id[] | undefined): void => {
    for (const x of ids ?? []) add(`${file}: ${where} flag ${x}`, x)
  }
  for (const [id, m] of Object.entries(d.maps.items)) flags(d.maps.file[id] ?? "", `${id}.enterFlags`, m.enterFlags)
  for (const [id, n] of Object.entries(d.npcs.items)) {
    const f = d.npcs.file[id] ?? ""
    for (const [key, variants] of Object.entries(n.topics)) {
      const tw = `${id}.topics`
      add(`${f}: ${tw} key "${key}"`, key)
      for (const t of variants) {
        flags(f, `${tw}.${key}`, t.setsFlags); flags(f, `${tw}.${key}`, t.requiresFlags); flags(f, `${tw}.${key}`, t.excludeFlags)
        for (const c of t.choice ?? []) {
          add(`${f}: ${tw}.${key} option id ${c.optionId}`, c.optionId)
          flags(f, `${tw}.${key}.${c.optionId}`, c.setsFlags)
          if (c.deed !== undefined) add(`${f}: ${tw}.${key}.${c.optionId} deed id ${c.deed.deed}`, c.deed.deed)
        }
      }
    }
  }
  for (const [id, c] of Object.entries(d.crises.items)) {
    const f = d.crises.file[id] ?? ""
    for (const [optId, o] of Object.entries(c.options)) {
      add(`${f}: ${id}.options option id ${optId}`, optId)
      flags(f, `${id}.options.${optId}`, o.setsFlags)
    }
  }
  out.push(...findDenied(texts, deny))
}

// ---------- entry ----------

export function compileContent(raw: RawContent): { content: GameContent | null; errors: string[] } {
  const ctx: Ctx = { shape: [], dups: [] }
  const d = readAll(raw, ctx)
  const errors: string[] = [...ctx.shape, ...ctx.dups]
  checkReferences(d, errors)
  checkStringKeys(d, errors)
  checkGeometry(d, errors)
  checkOverworld(d, errors)
  checkGrantPaths(d, errors)
  checkAnswers(d, errors)
  checkDenied(raw, d, errors)
  if (errors.length > 0 || d.start === null || d.playerSprite === null) {
    return { content: null, errors }
  }
  const content: GameContent = {
    sheets: d.sheets, tiles: d.tiles, playerSprite: d.playerSprite,
    maps: d.maps.items, npcs: d.npcs.items, facts: d.facts.items,
    deductions: d.deductions.items as GameContent["deductions"],   // answer length checked in group 7
    crises: d.crises.items, creatures: d.creatures.items, encounters: d.encounters.items,
    abilities: d.abilities.items, music: d.music.items, strings: d.strings, start: d.start,
    moongates: d.moongates.items
  }
  return { content, errors }
}
