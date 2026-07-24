import type { SimulationAcSweepVoltageGraph } from "circuit-json"

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
  analysisType: "transient"
  netName: string
  time: number[]
  voltage: number[]
  probeMetadata?: VoltageProbeMetadata
}

export interface CurrentGraph {
  graphType: "current"
  analysisType: "transient"
  currentName: string
  time: number[]
  current: number[]
  probeMetadata?: CurrentProbeMetadata
}

export interface DcOperatingPointVoltageResult {
  graphType: "voltage"
  analysisType: "dc_operating_point"
  netName: string
  voltage: number
  probeMetadata?: VoltageProbeMetadata
}

export interface DcOperatingPointCurrentResult {
  graphType: "current"
  analysisType: "dc_operating_point"
  currentName: string
  current: number
  probeMetadata?: CurrentProbeMetadata
}

export interface DcSweepVoltageGraph {
  graphType: "voltage"
  analysisType: "dc_sweep"
  netName: string
  sweepValues: number[]
  sweepUnit: "V" | "A"
  voltage: number[]
  probeMetadata?: VoltageProbeMetadata
}

export interface DcSweepCurrentGraph {
  graphType: "current"
  analysisType: "dc_sweep"
  currentName: string
  sweepValues: number[]
  sweepUnit: "V" | "A"
  current: number[]
  probeMetadata?: CurrentProbeMetadata
}

export type ComplexSample =
  SimulationAcSweepVoltageGraph["complex_voltages"][number]

export interface AcSweepVoltageGraph {
  graphType: "voltage"
  analysisType: "ac_sweep"
  netName: string
  frequenciesHz: number[]
  complexVoltages: ComplexSample[]
  probeMetadata?: VoltageProbeMetadata
}

export interface AcSweepCurrentGraph {
  graphType: "current"
  analysisType: "ac_sweep"
  currentName: string
  frequenciesHz: number[]
  complexCurrents: ComplexSample[]
  probeMetadata?: CurrentProbeMetadata
}

export type SimulationGraph =
  | VoltageGraph
  | CurrentGraph
  | DcOperatingPointVoltageResult
  | DcOperatingPointCurrentResult
  | DcSweepVoltageGraph
  | DcSweepCurrentGraph
  | AcSweepVoltageGraph
  | AcSweepCurrentGraph
