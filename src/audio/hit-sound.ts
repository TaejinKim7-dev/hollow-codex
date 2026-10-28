/**
 * 타격 소리의 재생 속도(음정). 같은 소리 파일 하나로 세기와 연타를 표현한다.
 * 피해가 클수록 낮게(1.0 → 0.85), 한 번의 연속 안에서 index마다 +0.06, 처치하는 일격은 -0.05. 0.7~1.4로 제한.
 */
export function hitRate(amount: number, index: number, defeated: boolean): number {
  const weight = 1.0 - Math.min(0.15, Math.max(0, (amount - 1) * 0.03))
  const rate = weight + index * 0.06 - (defeated ? 0.05 : 0)
  return Math.min(1.4, Math.max(0.7, rate))
}
