// Task 28 — 일간 표시 포맷 단위 테스트. DOM·렌더링 없음.
import { describe, expect, it } from "vitest"
import { formatTime } from "../../../src/ui/panels.ts"

const strings = { ko: { "ui.day-hour": "{day}일차 {hour}시" } }

describe("formatTime", () => {
  it("formats the in-game day and hour", () => {
    expect(formatTime("ko", strings, { hour: 8, day: 1 })).toBe("1일차 8시")
  })
  it("keeps 24-hour wrapping visible (hour 0 is a new day)", () => {
    expect(formatTime("ko", strings, { hour: 23, day: 2 })).toBe("2일차 23시")
    expect(formatTime("ko", strings, { hour: 0, day: 3 })).toBe("3일차 0시")
  })
})