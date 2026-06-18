import { describe, expect, test } from "bun:test"
import type {
  CircuitJson,
  SimulationExperiment,
  SimulationTransientCurrentGraph,
  SimulationTransientVoltageGraph,
} from "circuit-json"
import { convertCircuitJsonToSimulationGraphSvg } from "circuit-to-svg"
import { createNgspiceSpiceEngine } from "../lib"

type SimulationTransientGraph =
  | SimulationTransientCurrentGraph
  | SimulationTransientVoltageGraph

const renderSimulationGraphSvg = ({
  originalSimulationResult,
  simulation_experiment_id,
  name,
}: {
  originalSimulationResult: CircuitJson
  simulation_experiment_id: string
  name: string
}) => {
  const simulationResultCircuitJson = (
    originalSimulationResult as SimulationTransientGraph[]
  ).map((graph) => ({
    ...graph,
    simulation_experiment_id,
  }))

  const simulationExperiment: SimulationExperiment = {
    type: "simulation_experiment",
    simulation_experiment_id,
    name,
    experiment_type: "spice_transient_analysis",
  }

  return convertCircuitJsonToSimulationGraphSvg({
    circuitJson: [simulationExperiment, ...simulationResultCircuitJson],
    simulation_experiment_id,
    simulation_transient_current_graph_ids: simulationResultCircuitJson
      .filter((graph) => graph.type === "simulation_transient_current_graph")
      .map((graph) => graph.simulation_transient_current_graph_id),
    simulation_transient_voltage_graph_ids: simulationResultCircuitJson
      .filter((graph) => graph.type === "simulation_transient_voltage_graph")
      .map((graph) => graph.simulation_transient_voltage_graph_id),
  })
}

describe("graph snapshots", () => {
  test(
    "should create a snapshot of a bridge rectifier simulation",
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

      const { simulationResultCircuitJson: originalSimulationResult } =
        await spiceEngine.simulate(spiceString)

      const simulation_experiment_id = "test_experiment_id"

      const svg = renderSimulationGraphSvg({
        originalSimulationResult,
        simulation_experiment_id,
        name: "Bridge Rectifier",
      })

      expect(svg).toMatchSvgSnapshot(
        import.meta.path,
        "bridge-rectifier-simulation",
      )
    },
    { timeout: 15_000 },
  )

  test(
    "should create a snapshot with voltage and current graphs",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `
* Bridge Rectifier With Sense Source
.MODEL D D
DD1 VP_IN1 VP_OUT D
DD2 N1 VP_IN1 D
DD3 0 VP_OUT D
DD4 N1 0 D
RR1 VP_OUT SENSE_N 100
Vsense_R1 SENSE_N N1 DC 0
Vsimulation_voltage_source_0 VP_IN1 0 SIN(0 5 40 0 0 0)
* tscircuit_probe {"simulation_voltage_probe_id":"simulation_voltage_probe_vout","name":"VOUT_DIFF","spice_vector":"V(VP_OUT,N1)","source_node_name":"VP_OUT","reference_node_name":"N1"}
* tscircuit_current_probe {"simulation_current_probe_id":"simulation_current_probe_r1","name":"I_R1","spice_vector":"I(Vsense_R1)"}
.PRINT TRAN V(VP_OUT, N1) I(Vsense_R1)
.tran 0.001 0.05 UIC
.END
`

      const { simulationResultCircuitJson: originalSimulationResult } =
        await spiceEngine.simulate(spiceString)

      expect(
        originalSimulationResult.some(
          (graph) => graph.type === "simulation_transient_voltage_graph",
        ),
      ).toBe(true)
      expect(
        originalSimulationResult.some(
          (graph) => graph.type === "simulation_transient_current_graph",
        ),
      ).toBe(true)

      const svg = renderSimulationGraphSvg({
        originalSimulationResult,
        simulation_experiment_id: "test_experiment_id_voltage_and_current",
        name: "Bridge Rectifier Voltage and Current",
      })

      expect(svg).toMatchSvgSnapshot(
        import.meta.path,
        "bridge-rectifier-voltage-and-current-simulation",
      )
    },
    { timeout: 15_000 },
  )

  test(
    "should create a snapshot with only a current graph",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `
* Bridge Rectifier Current Sense Only
.MODEL D D
DD1 VP_IN1 VP_OUT D
DD2 N1 VP_IN1 D
DD3 0 VP_OUT D
DD4 N1 0 D
RR1 VP_OUT SENSE_N 100
Vsense_R1 SENSE_N N1 DC 0
Vsimulation_voltage_source_0 VP_IN1 0 SIN(0 5 40 0 0 0)
* tscircuit_current_probe {"simulation_current_probe_id":"simulation_current_probe_r1","name":"I_R1","spice_vector":"I(Vsense_R1)"}
.PRINT TRAN I(Vsense_R1)
.tran 0.001 0.05 UIC
.END
`

      const { simulationResultCircuitJson: originalSimulationResult } =
        await spiceEngine.simulate(spiceString)

      expect(originalSimulationResult).toHaveLength(1)
      expect(originalSimulationResult[0]).toMatchObject({
        type: "simulation_transient_current_graph",
        name: "I_R1",
      })

      const svg = renderSimulationGraphSvg({
        originalSimulationResult,
        simulation_experiment_id: "test_experiment_id_current_only",
        name: "Bridge Rectifier Current",
      })

      expect(svg).toMatchSvgSnapshot(
        import.meta.path,
        "bridge-rectifier-current-only-simulation",
      )
    },
    { timeout: 15_000 },
  )
})
