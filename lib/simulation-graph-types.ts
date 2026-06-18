export interface VoltageProbeMetadata {
  simulation_voltage_probe_id: string
  name?: string
  spice_vector: string
  source_node_name: string
  reference_node_name?: string
}

export interface CurrentProbeMetadata {
  simulation_current_probe_id: string
  name?: string
  spice_vector: string
  source_component_id?: string
  source_trace_id?: string
}

export interface VoltageGraph {
  graphType: "voltage"
  netName: string
  time: number[]
  voltage: number[]
  probeMetadata?: VoltageProbeMetadata
}

export interface CurrentGraph {
  graphType: "current"
  currentName: string
  time: number[]
  current: number[]
  probeMetadata?: CurrentProbeMetadata
}

export type SimulationGraph = VoltageGraph | CurrentGraph
