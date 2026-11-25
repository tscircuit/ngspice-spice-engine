import { expect, test } from "bun:test"
import { createNgspiceSpiceEngine } from "../../lib"
import { renderXorTruthTableSnapshot } from "../fixtures/render-xor-truth-table-snapshot"

test("simulates the TPS82085 VALUE= XOR truth table", async () => {
  const spiceEngine = await createNgspiceSpiceEngine()
  const { simulationResultCircuitJson } =
    await spiceEngine.simulate(`* TPS82085 XOR expression with VALUE=
VA a 0 PWL(0 0 0.999u 0 1u 1 2.999u 1 3u 0 4u 0)
VB b 0 PWL(0 0 1.999u 0 2u 1 4u 1)
EXOR out 0 VALUE={IF(V(a) > 0.5 ^ V(b) > .5,1,0)}
Rout out 0 1k
.print tran v(a) v(b) v(out)
.tran 10n 4u UIC
.end`)

  const graphs = simulationResultCircuitJson.filter(
    (graph) => graph.type === "simulation_transient_voltage_graph",
  )
  const output = graphs.find((graph) => graph.name === "out")!
  expect(output.voltage_levels).toHaveLength(401)
  expect(
    [50, 150, 250, 350].map((index) => output.voltage_levels[index]),
  ).toEqual([0, 1, 0, 1])
  expect(renderXorTruthTableSnapshot(graphs)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
