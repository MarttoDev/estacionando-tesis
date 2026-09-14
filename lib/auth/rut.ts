export function normalizeRut(raw: string) {
  return raw.replace(/[.\s]/g, '').toUpperCase()
}

export function isValidRut(raw: string) {
  const match = /^(\d{7,8})-([\dK])$/.exec(raw)
  if (!match) return false

  const [, body, dv] = match
  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = 11 - (sum % 11)
  const expectedDv = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder)
  return expectedDv === dv
}
