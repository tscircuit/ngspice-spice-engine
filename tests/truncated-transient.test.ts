import { expect, test } from "bun:test"
import { eecircuitResultToSimulationGraphs } from "../lib"
import type { ResultType } from "../lib/eecircuit-engine-types"

test("rejects a truncated transient instead of extending its last voltage", () => {
  const result: ResultType = {
    header: "Transient stopped before the requested end time",
    numVariables: 2,
    variableNames: ["time", "v(out)"],
    numPoints: 3,
    dataType: "real",
    data: [
      { name: "time", type: "time", values: [0, 0.001, 0.002] },
      { name: "v(out)", type: "voltage", values: [0, 2.7, 2.8] },
    ],
  }

  expect(() =>
    eecircuitResultToSimulationGraphs(
      result,
      "* Truncated startup\n.print tran V(out)\n.tran 1m 10m\n.end",
    ),
  ).toThrow(/stopped.*before.*requested/i)
})
