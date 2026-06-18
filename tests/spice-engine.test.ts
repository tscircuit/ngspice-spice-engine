import { describe, expect, test } from "bun:test"
import { createNgspiceSpiceEngine } from "../lib"

describe("ngspiceSpiceEngine", () => {
  test(
    "should emit voltage-only transient graph output",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `
V1 out 0 DC 3.3
.PRINT TRAN V(out)
.tran 0.001 0.002
.END
`

      const { simulationResultCircuitJson } =
        await spiceEngine.simulate(spiceString)

      expect(simulationResultCircuitJson).toHaveLength(1)
      expect(simulationResultCircuitJson[0]).toMatchObject({
        type: "simulation_transient_voltage_graph",
        simulation_transient_voltage_graph_id: "simulation_graph_0_out",
        name: "out",
        start_time_ms: 0,
        time_per_step: 1,
        end_time_ms: 2,
      })
      expect(
        (simulationResultCircuitJson[0] as any).voltage_levels.length,
      ).toBeGreaterThan(0)
      expect((simulationResultCircuitJson[0] as any).current_levels).toBe(
        undefined,
      )
    },
    { timeout: 15_000 },
  )

  test(
    "should emit current-only transient graph output",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `
V1 in 0 DC 1
Vsense in out DC 0
R1 out 0 100
* tscircuit_current_probe {"simulation_current_probe_id":"simulation_current_probe_0","name":"I_R1","spice_vector":"I(Vsense)","source_component_id":"source_component_0","source_trace_id":"source_trace_0"}
.PRINT TRAN I(Vsense)
.tran 0.001 0.002
.END
`

      const { simulationResultCircuitJson } =
        await spiceEngine.simulate(spiceString)

      expect(simulationResultCircuitJson).toHaveLength(1)
      expect(simulationResultCircuitJson[0]).toMatchObject({
        type: "simulation_transient_current_graph",
        simulation_transient_current_graph_id:
          "simulation_graph_simulation_current_probe_0",
        name: "I_R1",
        source_probe_id: "simulation_current_probe_0",
        source_probe_name: "I_R1",
        source_component_id: "source_component_0",
        source_trace_id: "source_trace_0",
        start_time_ms: 0,
        time_per_step: 1,
        end_time_ms: 2,
      })
      expect(
        (simulationResultCircuitJson[0] as any).current_levels.length,
      ).toBeGreaterThan(0)
      expect((simulationResultCircuitJson[0] as any).voltage_levels).toBe(
        undefined,
      )
    },
    { timeout: 15_000 },
  )

  test(
    "should emit mixed voltage and current transient graph output",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `
V1 in 0 DC 1
Vsense in out DC 0
R1 out 0 100
* tscircuit_probe {"simulation_voltage_probe_id":"simulation_voltage_probe_0","name":"VOUT","spice_vector":"V(out)","source_node_name":"out"}
* tscircuit_current_probe {"simulation_current_probe_id":"simulation_current_probe_0","name":"I_R1","spice_vector":"I(Vsense)"}
.PRINT TRAN V(out) I(Vsense)
.tran 0.001 0.002
.END
`

      const { simulationResultCircuitJson } =
        await spiceEngine.simulate(spiceString)

      expect(simulationResultCircuitJson).toHaveLength(2)

      const voltageGraph = simulationResultCircuitJson.find(
        (graph) => graph.type === "simulation_transient_voltage_graph",
      )
      const currentGraph = simulationResultCircuitJson.find(
        (graph) => graph.type === "simulation_transient_current_graph",
      )

      expect(voltageGraph).toMatchObject({
        simulation_transient_voltage_graph_id:
          "simulation_graph_simulation_voltage_probe_0",
        name: "VOUT",
      })
      expect(currentGraph).toMatchObject({
        simulation_transient_current_graph_id:
          "simulation_graph_simulation_current_probe_0",
        name: "I_R1",
      })
      expect((voltageGraph as any).voltage_levels.length).toBe(
        (voltageGraph as any).timestamps_ms.length,
      )
      expect((currentGraph as any).current_levels.length).toBe(
        (currentGraph as any).timestamps_ms.length,
      )
    },
    { timeout: 15_000 },
  )

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

  test(
    "should name simulation graphs from tscircuit probe metadata",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `
* Probe metadata
RR1 N5 0 82.5
Vsimulation_voltage_source_0 N5 0 DC 3.3
* tscircuit_probe {"simulation_voltage_probe_id":"simulation_voltage_probe_0","name":"VOUT_PROBE","spice_vector":"V(N5)","source_node_name":"N5"}
.PRINT TRAN V(N5)
.tran 0.0001 0.0002 UIC
.END
`

      const { simulationResultCircuitJson } =
        await spiceEngine.simulate(spiceString)

      expect(simulationResultCircuitJson).toHaveLength(1)
      expect(simulationResultCircuitJson[0]).toMatchObject({
        simulation_transient_voltage_graph_id:
          "simulation_graph_simulation_voltage_probe_0",
        name: "VOUT_PROBE",
        source_probe_id: "simulation_voltage_probe_0",
        source_probe_name: "VOUT_PROBE",
        source_node_name: "N5",
      })
    },
    { timeout: 15_000 },
  )

  test(
    "should preserve differential probe metadata in simulation graphs",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `
* Differential probe metadata
RR1 N7 N6 100
Vsimulation_voltage_source_0 N7 0 DC 5
Vsimulation_voltage_source_1 N6 0 DC 3
* tscircuit_probe {"simulation_voltage_probe_id":"simulation_voltage_probe_1","name":"L1_PROBE","spice_vector":"V(N7,N6)","source_node_name":"N7","reference_node_name":"N6"}
.PRINT TRAN V(N7,N6)
.tran 0.0001 0.0002 UIC
.END
`

      const { simulationResultCircuitJson } =
        await spiceEngine.simulate(spiceString)

      expect(simulationResultCircuitJson).toHaveLength(1)
      expect(simulationResultCircuitJson[0]).toMatchObject({
        simulation_transient_voltage_graph_id:
          "simulation_graph_simulation_voltage_probe_1",
        name: "L1_PROBE",
        source_probe_id: "simulation_voltage_probe_1",
        source_probe_name: "L1_PROBE",
        source_node_name: "N7",
        reference_node_name: "N6",
      })
    },
    { timeout: 15_000 },
  )
})
