import { normalizePspiceInitialConditionNodes } from "./normalize-pspice-initial-condition-nodes"
import { normalizePspiceSwitchModels } from "./normalize-pspice-switch-models"
import { rewritePspiceCurrentSourceUnits } from "./rewrite-pspice-current-source-units"

const pspiceNumberToken = String.raw`([+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?)`

const rewritePspiceResistorTcPairs = (spiceString: string): string =>
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

const findMatchingDelimiter = (text: string, openIndex: number): number => {
  const openChar = text[openIndex]
  const closeChar = openChar === "(" ? ")" : openChar === "{" ? "}" : ""
  if (!closeChar) return -1

  let depth = 0
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i]
    if (ch === openChar) {
      depth += 1
    } else if (ch === closeChar) {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

const skipGroupAt = (text: string, index: number): number => {
  const end = findMatchingDelimiter(text, index)
  return end === -1 ? index : end
}

const splitTopLevelByPattern = (
  text: string,
  matchOperatorAt: (text: string, index: number) => number,
): { parts: string[]; operators: string[] } => {
  const parts: string[] = []
  const operators: string[] = []
  let segmentStart = 0

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === "(" || ch === "{") {
      i = skipGroupAt(text, i)
      continue
    }
    const opLen = matchOperatorAt(text, i)
    if (opLen > 0) {
      parts.push(text.slice(segmentStart, i))
      operators.push(text.slice(i, i + opLen))
      segmentStart = i + opLen
      i += opLen - 1
    }
  }

  parts.push(text.slice(segmentStart))
  return { parts, operators }
}

const hasTopLevelRelationalOperator = (expr: string): boolean => {
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]
    if (ch === "(" || ch === "{") {
      i = skipGroupAt(expr, i)
      continue
    }
    const twoChar = expr.slice(i, i + 2)
    let opLen = 0
    if (
      twoChar === "<=" ||
      twoChar === ">=" ||
      twoChar === "==" ||
      twoChar === "!="
    ) {
      opLen = 2
    } else if (ch === "<" || ch === ">") {
      opLen = 1
    } else if (
      ch === "=" &&
      expr[i + 1] !== "=" &&
      !/[!<>=]/.test(expr[i - 1] ?? "")
    ) {
      opLen = 1
    }

    if (opLen > 0) {
      const lhs = expr.slice(0, i).trim()
      const rhs = expr.slice(i + opLen).trim()
      return (
        lhs.length > 0 &&
        rhs.length > 0 &&
        !/[+\-*/^&|<>=!]$/.test(lhs) &&
        !/^[*/^&|<>=]/.test(rhs)
      )
    }
  }
  return false
}

const hasTopLevelLogicalAnd = (rawExpr: string): boolean => {
  const { operators } = splitTopLevelByPattern(rawExpr, (s, idx) => {
    if (s.slice(idx, idx + 2) === "&&") return 2
    if (s[idx] === "&") return 1
    return 0
  })
  return operators.length > 0
}

const isBooleanOperand = (rawExpr: string): boolean => {
  let expr = rawExpr.replace(/\r?\n\s*\+/g, " ").trim()
  if (!expr) return false

  for (;;) {
    if (expr.startsWith("!") && expr[1] !== "=") {
      const rest = expr.slice(1).trim()
      return rest.length > 0 && !/^[*/^&|<>=)]/.test(rest)
    }
    if (
      (expr.startsWith("(") || expr.startsWith("{")) &&
      findMatchingDelimiter(expr, 0) === expr.length - 1
    ) {
      expr = expr.slice(1, -1).trim()
      continue
    }
    break
  }

  const logicalSplit = splitTopLevelByPattern(expr, (s, idx) => {
    const two = s.slice(idx, idx + 2)
    if (two === "&&" || two === "||") return 2
    if (s[idx] === "&" || s[idx] === "|") return 1
    return 0
  })
  if (logicalSplit.operators.length > 0) {
    return logicalSplit.parts.every(isBooleanOperand)
  }

  return hasTopLevelRelationalOperator(expr)
}

