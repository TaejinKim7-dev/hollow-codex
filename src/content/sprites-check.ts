import type { GameContent, SpriteRef } from "./types.ts"

/** `char.<name>` 참조 중 그림 폴더가 없는 것 — "<소유자 id>: char.<name>" 목록. 파일 시스템 확인은 호출자가 `has`로 준다(컴파일러는 순수하게 둔다). */
export function missingCharacterSprites(content: GameContent, has: (name: string) => boolean): string[] {
  const out: string[] = []
  const check = (owner: string, ref: SpriteRef): void => {
    if ("char" in ref && !has(ref.char)) out.push(`${owner}: char.${ref.char}`)
  }
  check("player", content.playerSprite)
  for (const [id, n] of Object.entries(content.npcs)) check(id, n.sprite)
  for (const [id, c] of Object.entries(content.creatures)) check(id, c.sprite)
  return out
}
