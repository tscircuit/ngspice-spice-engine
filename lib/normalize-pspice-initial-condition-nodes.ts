import {
  parseToSpiceTokens,
  significantTokens,
  tokensToLogicalCards,
} from "spicets"

export const normalizePspiceInitialConditionNodes = (
  spiceString: string,
): string => {
  const cards = tokensToLogicalCards(parseToSpiceTokens(spiceString).tokens)
  let normalizedSpice = spiceString

  for (const card of cards.toReversed()) {
    const tokens = significantTokens(card.tokens)
    if (tokens[0]?.raw.toLowerCase() !== ".ic") continue

    for (
      let voltageTokenIndex = tokens.length - 4;
      voltageTokenIndex >= 1;
      voltageTokenIndex--
    ) {
      const voltageToken = tokens[voltageTokenIndex]!
      if (
        voltageToken.raw.toLowerCase() !== "v" ||
        tokens[voltageTokenIndex + 1]?.raw !== "("
      ) {
        continue
      }

      const closingParenthesisTokenIndex = tokens.findIndex(
        (token, tokenIndex) =>
          tokenIndex > voltageTokenIndex + 1 && token.raw === ")",
      )
      if (
        closingParenthesisTokenIndex <= voltageTokenIndex + 2 ||
        tokens[closingParenthesisTokenIndex + 1]?.raw !== "="
      ) {
        continue
      }

      const firstNodeToken = tokens[voltageTokenIndex + 2]!
      const lastNodeToken = tokens[closingParenthesisTokenIndex - 1]!
      const closingParenthesisToken = tokens[closingParenthesisTokenIndex]!
      const nodeName = spiceString.slice(
        firstNodeToken.range.start.offset,
        lastNodeToken.range.end.offset,
      )

      // ngspice otherwise treats a padded formal pin as an internal node.
      normalizedSpice =
        normalizedSpice.slice(0, voltageToken.range.start.offset) +
        `${voltageToken.raw}(${nodeName})` +
        normalizedSpice.slice(closingParenthesisToken.range.end.offset)
    }
  }

  return normalizedSpice
}
