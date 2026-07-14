import type { CircuitJson } from "circuit-json"
import { getCurrentName, getNetName } from "./create-graph-from-requested-plot"
import type { ResultType } from "./eecircuit-engine-types"
import {
  extractCurrentProbeMetadata,
  extractVoltageProbeMetadata,
  normalizeSpiceVector,
} from "./extract-probe-metadata"
import { extractRequestedPlots } from "./extract-requested-plots"

const sanitizeIdPart = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_")

const getLastFiniteValue = (values: number[]): number | undefined => {
  for (let index = values.length - 1; index >= 0; index--) {
    const value = values[index]
    if (value !== undefined && Number.isFinite(value)) return value
  }
}

export const isOperatingPointAnalysis = (spiceString: string): boolean =>
  /^\s*\.op(?:\s|$)/im.test(spiceString)

export const eecircuitResultToOperatingPointCircuitJson = (
  result: ResultType,
  spiceString: string,
): CircuitJson => {
  if (!result?.data || result.dataType !== "real") return []

  const voltageDataMap = new Map<string, number[]>()
  const currentDataMap = new Map<string, number[]>()
  for (const item of result.data) {
    if (!Array.isArray(item.values)) continue
    const normalizedName = normalizeSpiceVector(item.name)
    if (item.type === "voltage") {
      voltageDataMap.set(normalizedName, item.values)
    } else if (item.type === "current") {
      currentDataMap.set(normalizedName, item.values)
      const branchMatch = normalizedName.match(/^(.+)#branch$/)
      if (branchMatch?.[1]) {
        currentDataMap.set(`i(${branchMatch[1]})`, item.values)
      }
    }
  }

  const requestedPlots = extractRequestedPlots(spiceString, "op")
  if (!requestedPlots) return []

  const voltageProbeMetadata = extractVoltageProbeMetadata(spiceString)
  const currentProbeMetadata = extractCurrentProbeMetadata(spiceString)
  const elements: Array<Record<string, unknown>> = []

  for (const [normalizedVector, originalVector] of requestedPlots) {
    if (normalizedVector.startsWith("v(")) {
      let values = voltageDataMap.get(normalizedVector)
      const differentialMatch = originalVector.match(
        /^v\(([^,]+),\s*([^)]+)\)$/i,
      )
      if (!values && differentialMatch?.[1] && differentialMatch[2]) {
        const positive = voltageDataMap.get(
          `v(${differentialMatch[1].trim().toLowerCase()})`,
        )
        const negative = voltageDataMap.get(
          `v(${differentialMatch[2].trim().toLowerCase()})`,
        )
        if (positive && negative) {
          values = positive.map(
            (value, index) => value - (negative[index] ?? 0),
          )
        }
      }

      const voltage = values ? getLastFiniteValue(values) : undefined
      if (voltage === undefined) continue
      const metadata = voltageProbeMetadata.get(normalizedVector)
      const idSource =
        metadata?.simulation_voltage_probe_id ?? sanitizeIdPart(originalVector)
      elements.push({
        type: "simulation_operating_point_voltage",
        simulation_operating_point_voltage_id: `simulation_operating_point_voltage_${idSource}`,
        simulation_experiment_id: "placeholder_simulation_experiment_id",
        simulation_voltage_probe_id: metadata?.simulation_voltage_probe_id,
        voltage,
        name: metadata?.name ?? getNetName(originalVector),
        source_node_name: metadata?.source_node_name,
        reference_node_name: metadata?.reference_node_name,
      })
      continue
    }

    if (normalizedVector.startsWith("i(")) {
      const values = currentDataMap.get(normalizedVector)
      const current = values ? getLastFiniteValue(values) : undefined
      if (current === undefined) continue
      const metadata = currentProbeMetadata.get(normalizedVector)
      const idSource =
        metadata?.simulation_current_probe_id ?? sanitizeIdPart(originalVector)
      elements.push({
        type: "simulation_operating_point_current",
        simulation_operating_point_current_id: `simulation_operating_point_current_${idSource}`,
        simulation_experiment_id: "placeholder_simulation_experiment_id",
        simulation_current_probe_id: metadata?.simulation_current_probe_id,
        current,
        name: metadata?.name ?? getCurrentName(originalVector),
        source_component_id: metadata?.source_component_id,
        source_trace_id: metadata?.source_trace_id,
      })
    }
  }

  return elements as CircuitJson
}
