import { describe, expect, test } from "bun:test"
import type { ResultType } from "eecircuit-engine"
import { eecircuitResultToVGraphs } from "../lib"

describe("eecircuitResultToVGraphs", () => {
  const baseResult: ResultType = {
    header: "test",
    numVariables: 3,
    variableNames: ["time", "v(out)", "v(in)"],
    numPoints: 3,
    dataType: "real",
    data: [
      {
        name: "time",
        type: "time",
        values: [0, 1, 2],
      },
      {
        type: "voltage",
        name: "V(out)",
        values: [0, 1, 2],
      },
      {
        type: "voltage",
        name: "V(in)",
        values: [3, 4, 5],
      },
    ],
  }

  test("includes all voltages when .print tran is absent", () => {
    const graphs = eecircuitResultToVGraphs(baseResult, "")

    expect(graphs).toHaveLength(2)
    expect(graphs[0]).toMatchObject({ netName: "out" })
    expect(graphs[1]).toMatchObject({ netName: "in" })
  })

  test("filters to requested voltages", () => {
    const graphs = eecircuitResultToVGraphs(baseResult, ".print tran v(out)")

    expect(graphs).toHaveLength(1)
    expect(graphs[0]).toMatchObject({ netName: "out" })
  })
})
