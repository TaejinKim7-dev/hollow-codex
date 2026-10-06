// 화면 문자열 조회 (Task 13). 없는 키는 ⟦key⟧로 드러내고, {name} 형태 자리표를 vars로 치환한다.
export function t(
  strings: Readonly<Record<string, string>>,
  key: string,
  vars?: Readonly<Record<string, string>>
): string {
  const template = strings[key]
  if (template === undefined) return `⟦${key}⟧`
  if (vars === undefined) return template
  let out = template
  for (const [name, value] of Object.entries(vars)) out = out.split(`{${name}}`).join(value)
  return out
}