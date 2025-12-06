import { describe, expect, test } from "bun:test"
import type {
  SimulationExperiment,
  SimulationTransientVoltageGraph,
} from "circuit-json"
import { convertCircuitJsonToSimulationGraphSvg } from "circuit-to-svg"
import { createNgspiceSpiceEngine } from "../lib"

describe("timestep-snapshots", () => {
  test(
    "should create a snapshot with 0.001 tstep",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `* Circuit JSON to SPICE Netlist
.MODEL D D
.MODEL SWMOD SW
LL1 V1.pin1 N1 1
DD1 N1 R1.pin1 D
CC1 R1.pin1 0 10U
RR1 R1.pin1 0 1K
SM1 N1 0 N2 0 SWMOD
Vsimulation_voltage_source_0 V1.pin1 0 DC 5
Vsimulation_voltage_source_1 N2 0 PULSE(0 10 0 1n 1n 0.00068 0.001)
.PRINT TRAN V(V1.pin1) V(R1.pin1)
.tran 0.001 0.1 0 0.001 UIC
.END`

      const { simulationResultCircuitJson: originalSimulationResult } =
        await spiceEngine.simulate(spiceString)

      const simulation_experiment_id = "test_experiment_id_tstep_1"

      const simulationResultCircuitJson = (
        originalSimulationResult as SimulationTransientVoltageGraph[]
      ).map((graph) => ({
        ...graph,
        simulation_experiment_id,
      }))

      const simulationExperiment: SimulationExperiment = {
        type: "simulation_experiment",
        simulation_experiment_id,
        name: "Timestep 0.001",
        experiment_type: "spice_transient_analysis",
      }

      const circuitJson = [simulationExperiment, ...simulationResultCircuitJson]

      const svg = convertCircuitJsonToSimulationGraphSvg({
        circuitJson: circuitJson,
        simulation_experiment_id,
      })

      expect(svg).toMatchSvgSnapshot(import.meta.path, "timestep-0.001")
    },
    { timeout: 15_000 },
  )

  test(
    "should create a snapshot with 0.005 tstep",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `* Circuit JSON to SPICE Netlist
.MODEL D D
.MODEL SWMOD SW
LL1 V1.pin1 N1 1
DD1 N1 R1.pin1 D
CC1 R1.pin1 0 10U
RR1 R1.pin1 0 1K
SM1 N1 0 N2 0 SWMOD
Vsimulation_voltage_source_0 V1.pin1 0 DC 5
Vsimulation_voltage_source_1 N2 0 PULSE(0 10 0 1n 1n 0.00068 0.001)
.PRINT TRAN V(V1.pin1) V(R1.pin1)
.tran 0.005 0.1 0 0.005 UIC
.END`

      const { simulationResultCircuitJson: originalSimulationResult } =
        await spiceEngine.simulate(spiceString)

      const simulation_experiment_id = "test_experiment_id_tstep_5"

      const simulationResultCircuitJson = (
        originalSimulationResult as SimulationTransientVoltageGraph[]
      ).map((graph) => ({
        ...graph,
        simulation_experiment_id,
      }))

      const simulationExperiment: SimulationExperiment = {
        type: "simulation_experiment",
        simulation_experiment_id,
        name: "Timestep 0.005",
        experiment_type: "spice_transient_analysis",
      }

      const circuitJson = [simulationExperiment, ...simulationResultCircuitJson]

      const svg = convertCircuitJsonToSimulationGraphSvg({
        circuitJson: circuitJson,
        simulation_experiment_id,
      })

      expect(svg).toMatchSvgSnapshot(import.meta.path, "timestep-0.005")
    },
    { timeout: 15_000 },
  )

  test(
    "should create a snapshot with 0.001 tstep and no tmax",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `* Circuit JSON to SPICE Netlist
.MODEL D D
.MODEL SWMOD SW
LL1 V1.pin1 N1 1
DD1 N1 R1.pin1 D
CC1 R1.pin1 0 10U
RR1 R1.pin1 0 1K
SM1 N1 0 N2 0 SWMOD
Vsimulation_voltage_source_0 V1.pin1 0 DC 5
Vsimulation_voltage_source_1 N2 0 PULSE(0 10 0 1n 1n 0.00068 0.001)
.PRINT TRAN V(V1.pin1) V(R1.pin1)
.tran 0.001 0.1
.END`

      const { simulationResultCircuitJson: originalSimulationResult } =
        await spiceEngine.simulate(spiceString)

      const simulation_experiment_id = "test_experiment_id_tstep_1_no_tmax"

      const simulationResultCircuitJson = (
        originalSimulationResult as SimulationTransientVoltageGraph[]
      ).map((graph) => ({
        ...graph,
        simulation_experiment_id,
      }))

      const simulationExperiment: SimulationExperiment = {
        type: "simulation_experiment",
        simulation_experiment_id,
        name: "Timestep 0.001, no tmax",
        experiment_type: "spice_transient_analysis",
      }

      const circuitJson = [simulationExperiment, ...simulationResultCircuitJson]

      const svg = convertCircuitJsonToSimulationGraphSvg({
        circuitJson: circuitJson,
        simulation_experiment_id,
      })

      expect(svg).toMatchSvgSnapshot(import.meta.path, "timestep-0.001-no-tmax")
    },
    { timeout: 15_000 },
  )

  test(
    "should create a snapshot with 0.001 tstep and 0.005 tmax",
    async () => {
      const spiceEngine = await createNgspiceSpiceEngine()

      const spiceString = `* Circuit JSON to SPICE Netlist
.MODEL D D
.MODEL SWMOD SW
LL1 V1.pin1 N1 1
DD1 N1 R1.pin1 D
CC1 R1.pin1 0 10U
RR1 R1.pin1 0 1K
SM1 N1 0 N2 0 SWMOD
Vsimulation_voltage_source_0 V1.pin1 0 DC 5
Vsimulation_voltage_source_1 N2 0 PULSE(0 10 0 1n 1n 0.00068 0.001)
.PRINT TRAN V(V1.pin1) V(R1.pin1)
.tran 0.001 0.1 0 0.005 UIC
.END`

      const { simulationResultCircuitJson: originalSimulationResult } =
        await spiceEngine.simulate(spiceString)

      const simulation_experiment_id = "test_experiment_id_tstep_1_tmax_5"

      const simulationResultCircuitJson = (
        originalSimulationResult as SimulationTransientVoltageGraph[]
      ).map((graph) => ({
        ...graph,
        simulation_experiment_id,
      }))

      const simulationExperiment: SimulationExperiment = {
        type: "simulation_experiment",
        simulation_experiment_id,
        name: "Timestep 0.001, tmax 0.005",
        experiment_type: "spice_transient_analysis",
      }

      const circuitJson = [simulationExperiment, ...simulationResultCircuitJson]

      const svg = convertCircuitJsonToSimulationGraphSvg({
        circuitJson: circuitJson,
        simulation_experiment_id,
      })

      expect(svg).toMatchSvgSnapshot(
        import.meta.path,
        "timestep-0.001-tmax-0.005",
      )
    },
    { timeout: 15_000 },
  )
})
