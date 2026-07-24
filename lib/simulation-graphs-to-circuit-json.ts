import type {
  SimulationAnalysisResult,
  SimulationTransientCurrentGraph,
  SimulationTransientVoltageGraph,
} from "circuit-json"
import { parseTranParams } from "./parse-tran-params"
import type { SimulationGraph } from "./simulation-graph-types"

interface SimulationTransientVoltageGraphWithProbeMetadata
  extends SimulationTransientVoltageGraph {
  source_probe_id?: string
  source_probe_name?: string
  source_node_name?: string
  reference_node_name?: string
}

interface SimulationTransientCurrentGraphWithProbeMetadata
  extends SimulationTransientCurrentGraph {
  source_probe_id?: string
  source_probe_name?: string
  source_trace_id?: string
}

const simulationExperimentId = "placeholder_simulation_experiment_id"

export const simulationGraphsToCircuitJson = (
  graphs: SimulationGraph[],
  spiceString: string,
): SimulationAnalysisResult[] => {
  const tranParams = parseTranParams(spiceString)

  return graphs.map<SimulationAnalysisResult>((graph, index) => {
    if (graph.analysisType === "transient") {
      if (graph.graphType === "voltage") {
        const graphIdSource =
          graph.probeMetadata?.simulation_voltage_probe_id ??
          `${index}_${graph.netName}`
        const graphElement: SimulationTransientVoltageGraphWithProbeMetadata = {
          type: "simulation_transient_voltage_graph",
          simulation_experiment_id: simulationExperimentId,
          simulation_transient_voltage_graph_id: `simulation_graph_${graphIdSource}`,
          name: graph.netName,
          voltage_levels: graph.voltage,
          timestamps_ms: graph.time.map((timePoint) => timePoint * 1000),
          start_time_ms: (tranParams?.tstart ?? 0) * 1000,
          time_per_step: (tranParams?.tstep ?? 0) * 1000,
          end_time_ms: (tranParams?.tstop ?? 0) * 1000,
          source_probe_id: graph.probeMetadata?.simulation_voltage_probe_id,
          source_probe_name: graph.probeMetadata?.name,
          source_node_name: graph.probeMetadata?.source_node_name,
          reference_node_name: graph.probeMetadata?.reference_node_name,
        }

        return graphElement
      }

      const graphIdSource =
        graph.probeMetadata?.simulation_current_probe_id ??
        `${index}_${graph.currentName}`
      const graphElement: SimulationTransientCurrentGraphWithProbeMetadata = {
        type: "simulation_transient_current_graph",
        simulation_experiment_id: simulationExperimentId,
        simulation_transient_current_graph_id: `simulation_graph_${graphIdSource}`,
        name: graph.currentName,
        current_levels: graph.current,
        timestamps_ms: graph.time.map((timePoint) => timePoint * 1000),
        start_time_ms: (tranParams?.tstart ?? 0) * 1000,
        time_per_step: (tranParams?.tstep ?? 0) * 1000,
        end_time_ms: (tranParams?.tstop ?? 0) * 1000,
        source_probe_id: graph.probeMetadata?.simulation_current_probe_id,
        source_probe_name: graph.probeMetadata?.name,
        source_component_id: graph.probeMetadata?.source_component_id,
        source_trace_id: graph.probeMetadata?.source_trace_id,
      }

      return graphElement
    }

    if (graph.analysisType === "dc_operating_point") {
      if (graph.graphType === "voltage") {
        const probeId =
          graph.probeMetadata?.simulation_voltage_probe_id ??
          `simulation_voltage_probe_${index}_${graph.netName}`
        return {
          type: "simulation_dc_operating_point_voltage",
          simulation_dc_operating_point_voltage_id: `simulation_dc_operating_point_voltage_${probeId}`,
          simulation_experiment_id: simulationExperimentId,
          simulation_voltage_probe_id: probeId,
          voltage: graph.voltage,
          name: graph.netName,
        }
      }

      const probeId =
        graph.probeMetadata?.simulation_current_probe_id ??
        `simulation_current_probe_${index}_${graph.currentName}`
      return {
        type: "simulation_dc_operating_point_current",
        simulation_dc_operating_point_current_id: `simulation_dc_operating_point_current_${probeId}`,
        simulation_experiment_id: simulationExperimentId,
        simulation_current_probe_id: probeId,
        current: graph.current,
        name: graph.currentName,
      }
    }

    if (graph.analysisType === "dc_sweep") {
      if (graph.graphType === "voltage") {
        const probeId =
          graph.probeMetadata?.simulation_voltage_probe_id ??
          `simulation_voltage_probe_${index}_${graph.netName}`
        return {
          type: "simulation_dc_sweep_voltage_graph",
          simulation_dc_sweep_voltage_graph_id: `simulation_dc_sweep_voltage_graph_${probeId}`,
          simulation_experiment_id: simulationExperimentId,
          simulation_voltage_probe_id: probeId,
          sweep_values: graph.sweepValues,
          sweep_unit: graph.sweepUnit,
          voltage_levels: graph.voltage,
          name: graph.netName,
        }
      }

      const probeId =
        graph.probeMetadata?.simulation_current_probe_id ??
        `simulation_current_probe_${index}_${graph.currentName}`
      return {
        type: "simulation_dc_sweep_current_graph",
        simulation_dc_sweep_current_graph_id: `simulation_dc_sweep_current_graph_${probeId}`,
        simulation_experiment_id: simulationExperimentId,
        simulation_current_probe_id: probeId,
        sweep_values: graph.sweepValues,
        sweep_unit: graph.sweepUnit,
        current_levels: graph.current,
        name: graph.currentName,
      }
    }

    if (graph.graphType === "voltage") {
      const probeId =
        graph.probeMetadata?.simulation_voltage_probe_id ??
        `simulation_voltage_probe_${index}_${graph.netName}`
      return {
        type: "simulation_ac_sweep_voltage_graph",
        simulation_ac_sweep_voltage_graph_id: `simulation_ac_sweep_voltage_graph_${probeId}`,
        simulation_experiment_id: simulationExperimentId,
        simulation_voltage_probe_id: probeId,
        frequencies_hz: graph.frequenciesHz,
        complex_voltages: graph.complexVoltages,
        name: graph.netName,
      }
    }

    const probeId =
      graph.probeMetadata?.simulation_current_probe_id ??
      `simulation_current_probe_${index}_${graph.currentName}`
    return {
      type: "simulation_ac_sweep_current_graph",
      simulation_ac_sweep_current_graph_id: `simulation_ac_sweep_current_graph_${probeId}`,
      simulation_experiment_id: simulationExperimentId,
      simulation_current_probe_id: probeId,
      frequencies_hz: graph.frequenciesHz,
      complex_currents: graph.complexCurrents,
      name: graph.currentName,
    }
  })
}
