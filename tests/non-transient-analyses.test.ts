import { describe, expect, test } from "bun:test"
import type { AnyCircuitElement, SimulationExperiment } from "circuit-json"
import {
  type AcSweepView,
  convertCircuitJsonToSimulationGraphSvg,
} from "circuit-to-svg"
import {
  eecircuitResultToSimulationGraphs,
  simulationGraphsToCircuitJson,
} from "../lib"
import type { ResultType } from "../lib/eecircuit-engine-types"

const renderAnalysisGraphSvg = ({
  simulationResultCircuitJson,
  simulationExperiment,
  acSweepView = "magnitude",
}: {
  simulationResultCircuitJson: AnyCircuitElement[]
  simulationExperiment: SimulationExperiment
  acSweepView?: AcSweepView
}) =>
  convertCircuitJsonToSimulationGraphSvg({
    circuitJson: [simulationExperiment, ...simulationResultCircuitJson],
    simulation_experiment_id: simulationExperiment.simulation_experiment_id,
    ac_sweep_view: acSweepView,
  })

describe("non-transient simulation analyses", () => {
  test("converts DC operating point voltage and current results", () => {
    const result: ResultType = {
      header: "Operating Point",
      numVariables: 2,
      variableNames: ["v(out)", "i(v1)"],
      numPoints: 1,
      dataType: "real",
      data: [
        { name: "v(out)", type: "voltage", values: [2.5] },
        { name: "i(v1)", type: "current", values: [-0.0025] },
      ],
    }
    const spiceString = `
* tscircuit_probe {"simulation_voltage_probe_id":"simulation_voltage_probe_0","name":"VOUT","spice_vector":"V(out)","source_node_name":"out"}
* tscircuit_current_probe {"simulation_current_probe_id":"simulation_current_probe_0","name":"IV1","spice_vector":"I(V1)"}
.PRINT OP V(out) I(V1)
.op
`

    const circuitJson = simulationGraphsToCircuitJson(
      eecircuitResultToSimulationGraphs(result, spiceString),
      spiceString,
    )

    expect(circuitJson).toEqual([
      {
        type: "simulation_dc_operating_point_voltage",
        simulation_dc_operating_point_voltage_id:
          "simulation_dc_operating_point_voltage_simulation_voltage_probe_0",
        simulation_experiment_id: "placeholder_simulation_experiment_id",
        simulation_voltage_probe_id: "simulation_voltage_probe_0",
        voltage: 2.5,
        name: "VOUT",
      },
      {
        type: "simulation_dc_operating_point_current",
        simulation_dc_operating_point_current_id:
          "simulation_dc_operating_point_current_simulation_current_probe_0",
        simulation_experiment_id: "placeholder_simulation_experiment_id",
        simulation_current_probe_id: "simulation_current_probe_0",
        current: -0.0025,
        name: "IV1",
      },
    ])

    const svg = renderAnalysisGraphSvg({
      simulationResultCircuitJson: circuitJson,
      simulationExperiment: {
        type: "simulation_experiment",
        simulation_experiment_id: "placeholder_simulation_experiment_id",
        name: "Ngspice DC Operating Point",
        experiment_type: "spice_dc_operating_point",
      },
    })
    expect(svg).toMatchSvgSnapshot(
      import.meta.path,
      "ngspice-dc-operating-point-voltage-and-current",
    )
  })

  test("converts a current-source DC sweep with its ampere axis", () => {
    const result: ResultType = {
      header: "DC transfer characteristic",
      numVariables: 3,
      variableNames: ["i(i-sweep)", "v(out)", "i(vsense)"],
      numPoints: 3,
      dataType: "real",
      data: [
        { name: "i(i-sweep)", type: "current", values: [0, 0.001, 0.002] },
        { name: "v(out)", type: "voltage", values: [0, 1, 2] },
        {
          name: "i(vsense)",
          type: "current",
          values: [0, -0.001, -0.002],
        },
      ],
    }
    const spiceString = `
.PRINT DC V(out) I(Vsense)
.dc Isource 0 0.002 0.001
`

    const circuitJson = simulationGraphsToCircuitJson(
      eecircuitResultToSimulationGraphs(result, spiceString),
      spiceString,
    )

    expect(circuitJson).toMatchObject([
      {
        type: "simulation_dc_sweep_voltage_graph",
        sweep_values: [0, 0.001, 0.002],
        sweep_unit: "A",
        voltage_levels: [0, 1, 2],
      },
      {
        type: "simulation_dc_sweep_current_graph",
        sweep_values: [0, 0.001, 0.002],
        sweep_unit: "A",
        current_levels: [0, -0.001, -0.002],
      },
    ])

    const svg = renderAnalysisGraphSvg({
      simulationResultCircuitJson: circuitJson,
      simulationExperiment: {
        type: "simulation_experiment",
        simulation_experiment_id: "placeholder_simulation_experiment_id",
        name: "Ngspice Current Source DC Sweep",
        experiment_type: "spice_dc_sweep",
        dc_sweep_current_source_id: "source_component_isource",
        dc_sweep_start: 0,
        dc_sweep_stop: 0.002,
        dc_sweep_step: 0.001,
        dc_sweep_unit: "A",
      },
    })
    expect(svg).toMatchSvgSnapshot(
      import.meta.path,
      "ngspice-dc-sweep-voltage-and-current",
    )
  })

  test("converts AC complex values and differential voltages", () => {
    const result: ResultType = {
      header: "AC Analysis",
      numVariables: 4,
      variableNames: ["frequency", "v(out)", "v(ref)", "i(v1)"],
      numPoints: 2,
      dataType: "complex",
      data: [
        {
          name: "frequency",
          type: "frequency",
          values: [
            { real: 10, img: 0 },
            { real: 100, img: 0 },
          ],
        },
        {
          name: "v(out)",
          type: "voltage",
          values: [
            { real: 2, img: 1 },
            { real: 1, img: -1 },
          ],
        },
        {
          name: "v(ref)",
          type: "voltage",
          values: [
            { real: 0.5, img: 0.25 },
            { real: 0.25, img: -0.5 },
          ],
        },
        {
          name: "i(v1)",
          type: "current",
          values: [
            { real: -0.001, img: 0.002 },
            { real: -0.003, img: 0.004 },
          ],
        },
      ],
    }
    const spiceString = `
.PRINT AC V(out,ref) I(V1)
.ac dec 10 10 100
`

    const circuitJson = simulationGraphsToCircuitJson(
      eecircuitResultToSimulationGraphs(result, spiceString),
      spiceString,
    )

    expect(circuitJson).toMatchObject([
      {
        type: "simulation_ac_sweep_voltage_graph",
        frequencies_hz: [10, 100],
        complex_voltages: [
          { re: 1.5, im: 0.75 },
          { re: 0.75, im: -0.5 },
        ],
      },
      {
        type: "simulation_ac_sweep_current_graph",
        frequencies_hz: [10, 100],
        complex_currents: [
          { re: -0.001, im: 0.002 },
          { re: -0.003, im: 0.004 },
        ],
      },
    ])

    const simulationExperiment: SimulationExperiment = {
      type: "simulation_experiment",
      simulation_experiment_id: "placeholder_simulation_experiment_id",
      name: "Ngspice AC Sweep",
      experiment_type: "spice_ac_analysis",
      ac_sweep_type: "decade",
      ac_samples_per_interval: 10,
      ac_start_frequency_hz: 10,
      ac_stop_frequency_hz: 100,
    }
    const magnitudeSvg = renderAnalysisGraphSvg({
      simulationResultCircuitJson: circuitJson,
      simulationExperiment,
    })
    const phaseSvg = renderAnalysisGraphSvg({
      simulationResultCircuitJson: circuitJson,
      simulationExperiment,
      acSweepView: "phase",
    })
    expect(magnitudeSvg).toMatchSvgSnapshot(
      import.meta.path,
      "ngspice-ac-sweep-voltage-and-current-magnitude",
    )
    expect(phaseSvg).toMatchSvgSnapshot(
      import.meta.path,
      "ngspice-ac-sweep-voltage-and-current-phase",
    )
  })
})
