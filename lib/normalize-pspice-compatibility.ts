const pspiceNumberToken = String.raw`([+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?)`

const normalizePspiceResistorTc = (spiceString: string): string =>
  spiceString
    .split(/\r?\n/)
    .map((line) => {
      if (!/^\s*r/i.test(line)) return line

      return line.replace(
        new RegExp(
          String.raw`\bTC\s*=\s*${pspiceNumberToken}\s*,\s*${pspiceNumberToken}\b`,
          "gi",
        ),
        "TC1=$1 TC2=$2",
      )
    })
    .join("\n")

const pspiceComparisonOperator = "(?:<=|>=|==|!=|(?<![!<>=])=(?!=)|<|>)"
const pspiceComparisonOperand = String.raw`(?:V\s*\([^)]*\)|\{[^}\r\n]+\}|${pspiceNumberToken}(?:[a-zA-Z]+)?|[A-Za-z_][\w.$]*)`
const pspiceComparisonExpression = String.raw`${pspiceComparisonOperand}\s*${pspiceComparisonOperator}\s*${pspiceComparisonOperand}`

const pspiceComparisonBeforeCaretPattern = new RegExp(
  String.raw`${pspiceComparisonExpression}\s*$`,
  "i",
)
const pspiceComparisonAfterCaretPattern = new RegExp(
  String.raw`^\s*\+?\s*${pspiceComparisonExpression}`,
  "i",
)

const isPspiceBooleanCaret = (
  block: string,
  caretOffset: number,
  operatorLength: number,
): boolean =>
  pspiceComparisonBeforeCaretPattern.test(block.slice(0, caretOffset)) &&
  pspiceComparisonAfterCaretPattern.test(
    block.slice(caretOffset + operatorLength),
  )

// Handles PSPICE boolean-caret forms in behavioral VALUE blocks.
// This is intentionally not a general PSPICE expression parser.
const normalizePspiceValueBlockCarets = (spiceString: string): string => {
  let result = ""
  let cursor = 0
  const valueStartPattern = /\bVALUE\s*\{/gi

  for (;;) {
    valueStartPattern.lastIndex = cursor
    const match = valueStartPattern.exec(spiceString)
    if (!match) break

    const blockStart = match.index
    const firstBraceIndex = spiceString.indexOf("{", blockStart)
    let depth = 0
    let blockEnd = -1

    for (let i = firstBraceIndex; i < spiceString.length; i++) {
      const char = spiceString[i]
      if (char === "{") {
        depth += 1
      } else if (char === "}") {
        depth -= 1
        if (depth === 0) {
          blockEnd = i + 1
          break
        }
      }
    }

    if (blockEnd === -1) break

    result += spiceString.slice(cursor, blockStart)
    const block = spiceString.slice(blockStart, blockEnd)
    result += block.replace(/\s+\^\s+/g, (operator, offset, fullBlock) => {
      if (isPspiceBooleanCaret(fullBlock, offset, operator.length)) {
        return operator.replace("^", "!=")
      }

      return operator
    })
    cursor = blockEnd
  }

  return result + spiceString.slice(cursor)
}

export const normalizePspiceCompatibility = (spiceString: string): string =>
  normalizePspiceValueBlockCarets(normalizePspiceResistorTc(spiceString))
