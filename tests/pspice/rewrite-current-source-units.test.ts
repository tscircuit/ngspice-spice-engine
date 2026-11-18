import { expect, test } from "bun:test"
import { rewritePspiceCurrentSourceUnits } from "../../lib/rewrite-pspice-current-source-units"

test("preserves engineering prefixes and node names in nested current sources", () => {
  const spice = `* Current references
.subckt reference OUT
I1 0 OUT DC 1Adc
I2 0 sense1Adc DC -2.3mAdc
I3 0 OUT DC {biasAdc}
I4 0 OUT DC 1a
.ends reference
.end
`

  expect(rewritePspiceCurrentSourceUnits(spice)).toBe(`* Current references
.subckt reference OUT
I1 0 OUT DC 1
I2 0 sense1Adc DC -2.3m
I3 0 OUT DC {biasAdc}
I4 0 OUT DC 1a
.ends reference
.end
`)
})
