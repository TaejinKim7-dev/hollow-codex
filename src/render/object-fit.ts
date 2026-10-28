import { TILE } from "./viewport.ts"

/** 전투 격자에서 물건을 그리는 배율(1 이하). 큰 나무가 위·옆 칸의 적과 체력 막대를 덮지 않도록 자기 칸 근처로 줄인다. */
export function combatObjectFit(imgW: number, imgH: number, footprintW: number): number {
  return Math.min(1, (TILE * footprintW * 1.25) / imgW, (TILE * 1.6) / imgH)
}
