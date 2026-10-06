import type { Score } from "../content/types.ts"

export interface ScoreEvent {
  readonly channel: number
  readonly time: number
  readonly duration: number
  readonly freq: number | null
}

export interface ParsedScore {
  readonly events: readonly ScoreEvent[]
  readonly length: number
}

/** 반음 오프셋. C=0 … B=11. */
const SEMITONES: Readonly<Record<string, number>> = {
  C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6,
  G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11
}

const DENOMINATORS: ReadonlySet<number> = new Set([1, 2, 4, 8, 16])

const NOTE_TOKEN = /^([A-G](?:#|b)?)([0-8])\/([0-9]+)(\.)?$/
const REST_TOKEN = /^r\/([0-9]+)(\.)?$/
const NOISE_TOKEN = /^x\/([0-9]+)(\.)?$/

function badNote(token: string, channel: number): Error {
  return new Error(`bad note "${token}" in channel ${channel}`)
}

/** 음표 길이(초). 분모 n은 온음표 기준, 4분음표 = 60/tempo초. `.` = 1.5배. */
function noteSeconds(denominator: number, dotted: boolean, quarter: number): number {
  const d = (4 / denominator) * quarter
  return dotted ? d * 1.5 : d
}

export function parseScore(score: Score): ParsedScore {
  const events: ScoreEvent[] = []
  let length = 0
  const quarter = 60 / score.tempo

  score.channels.forEach((channel, i) => {
    let time = 0
    for (const token of channel.notes.trim().split(/\s+/)) {
      if (token === "") continue

      const rest = REST_TOKEN.exec(token)
      if (rest) {
        const denom = Number(rest[1])
        if (!DENOMINATORS.has(denom)) throw badNote(token, i)
        const duration = noteSeconds(denom, rest[2] !== undefined, quarter)
        events.push({ channel: i, time, duration, freq: null })
        time += duration
        continue
      }

      const noise = NOISE_TOKEN.exec(token)
      if (noise) {
        if (channel.wave !== "noise") throw badNote(token, i)
        const denom = Number(noise[1])
        if (!DENOMINATORS.has(denom)) throw badNote(token, i)
        const duration = noteSeconds(denom, noise[2] !== undefined, quarter)
        events.push({ channel: i, time, duration, freq: 0 })
        time += duration
        continue
      }

      const note = NOTE_TOKEN.exec(token)
      if (!note) throw badNote(token, i)
      const semitone = SEMITONES[note[1] ?? ""]
      if (semitone === undefined) throw badNote(token, i)
      const denom = Number(note[3])
      if (!DENOMINATORS.has(denom)) throw badNote(token, i)
      const midi = 12 * (Number(note[2]) + 1) + semitone
      const freq = 440 * 2 ** ((midi - 69) / 12)
      const duration = noteSeconds(denom, note[4] !== undefined, quarter)
      events.push({ channel: i, time, duration, freq })
      time += duration
    }
    length = Math.max(length, time)
  })

  return { events, length }
}