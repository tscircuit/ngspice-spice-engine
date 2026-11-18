import { expect, test } from "bun:test"
import { normalizePspiceSwitchModels } from "../../lib/normalize-pspice-switch-models"

test("normalizes parameterized switches inside their original subcircuit", () => {
  const spice = `* Switch library
.subckt isolation IN OUT CONTROL
.param ROPEN=1MEG RCLOSED=1u
S1 IN OUT CONTROL 0 OUTPUT_SWITCH
.model OUTPUT_SWITCH VSWITCH(RON={ROPEN} ROFF={RCLOSED} VON=1m VOFF=0)
.ends isolation
.model NORMAL VSWITCH(RON=1m ROFF=1MEG VON=1 VOFF=0)
.end
`

  const normalizedSource = normalizePspiceSwitchModels(spice)

  expect(normalizedSource).toContain("ron={min({ROPEN},{RCLOSED})}")
  expect(normalizedSource).toContain("von={if({ROPEN}>{RCLOSED},0,1m)}")
  expect(normalizedSource).toContain(
    ".model NORMAL VSWITCH(RON=1m ROFF=1MEG VON=1 VOFF=0)",
  )
})
