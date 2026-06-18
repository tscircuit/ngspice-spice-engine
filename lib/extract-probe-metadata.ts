import type {
  CurrentProbeMetadata,
  VoltageProbeMetadata,
} from "./simulation-graph-types"

export const normalizeSpiceVector = (value: string): string =>
  value.toLowerCase().replace(/\s/g, "")

export const extractVoltageProbeMetadata = (
  spiceString: string,
): Map<string, VoltageProbeMetadata> => {
  const metadata = new Map<string, VoltageProbeMetadata>()

  for (const line of spiceString.split(/\r?\n/)) {
    const match = line.match(/^\s*\*\s*tscircuit_probe\s+(.+)\s*$/)
    if (!match?.[1]) continue

    try {
      const parsed = JSON.parse(match[1]) as Partial<VoltageProbeMetadata>
      if (
        typeof parsed.simulation_voltage_probe_id !== "string" ||
        typeof parsed.spice_vector !== "string" ||
        typeof parsed.source_node_name !== "string"
      ) {
        continue
      }

      const normalizedSpiceVector = normalizeSpiceVector(parsed.spice_vector)
      const voltageProbeMetadata: VoltageProbeMetadata = {
        simulation_voltage_probe_id: parsed.simulation_voltage_probe_id,
        name: typeof parsed.name === "string" ? parsed.name : undefined,
        spice_vector: parsed.spice_vector,
        source_node_name: parsed.source_node_name,
        reference_node_name:
          typeof parsed.reference_node_name === "string"
            ? parsed.reference_node_name
            : undefined,
      }

      metadata.set(normalizedSpiceVector, voltageProbeMetadata)
    } catch {}
  }

  return metadata
}

export const extractCurrentProbeMetadata = (
  spiceString: string,
): Map<string, CurrentProbeMetadata> => {
  const metadata = new Map<string, CurrentProbeMetadata>()

  for (const line of spiceString.split(/\r?\n/)) {
    const match = line.match(/^\s*\*\s*tscircuit_current_probe\s+(.+)\s*$/)
    if (!match?.[1]) continue

    try {
      const parsed = JSON.parse(match[1]) as Partial<CurrentProbeMetadata>
      if (
        typeof parsed.simulation_current_probe_id !== "string" ||
        typeof parsed.spice_vector !== "string"
      ) {
        continue
      }

      const normalizedSpiceVector = normalizeSpiceVector(parsed.spice_vector)
      const currentProbeMetadata: CurrentProbeMetadata = {
        simulation_current_probe_id: parsed.simulation_current_probe_id,
        name: typeof parsed.name === "string" ? parsed.name : undefined,
        spice_vector: parsed.spice_vector,
        source_component_id:
          typeof parsed.source_component_id === "string"
            ? parsed.source_component_id
            : undefined,
        source_trace_id:
          typeof parsed.source_trace_id === "string"
            ? parsed.source_trace_id
            : undefined,
      }

      metadata.set(normalizedSpiceVector, currentProbeMetadata)
    } catch {}
  }

  return metadata
}
