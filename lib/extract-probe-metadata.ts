import type { NormalizedSpiceVector } from "./extract-requested-plots"
import type {
  CurrentProbeMetadata,
  VoltageProbeMetadata,
} from "./simulation-graph-types"

export type VoltageProbeMetadataBySpiceVector = Map<
  NormalizedSpiceVector,
  VoltageProbeMetadata
>
export type CurrentProbeMetadataBySpiceVector = Map<
  NormalizedSpiceVector,
  CurrentProbeMetadata
>

export const normalizeSpiceVector = (
  spiceVector: string,
): NormalizedSpiceVector => spiceVector.toLowerCase().replace(/\s/g, "")

export const extractVoltageProbeMetadata = (
  spiceString: string,
): VoltageProbeMetadataBySpiceVector => {
  const voltageProbeMetadataBySpiceVector: VoltageProbeMetadataBySpiceVector =
    new Map()

  for (const line of spiceString.split(/\r?\n/)) {
    const match = line.match(/^\s*\*\s*tscircuit_probe\s+(.+)\s*$/)
    if (!match?.[1]) continue

    try {
      const parsedProbeMetadata: unknown = JSON.parse(match[1])
      if (
        typeof parsedProbeMetadata !== "object" ||
        parsedProbeMetadata === null ||
        !("simulation_voltage_probe_id" in parsedProbeMetadata) ||
        typeof parsedProbeMetadata.simulation_voltage_probe_id !== "string" ||
        !("spice_vector" in parsedProbeMetadata) ||
        typeof parsedProbeMetadata.spice_vector !== "string" ||
        !("source_node_name" in parsedProbeMetadata) ||
        typeof parsedProbeMetadata.source_node_name !== "string"
      ) {
        continue
      }

      const normalizedSpiceVector = normalizeSpiceVector(
        parsedProbeMetadata.spice_vector,
      )
      const voltageProbeMetadata: VoltageProbeMetadata = {
        simulation_voltage_probe_id:
          parsedProbeMetadata.simulation_voltage_probe_id,
        name:
          "name" in parsedProbeMetadata &&
          typeof parsedProbeMetadata.name === "string"
            ? parsedProbeMetadata.name
            : undefined,
        spice_vector: parsedProbeMetadata.spice_vector,
        source_node_name: parsedProbeMetadata.source_node_name,
        reference_node_name:
          "reference_node_name" in parsedProbeMetadata &&
          typeof parsedProbeMetadata.reference_node_name === "string"
            ? parsedProbeMetadata.reference_node_name
            : undefined,
      }

      voltageProbeMetadataBySpiceVector.set(
        normalizedSpiceVector,
        voltageProbeMetadata,
      )
    } catch {}
  }

  return voltageProbeMetadataBySpiceVector
}

export const extractCurrentProbeMetadata = (
  spiceString: string,
): CurrentProbeMetadataBySpiceVector => {
  const currentProbeMetadataBySpiceVector: CurrentProbeMetadataBySpiceVector =
    new Map()

  for (const line of spiceString.split(/\r?\n/)) {
    const match = line.match(/^\s*\*\s*tscircuit_current_probe\s+(.+)\s*$/)
    if (!match?.[1]) continue

    try {
      const parsedProbeMetadata: unknown = JSON.parse(match[1])
      if (
        typeof parsedProbeMetadata !== "object" ||
        parsedProbeMetadata === null ||
        !("simulation_current_probe_id" in parsedProbeMetadata) ||
        typeof parsedProbeMetadata.simulation_current_probe_id !== "string" ||
        !("spice_vector" in parsedProbeMetadata) ||
        typeof parsedProbeMetadata.spice_vector !== "string"
      ) {
        continue
      }

      const normalizedSpiceVector = normalizeSpiceVector(
        parsedProbeMetadata.spice_vector,
      )
      const currentProbeMetadata: CurrentProbeMetadata = {
        simulation_current_probe_id:
          parsedProbeMetadata.simulation_current_probe_id,
        name:
          "name" in parsedProbeMetadata &&
          typeof parsedProbeMetadata.name === "string"
            ? parsedProbeMetadata.name
            : undefined,
        spice_vector: parsedProbeMetadata.spice_vector,
        source_component_id:
          "source_component_id" in parsedProbeMetadata &&
          typeof parsedProbeMetadata.source_component_id === "string"
            ? parsedProbeMetadata.source_component_id
            : undefined,
        source_trace_id:
          "source_trace_id" in parsedProbeMetadata &&
          typeof parsedProbeMetadata.source_trace_id === "string"
            ? parsedProbeMetadata.source_trace_id
            : undefined,
      }

      currentProbeMetadataBySpiceVector.set(
        normalizedSpiceVector,
        currentProbeMetadata,
      )
    } catch {}
  }

  return currentProbeMetadataBySpiceVector
}
