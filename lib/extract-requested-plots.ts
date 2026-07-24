import { Print, parseSpiceNetlist } from "spicets"

export type SpiceVector = string
export type NormalizedSpiceVector = string
export type RequestedPlotByNormalizedSpiceVector = Map<
  NormalizedSpiceVector,
  SpiceVector
>

export const extractRequestedPlots = (
  spiceString: string,
): RequestedPlotByNormalizedSpiceVector | null => {
  const supportedAnalyses = new Set(["tran", "op", "dc", "ac"])
  const print = parseSpiceNetlist(spiceString, {
    dialect: "ngspice",
  }).directives.find(
    (directive) =>
      directive instanceof Print &&
      supportedAnalyses.has(directive.analysis?.toLowerCase() ?? ""),
  )
  if (!(print instanceof Print)) {
    return null
  }

  const tokens = print.getString().match(/[VI]\s*\([^)]+\)/gi)

  if (!tokens) {
    return null
  }

  const requestedPlotByNormalizedSpiceVector: RequestedPlotByNormalizedSpiceVector =
    new Map()
  for (const token of tokens) {
    const normalizedSpiceVector = token.toLowerCase().replace(/\s/g, "")
    if (!requestedPlotByNormalizedSpiceVector.has(normalizedSpiceVector)) {
      requestedPlotByNormalizedSpiceVector.set(normalizedSpiceVector, token)
    }
  }

  return requestedPlotByNormalizedSpiceVector
}
