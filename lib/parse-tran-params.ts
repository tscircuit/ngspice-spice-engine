import { parseSpiceNetlist, Tran } from "spicets"

export interface TranParams {
  tstep?: number
  tstop?: number
  tstart?: number
  tmax?: number
  uic?: boolean
}

// SPICE scale factors, longest first so "meg" wins over "m". Letters after
// the scale factor are ignored, so "nsec" scales like "n".
const SCALE_FACTOR_PREFIXES: [string, number][] = [
  ["meg", 1e6],
  ["t", 1e12],
  ["g", 1e9],
  ["k", 1e3],
  ["m", 1e-3],
  ["u", 1e-6],
  ["n", 1e-9],
  ["p", 1e-12],
  ["f", 1e-15],
]

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

  const scaleFactor = SCALE_FACTOR_PREFIXES.find(([prefix]) =>
    suffix.startsWith(prefix),
  )

  return base * (scaleFactor?.[1] ?? 1)
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
