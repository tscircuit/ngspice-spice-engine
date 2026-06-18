import type {
  SimulationTransientCurrentGraph,
  SimulationTransientVoltageGraph,
} from "circuit-json"
import { parseTranParams } from "./parse-tran-params"
import type { SimulationGraph } from "./simulation-graph-types"

export const simulationGraphsToCircuitJson = (
  graphs: SimulationGraph[],
  spiceString: string,
): Array<SimulationTransientVoltageGraph | SimulationTransientCurrentGraph> => {
  const tranParams = parseTranParams(spiceString)

  return graphs.map((graph, index) => {
    if (graph.graphType === "voltage") {
      const graphIdSource =
        graph.probeMetadata?.simulation_voltage_probe_id ??
        `${index}_${graph.netName}`
      const graphElement = {
        type: "simulation_transient_voltage_graph",
        simulation_experiment_id: "placeholder_simulation_experiment_id",
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

      return graphElement as SimulationTransientVoltageGraph
    }

    const graphIdSource =
      graph.probeMetadata?.simulation_current_probe_id ??
      `${index}_${graph.currentName}`
    const graphElement = {
      type: "simulation_transient_current_graph",
      simulation_experiment_id: "placeholder_simulation_experiment_id",
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

    return graphElement as SimulationTransientCurrentGraph
  })
}
