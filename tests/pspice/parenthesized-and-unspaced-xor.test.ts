import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"
import type { SimulationTransientVoltageGraph } from "circuit-json"
import { createNgspiceSpiceEngine } from "../../lib"
import { renderXorTruthTableSnapshot } from "../fixtures/render-xor-truth-table-snapshot"

test("simulates parenthesized, unspaced, and compound PSpice VALUE boolean XOR truth tables", async () => {
  const spiceEngine = await createNgspiceSpiceEngine()
  const parenthesizedNetlist = await readFile(
    new URL("../fixtures/pspice/xor2-parenthesized-caret.cir", import.meta.url),
    "utf8",
  )

  const { simulationResultCircuitJson } =
    await spiceEngine.simulate(parenthesizedNetlist)
  const graphs = simulationResultCircuitJson.filter(
    (graph): graph is SimulationTransientVoltageGraph =>
      graph.type === "simulation_transient_voltage_graph",
  )
  const output = graphs.find((graph) => graph.name === "out")!
  expect(output.voltage_levels).toHaveLength(401)
  for (const [sampleIndex, expectedVoltage] of [
    [50, 0],
    [150, 1],
    [250, 0],
    [350, 1],
  ] as const) {
    expect(output.voltage_levels[sampleIndex]).toBeCloseTo(expectedVoltage, 2)
  }

  // Round near-integer RC settled levels so the truth-table renderer displays exact 0/1 states
  const settledGraphs = graphs.map((graph) =>
    graph.name === "out"
      ? {
          ...graph,
          voltage_levels: graph.voltage_levels.map((v) =>
            Math.abs(v - 1) < 1e-2 ? 1 : Math.abs(v) < 1e-2 ? 0 : v,
          ),
        }
      : graph,
  )
  expect(renderXorTruthTableSnapshot(settledGraphs)).toMatchSvgSnapshot(
    import.meta.path,
  )

  const { simulationResultCircuitJson: compactAndPrecedenceResult } =
    await spiceEngine.simulate(`* Unspaced XOR and & > ^ precedence
VA a 0 PWL(0 0 0.999u 0 1u 1 2.999u 1 3u 0 4u 0)
VB b 0 PWL(0 0 1.999u 0 2u 1 4u 1)
VZ z 0 DC 0
E_UNSPACED out_unspaced 0 VALUE={IF(V(a)>0.5^V(b)>.5,1,0)}
E_PRECEDENCE out_prec 0 VALUE={IF(V(z) > 0.5 & V(a) > 0.5 ^ V(b) > 0.5, 1, 0)}
Rout1 out_unspaced 0 1k
Rout2 out_prec 0 1k
.print tran v(out_unspaced) v(out_prec)
.tran 10n 4u UIC
.end`)

  const compactGraphs = compactAndPrecedenceResult.filter(
    (graph) => graph.type === "simulation_transient_voltage_graph",
  )
  const unspacedOut = compactGraphs.find((g) => g.name === "out_unspaced")!
  const precOut = compactGraphs.find((g) => g.name === "out_prec")!

  expect([50, 150, 250, 350].map((i) => unspacedOut.voltage_levels[i])).toEqual(
    [0, 1, 0, 1],
  )
  // Since V(z) = 0, (0 & V(a)>0.5) ^ (V(b)>0.5) equals V(b)>0.5 -> [0, 0, 1, 1]
  expect([50, 150, 250, 350].map((i) => precOut.voltage_levels[i])).toEqual([
    0, 0, 1, 1,
  ])
}, 15_000)
