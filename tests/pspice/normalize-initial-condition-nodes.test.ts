import { expect, test } from "bun:test"
import { normalizePspiceInitialConditionNodes } from "../../lib/normalize-pspice-initial-condition-nodes"

test("normalizes initial-condition voltage nodes without changing other cards", () => {
  const spice = `* .IC V(out )=2
.subckt discharge out params: initial=2
.IC V(out )={initial} V( internal )=1
.ic v (
+ out ) = 2 ; Keep this comment: V(out )
R1 out internal 1k
.meas tran peak MAX V(out )
.ends discharge
X1 output discharge
.IC V( output ) = 3
.end
`

  expect(normalizePspiceInitialConditionNodes(spice)).toBe(`* .IC V(out )=2
.subckt discharge out params: initial=2
.IC V(out)={initial} V(internal)=1
.ic v(out) = 2 ; Keep this comment: V(out )
R1 out internal 1k
.meas tran peak MAX V(out )
.ends discharge
X1 output discharge
.IC V(output) = 3
.end
`)
})
