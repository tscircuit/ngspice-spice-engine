export const extractRequestedPlots = (
  spiceString: string,
): Map<string, string> | null => {
  const match = spiceString.match(/\.print\s+tran\s+(.*)/i)
  if (!match?.[1]) {
    return null
  }

  const tokens = match[1].match(/[VI]\s*\([^)]+\)/gi)

  if (!tokens) {
    return null
  }

  const plotMap = new Map<string, string>()
  for (const token of tokens) {
    const lowerCaseToken = token.toLowerCase().replace(/\s/g, "")
    if (!plotMap.has(lowerCaseToken)) {
      plotMap.set(lowerCaseToken, token)
    }
  }

  return plotMap
}
