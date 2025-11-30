import { describe, expect, test } from "bun:test"
import type {
  SimulationExperiment,
  SimulationTransientVoltageGraph,
} from "circuit-json"
import { convertCircuitJsonToSimulationGraphSvg } from "circuit-to-svg"
import { createNgspiceSpiceEngine } from "../lib"

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

      const simulationResultCircuitJson = (
        originalSimulationResult as SimulationTransientVoltageGraph[]
      ).map((graph) => ({
        ...graph,
        simulation_experiment_id,
      }))

      const simulationExperiment: SimulationExperiment = {
        type: "simulation_experiment",
        simulation_experiment_id,
        name: "Bridge Rectifier",
        experiment_type: "spice_transient_analysis",
      }

      const circuitJson = [simulationExperiment, ...simulationResultCircuitJson]

      const svg = convertCircuitJsonToSimulationGraphSvg({
        circuitJson: circuitJson,
        simulation_experiment_id,
      })

      expect(svg).toMatchSvgSnapshot(
        import.meta.path,
        "bridge-rectifier-simulation",
      )
    },
    { timeout: 15_000 },
  )
})
