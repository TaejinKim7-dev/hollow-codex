// 화면 문자열 조회 (Task 13). 없는 키는 ⟦key⟧로 드러내고, {name} 형태 자리표를 vars로 치환한다.
// 언어별 문자열 묶음(strings[lang])에서 찾고, 그 언어에 키가 없으면 ko로 내려간다.
export function t(
  lang: string,
  strings: Readonly<Record<string, Readonly<Record<string, string>>>>,
  key: string,
  vars?: Readonly<Record<string, string | number>>
): string {
  const langStrings = strings[lang] ?? strings["ko"] ?? {}
  const template = langStrings[key] ?? strings["ko"]?.[key]
  if (template === undefined) return `⟦${key}⟧`
  if (vars === undefined) return template
  let out = template
  for (const [name, value] of Object.entries(vars)) out = out.split(`{${name}}`).join(String(value))
  return out
}