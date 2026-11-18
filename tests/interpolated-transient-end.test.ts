import { expect, test } from "bun:test"
import { eecircuitResultToSimulationGraphs } from "../lib"
import type { ResultType } from "../lib/eecircuit-engine-types"

test("accepts the last output-grid sample when stop time is between samples", () => {
  const result: ResultType = {
    header: "Interpolated transient output",
    numVariables: 2,
    variableNames: ["time", "v(out)"],
    numPoints: 3,
    dataType: "real",
    data: [
      { name: "time", type: "time", values: [0, 0.003, 0.006] },
      { name: "v(out)", type: "voltage", values: [0, 2.7, 2.8] },
    ],
  }

  const graphs = eecircuitResultToSimulationGraphs(
    result,
    "* Interpolated output\n.options interp\n.print tran V(out)\n.tran 3m 8m\n.end",
  )
  expect(graphs[0]).toMatchObject({ time: [0, 0.003, 0.006] })
})
