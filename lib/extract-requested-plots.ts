export type SpiceVector = string
export type NormalizedSpiceVector = string
export type RequestedPlotByNormalizedSpiceVector = Map<
  NormalizedSpiceVector,
  SpiceVector
>

export const extractRequestedPlots = (
  spiceString: string,
): RequestedPlotByNormalizedSpiceVector | null => {
  const match = spiceString.match(/^\s*\.print\s+(?:tran|op|dc|ac)\s+(.*)$/im)
  if (!match?.[1]) {
    return null
  }

  const tokens = match[1].match(/[VI]\s*\([^)]+\)/gi)

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
