import { parseSpiceNetlist, Tran } from "spicets"

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
  const tran = parseSpiceNetlist(spiceString, {
    dialect: "ngspice",
  }).analyses.find((analysis) => analysis instanceof Tran)
  if (!tran) {
    return null
  }

  const params: TranParams = {}
  const tstep = tran.step ? parseNumericToken(tran.step.raw) : undefined
  const tstop = parseNumericToken(tran.stop.raw)
  const tstart = tran.start ? parseNumericToken(tran.start.raw) : undefined
  const tmax = tran.maxStep ? parseNumericToken(tran.maxStep.raw) : undefined

  if (tstep !== undefined) {
    params.tstep = tstep
  }
  if (tstop !== undefined) {
    params.tstop = tstop
  }
  if (tstart !== undefined) {
    params.tstart = tstart
  }
  if (tmax !== undefined) {
    params.tmax = tmax
  }
  if (tran.uic) {
    params.uic = true
  }

  return params
}
