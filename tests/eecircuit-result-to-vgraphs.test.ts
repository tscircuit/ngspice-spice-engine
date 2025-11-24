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

  test("preserves casing from spice string over engine's casing", () => {
    // Create a result where the engine returns a different casing
    // than what we'll request.
    const result: ResultType = {
      header: "test",
      numVariables: 2,
      variableNames: ["time", "v(MyNet)"],
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
          name: "v(mynet)", // engine returns lowercase
          values: [0, 1, 2],
        },
      ],
    }

    const graphs = eecircuitResultToVGraphs(result, ".print tran V(MyNet)")

    expect(graphs).toHaveLength(1)
    expect(graphs[0]?.netName).toBe("MyNet")
  })

  test("handles differential voltage plots", () => {
    const result: ResultType = {
      header: "test",
      numVariables: 2,
      variableNames: ["time", "v(vp_out,n1)"],
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
          name: "v(vp_out,n1)",
          values: [6, 7, 8],
        },
      ],
    }

    const graphs = eecircuitResultToVGraphs(result, ".print tran V(VP_OUT, N1)")

    expect(graphs).toHaveLength(1)
    expect(graphs[0]).toMatchObject({ netName: "VP_OUT-N1" })
  })

  test("handles both normal and differential voltage plots", () => {
    const result: ResultType = {
      header: "test",
      numVariables: 3,
      variableNames: ["time", "v(vp_in1)", "v(vp_out,n1)"],
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
          name: "v(vp_in1)",
          values: [3, 4, 5],
        },
        {
          type: "voltage",
          name: "v(vp_out,n1)",
          values: [6, 7, 8],
        },
      ],
    }

    const graphs = eecircuitResultToVGraphs(
      result,
      ".print tran V(VP_IN1) V(VP_OUT, N1)",
    )

    expect(graphs).toHaveLength(2)
    expect(graphs[0]).toMatchObject({ netName: "VP_IN1" })
    expect(graphs[1]).toMatchObject({ netName: "VP_OUT-N1" })
  })

  test("calculates differential voltage plots from nodes", () => {
    const result: ResultType = {
      header: "test",
      numVariables: 3,
      variableNames: ["time", "v(vp_out)", "v(n1)"],
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
          name: "v(vp_out)",
          values: [10, 12, 14],
        },
        {
          type: "voltage",
          name: "v(n1)",
          values: [6, 7, 8],
        },
      ],
    }

    const graphs = eecircuitResultToVGraphs(result, ".print tran V(VP_OUT, N1)")

    expect(graphs).toHaveLength(1)
    expect(graphs[0]).toMatchObject({
      netName: "VP_OUT-N1",
      voltage: [4, 5, 6], // 10-6, 12-7, 14-8
    })
  })
})