const wrapIfTopLevelLogicalAnd = (segment: string): string => {
  if (!hasTopLevelLogicalAnd(segment)) return segment
  const leadingMatch = segment.match(/^(\s*(?:\r?\n\s*\+\s*)*)/)
  const trailingMatch = segment.match(/(\s*)$/)
  const leading = leadingMatch?.[1] ?? ""
  const trailing = trailingMatch?.[1] ?? ""
  const core = segment.slice(leading.length, segment.length - trailing.length)
  return `${leading}(${core})${trailing}`
}

const rewriteClauseCarets = (clause: string): string => {
  const { parts, operators } = splitTopLevelByPattern(clause, (s, idx) =>
    s[idx] === "^" ? 1 : 0,
  )
  if (operators.length === 0) return clause

  const mergedParts = [...parts]
  const mergedOps = [...operators]
  for (let i = mergedOps.length - 1; i >= 0; i--) {
    const left = mergedParts[i]!
    const right = mergedParts[i + 1]!
    if (!isBooleanOperand(left) && hasTopLevelRelationalOperator(right)) {
      mergedParts.splice(i, 2, `${left}${mergedOps[i]}${right}`)
      mergedOps.splice(i, 1)
    }
  }

  if (mergedOps.length === 0) return mergedParts[0]!

  for (let i = 0; i < mergedOps.length; i++) {
    const left = mergedParts[i]!
    const right = mergedParts[i + 1]!
    if (isBooleanOperand(left) && isBooleanOperand(right)) {
      mergedParts[i] = wrapIfTopLevelLogicalAnd(left)
      mergedParts[i + 1] = wrapIfTopLevelLogicalAnd(right)
      mergedOps[i] = "!="
    }
  }

  let rebuilt = mergedParts[0]!
  for (let i = 0; i < mergedOps.length; i++) {
    rebuilt += mergedOps[i]! + mergedParts[i + 1]!
  }
  return rebuilt
}

const rewriteBooleanCaretsInExpression = (expression: string): string => {
  let nestedRewritten = ""
  for (let i = 0; i < expression.length; i++) {
    const ch = expression[i]!
    if (ch === "(" || ch === "{") {
      const closeIndex = findMatchingDelimiter(expression, i)
      if (closeIndex !== -1) {
        const inner = expression.slice(i + 1, closeIndex)
        nestedRewritten += `${ch}${rewriteBooleanCaretsInExpression(inner)}${expression[closeIndex]}`
        i = closeIndex
        continue
      }
    }
    nestedRewritten += ch
  }

  const { parts, operators } = splitTopLevelByPattern(
    nestedRewritten,
    (s, idx) => {
      if (s.slice(idx, idx + 2) === "||") return 2
      const c = s[idx]
      if (c === "," || c === "?" || c === ":" || c === "|") return 1
      return 0
    },
  )

  let output = rewriteClauseCarets(parts[0]!)
  for (let i = 0; i < operators.length; i++) {
    output += operators[i]! + rewriteClauseCarets(parts[i + 1]!)
  }
  return output
}

const rewritePspiceValueBooleanCarets = (spiceString: string): string => {
  let result = ""
  let cursor = 0
  const valueStartPattern = /\bVALUE\s*=?\s*\{/gi

  for (;;) {
    valueStartPattern.lastIndex = cursor
    const match = valueStartPattern.exec(spiceString)
    if (!match) break

    const blockStart = match.index
    const firstBraceIndex = spiceString.indexOf("{", blockStart)
    const closeBraceIndex = findMatchingDelimiter(spiceString, firstBraceIndex)
    if (closeBraceIndex === -1) break

    result += spiceString.slice(cursor, firstBraceIndex + 1)
    result += rewriteBooleanCaretsInExpression(
      spiceString.slice(firstBraceIndex + 1, closeBraceIndex),
    )
    result += "}"
    cursor = closeBraceIndex + 1
  }

  return result + spiceString.slice(cursor)
}

export const rewritePspiceCompatibilitySyntax = (spiceString: string): string =>
  normalizePspiceSwitchModels(
    rewritePspiceCurrentSourceUnits(
      rewritePspiceValueBooleanCarets(
        normalizePspiceInitialConditionNodes(
          rewritePspiceResistorTcPairs(spiceString),
        ),
      ),
    ),
  )
