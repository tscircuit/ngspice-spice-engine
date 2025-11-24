import { describe, expect, test } from "bun:test"
import type { SpiceEngine } from "@tscircuit/props"
import { createNgspiceSpiceEngine } from "../lib"

describe("ngspiceSpiceEngine", () => {
  // NOTE: this is a longer running test as it runs a real simulation
  test(
    "should create and simulate a circuit with normal and differential plots",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `
* Bridge Rectifier
.MODEL D D
DD1 VP_IN1 VP_OUT D
DD2 N1 VP_IN1 D
DD3 0 VP_OUT D
DD4 N1 0 D
RR1 VP_OUT N1 100
Vsimulation_voltage_source_0 VP_IN1 0 SIN(0 5 40 0 0 0)
.PRINT TRAN V(VP_IN1) V(VP_OUT, N1)
.tran 0.0001 0.1 UIC
.END
`

      const { simulationResultCircuitJson } =
        await spiceEngine.simulate(spiceString)

      expect(simulationResultCircuitJson).toHaveLength(2)

      // Note: order isn't guaranteed
      const graph1 = simulationResultCircuitJson.find(
        (g) => g.name === "VP_IN1",
      )
      const graph2 = simulationResultCircuitJson.find(
        (g) => g.name === "VP_OUT-N1",
      )

      expect(graph1).toBeDefined()
      expect(graph2).toBeDefined()

      expect(graph1!.voltage_levels.length).toBeGreaterThan(0)
      expect(graph1!.timestamps_ms.length).toBeGreaterThan(0)
      expect(graph1!.voltage_levels.length).toBe(graph1!.timestamps_ms.length)

      expect(graph2!.voltage_levels.length).toBeGreaterThan(0)
      expect(graph2!.timestamps_ms.length).toBeGreaterThan(0)
      expect(graph2!.voltage_levels.length).toBe(graph2!.timestamps_ms.length)

      // Check some parameters parsed from .tran
      expect(graph1!.start_time_ms).toBe(0)
      expect(graph1!.end_time_ms).toBe(100) // 0.1s
      expect(graph1!.time_per_step).toBe(0.1) // 0.0001s
    },
    { timeout: 15_000 },
  )
})
