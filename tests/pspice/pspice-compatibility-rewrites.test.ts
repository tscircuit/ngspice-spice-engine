import { expect, test } from "bun:test"
import { rewritePspiceCompatibilitySyntax } from "../../lib/rewrite-pspice-compatibility-syntax"

test("rewrites PSPICE resistor TC pairs on resistor lines", () => {
  const spice = [
    "R_U_EA_R1         COMP U_EA_N04642  350k TC=0,0",
    "C1 out 0 1u TC=0,0",
  ].join("\n")

  expect(rewritePspiceCompatibilitySyntax(spice)).toBe(
    [
      "R_U_EA_R1         COMP U_EA_N04642  350k TC1=0 TC2=0",
      "C1 out 0 1u TC=0,0",
    ].join("\n"),
  )
})

test("rewrites only PSPICE VALUE boolean spaced caret operators", () => {
  const spice = [
    "E_ABMGATE  YINT 0 VALUE {{IF(V(A) > {VTHRESH}  ^",
    "+ V(B) > {VTHRESH},{VSS},{VDD})}}",
    "E_AND Y 0 VALUE {{IF(V(A) > 0.5  ^  V(B) > 0.5,1,0)}}",
    "E_EQUALS Y 0 VALUE={IF(V(A) > 0.5 ^ V(B) > .5,1,0)}",
    "E_SPACED_EQUALS Y 0 VALUE = {IF(V(A) > 0.5 ^ V(B) > .5,1,0)}",
    "B1 out 0 V={2 ^ 3}",
    "E_NUM n 0 VALUE {2 ^ 3}",
    "E_NUM_EQUALS n 0 VALUE={2 ^ 3}",
    "E_EXP n2 0 VALUE {{IF(2 ^ 3 > 7,1,0)}}",
    "E_MIXED out 0 VALUE { IF(V(a) > 0.5, 2 ^ 3 > 7, 0) }",
    "R1 in out 1k",
  ].join("\n")

  expect(rewritePspiceCompatibilitySyntax(spice)).toBe(
    [
      "E_ABMGATE  YINT 0 VALUE {{IF(V(A) > {VTHRESH}  !=",
      "+ V(B) > {VTHRESH},{VSS},{VDD})}}",
      "E_AND Y 0 VALUE {{IF(V(A) > 0.5  !=  V(B) > 0.5,1,0)}}",
      "E_EQUALS Y 0 VALUE={IF(V(A) > 0.5 != V(B) > .5,1,0)}",
      "E_SPACED_EQUALS Y 0 VALUE = {IF(V(A) > 0.5 != V(B) > .5,1,0)}",
      "B1 out 0 V={2 ^ 3}",
      "E_NUM n 0 VALUE {2 ^ 3}",
      "E_NUM_EQUALS n 0 VALUE={2 ^ 3}",
      "E_EXP n2 0 VALUE {{IF(2 ^ 3 > 7,1,0)}}",
      "E_MIXED out 0 VALUE { IF(V(a) > 0.5, 2 ^ 3 > 7, 0) }",
      "R1 in out 1k",
    ].join("\n"),
  )
})

test("rewrites parenthesized, unspaced, and compound PSPICE VALUE boolean carets while preserving exponentiation", () => {
  const spice = [
    "E_PAREN Y 0 VALUE={IF((V(A) > 0.5) ^ (V(B) > 0.5), 1, 0)}",
    "G_PAREN 0 Y VALUE {{IF(((V(A) > {VTHRESH})) ^ ((V(B) >= {VTHRESH})), 1m, 0)}}",
    "E_UNSPACED Y 0 VALUE={IF(V(A)>0.5^V(B)>.5,1,0)}",
    "E_PAREN_UNSPACED Y 0 VALUE={IF((V(A)>0.5)^(V(B)>.5),1,0)}",
    "E_PARITY Y 0 VALUE={IF((V(A) > 0.5) ^ (V(B) > 0.5) ^ (V(C) > 0.5), 1, 0)}",
    "E_NEG Y 0 VALUE={IF(!(V(A) > 0.5) ^ (V(B) > 0.5), 1, 0)}",
    "E_AND_CHAIN Y 0 VALUE={IF(V(Z) > 0.5 & V(A) > 0.5 ^ V(B) > 0.5, 1, 0)}",
    "E_OR_CHAIN Y 0 VALUE={IF(V(Z) > 0.5 | V(A) > 0.5 ^ V(B) > 0.5, 1, 0)}",
    "E_CURR Y 0 VALUE={IF((I(VSENSE) > 1m) ^ (V(A) - V(REF) > 0.5), 1, 0)}",
    "E_NESTED_POW_XOR Y 0 VALUE={IF(((V(A) + 1) ^ 2 > 1.5) ^ (V(B) > 0.5), 1, 0)}",
    "E_PAREN_POW Y 0 VALUE={(V(A) + 1) ^ 2}",
    "E_PAREN_POW_CMP Y 0 VALUE={IF((V(A) + 1) ^ 2 > 4, 1, 0)}",
    "E_RHS_POW_CMP Y 0 VALUE={IF(7 < 2 ^ 3, 1, 0)}",
    "E_NODE_POW Y 0 VALUE={(V(A)) ^ (V(B))}",
  ].join("\n")

  expect(rewritePspiceCompatibilitySyntax(spice)).toBe(
    [
      "E_PAREN Y 0 VALUE={IF((V(A) > 0.5) != (V(B) > 0.5), 1, 0)}",
      "G_PAREN 0 Y VALUE {{IF(((V(A) > {VTHRESH})) != ((V(B) >= {VTHRESH})), 1m, 0)}}",
      "E_UNSPACED Y 0 VALUE={IF(V(A)>0.5!=V(B)>.5,1,0)}",
      "E_PAREN_UNSPACED Y 0 VALUE={IF((V(A)>0.5)!=(V(B)>.5),1,0)}",
      "E_PARITY Y 0 VALUE={IF((V(A) > 0.5) != (V(B) > 0.5) != (V(C) > 0.5), 1, 0)}",
      "E_NEG Y 0 VALUE={IF(!(V(A) > 0.5) != (V(B) > 0.5), 1, 0)}",
      "E_AND_CHAIN Y 0 VALUE={IF((V(Z) > 0.5 & V(A) > 0.5) != V(B) > 0.5, 1, 0)}",
      "E_OR_CHAIN Y 0 VALUE={IF(V(Z) > 0.5 | V(A) > 0.5 != V(B) > 0.5, 1, 0)}",
      "E_CURR Y 0 VALUE={IF((I(VSENSE) > 1m) != (V(A) - V(REF) > 0.5), 1, 0)}",
      "E_NESTED_POW_XOR Y 0 VALUE={IF(((V(A) + 1) ^ 2 > 1.5) != (V(B) > 0.5), 1, 0)}",
      "E_PAREN_POW Y 0 VALUE={(V(A) + 1) ^ 2}",
      "E_PAREN_POW_CMP Y 0 VALUE={IF((V(A) + 1) ^ 2 > 4, 1, 0)}",
      "E_RHS_POW_CMP Y 0 VALUE={IF(7 < 2 ^ 3, 1, 0)}",
      "E_NODE_POW Y 0 VALUE={(V(A)) ^ (V(B))}",
    ].join("\n"),
  )
})
