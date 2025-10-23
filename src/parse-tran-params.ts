export interface TranParams {
  tstep?: number
  tstop?: number
  tstart?: number
  tmax?: number
  uic?: boolean
}

const SUFFIX_MULTIPLIERS: Record<string, number> = {
  t: 1e12,
  g: 1e9,
  meg: 1e6,
  k: 1e3,
  m: 1e-3,
  ms: 1e-3,
  u: 1e-6,
  us: 1e-6,
  n: 1e-9,
  ns: 1e-9,
  p: 1e-12,
  ps: 1e-12,
  f: 1e-15,
  fs: 1e-15,
  s: 1,
}

const sanitizeToken = (token: string): string => token.replace(/[,]/g, "")

const parseNumericToken = (token: string): number | undefined => {
  const sanitized = sanitizeToken(token)
  const normalized = sanitized.toLowerCase()
  const match = normalized.match(/^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)([a-z]+)?$/i)

  if (!match) {
    return undefined
  }

  const [, basePart = "", suffix = ""] = match
  const base = Number.parseFloat(basePart)
  if (Number.isNaN(base)) {
    return undefined
  }

  if (!suffix) {
    return base
  }

  const multiplier =
    SUFFIX_MULTIPLIERS[suffix] ??
    SUFFIX_MULTIPLIERS[suffix.replace(/s$/, "")] ??
    1

  return base * multiplier
}

export const parseTranParams = (spiceString: string): TranParams | null => {
  const lines = spiceString.split(/\r?\n/)

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line || line.startsWith("*")) {
      continue
    }

    if (!line.toLowerCase().startsWith(".tran")) {
      continue
    }

    const [withoutComments = ""] = line.split(";")
    const tokens = withoutComments.split(/\s+/).filter(Boolean)

    if (tokens.length <= 1) {
      return {}
    }

    const values: number[] = []
    let uic = false

    for (const token of tokens.slice(1)) {
      if (token.toLowerCase() === "uic") {
        uic = true
        continue
      }

      const value = parseNumericToken(token)
      if (value !== undefined) {
        values.push(value)
      }
    }

    const params: TranParams = {}
    if (values[0] !== undefined) {
      params.tstep = values[0]
    }
    if (values[1] !== undefined) {
      params.tstop = values[1]
    }
    if (values[2] !== undefined) {
      params.tstart = values[2]
    }
    if (values[3] !== undefined) {
      params.tmax = values[3]
    }
    if (uic) {
      params.uic = true
    }

    return params
  }

  return null
}
