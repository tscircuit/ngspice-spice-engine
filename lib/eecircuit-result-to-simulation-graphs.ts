import type { ResultType } from "@tscircuit/eecircuit-engine"
import { linearInterpolate } from "./linear-interpolate"
import { parseTranParams } from "./parse-tran-params"

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

interface VoltageProbeMetadata {
  simulation_voltage_probe_id: string
  name?: string
  spice_vector: string
  source_node_name: string
  reference_node_name?: string
}

interface CurrentProbeMetadata {
  simulation_current_probe_id: string
  name?: string
  spice_vector: string
  source_component_id?: string
  source_trace_id?: string
}

const extractRequestedPlots = (
  spiceString: string,
): Map<string, string> | null => {
  const match = spiceString.match(/\.print\s+tran\s+(.*)/i)
  if (!match?.[1]) {
    return null
  }

  const tokens = match[1].match(/[VI]\s*\([^)]+\)/gi)

  if (!tokens) {
    return null
  }

  const plotMap = new Map<string, string>()
  for (const token of tokens) {
    const lowerCaseToken = token.toLowerCase().replace(/\s/g, "")
    if (!plotMap.has(lowerCaseToken)) {
      plotMap.set(lowerCaseToken, token)
    }
  }

  return plotMap
}

const normalizeSpiceVector = (value: string): string =>
  value.toLowerCase().replace(/\s/g, "")

const extractVoltageProbeMetadata = (
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

      metadata.set(normalizeSpiceVector(parsed.spice_vector), {
        simulation_voltage_probe_id: parsed.simulation_voltage_probe_id,
        name: typeof parsed.name === "string" ? parsed.name : undefined,
        spice_vector: parsed.spice_vector,
        source_node_name: parsed.source_node_name,
        reference_node_name:
          typeof parsed.reference_node_name === "string"
            ? parsed.reference_node_name
            : undefined,
      })
    } catch {}
  }

  return metadata
}

const extractCurrentProbeMetadata = (
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

      metadata.set(normalizeSpiceVector(parsed.spice_vector), {
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
      })
    } catch {}
  }

  return metadata
}

const getNetName = (rawName: string): string => {
  const diffMatch = rawName.match(/^v\(([^,]+),\s*([^)]+)\)$/i)
  if (diffMatch?.[1] && diffMatch?.[2]) {
    return `${diffMatch[1].trim()}-${diffMatch[2].trim()}`
  }

  const match = rawName.match(/^v\((.*)\)$/i)
  if (!match) {
    return rawName
  }
  return match[1] ?? rawName
}

const getCurrentName = (rawName: string): string => {
  const match = rawName.match(/^i\((.*)\)$/i)
  if (!match) {
    return rawName
  }
  return match[1] ?? rawName
}

const createVoltageGraphFromRequestedPlot = ({
  lowerCaseToken,
  originalToken,
  timeValues,
  voltageDataMap,
  voltageProbeMetadata,
}: {
  lowerCaseToken: string
  originalToken: string
  timeValues: number[]
  voltageDataMap: Map<string, number[]>
  voltageProbeMetadata: Map<string, VoltageProbeMetadata>
}): VoltageGraph | null => {
  if (!lowerCaseToken.startsWith("v(")) return null

  const diffMatch = originalToken.match(/^v\(([^,]+),\s*([^)]+)\)$/i)
  let voltage: number[] | undefined

  if (diffMatch?.[1] && diffMatch?.[2]) {
    voltage = voltageDataMap.get(lowerCaseToken)

    if (!voltage) {
      const node1 = diffMatch[1].trim()
      const node2 = diffMatch[2].trim()
      const node1Data = voltageDataMap.get(`v(${node1.toLowerCase()})`)
      const node2Data = voltageDataMap.get(`v(${node2.toLowerCase()})`)

      if (node1Data && node2Data) {
        voltage = node1Data.map((v, i) => v - (node2Data[i] ?? 0))
      }
    }
  } else {
    voltage = voltageDataMap.get(lowerCaseToken)
  }

  if (!voltage) return null

  const metadata = voltageProbeMetadata.get(lowerCaseToken)
  return {
    graphType: "voltage",
    netName: metadata?.name ?? getNetName(originalToken),
    time: timeValues,
    voltage,
    probeMetadata: metadata,
  }
}

const createCurrentGraphFromRequestedPlot = ({
  lowerCaseToken,
  originalToken,
  timeValues,
  currentDataMap,
  currentProbeMetadata,
}: {
  lowerCaseToken: string
  originalToken: string
  timeValues: number[]
  currentDataMap: Map<string, number[]>
  currentProbeMetadata: Map<string, CurrentProbeMetadata>
}): CurrentGraph | null => {
  if (!lowerCaseToken.startsWith("i(")) return null

  const current = currentDataMap.get(lowerCaseToken)
  if (!current) return null

  const metadata = currentProbeMetadata.get(lowerCaseToken)
  return {
    graphType: "current",
    currentName: metadata?.name ?? getCurrentName(originalToken),
    time: timeValues,
    current,
    probeMetadata: metadata,
  }
}

export const eecircuitResultToSimulationGraphs = (
  result: ResultType,
  spiceString: string,
): SimulationGraph[] => {
  if (!result?.data || result.dataType !== "real") {
    return []
  }

  const timeData = result.data.find((item) => item.type === "time")
  if (!timeData || !Array.isArray(timeData.values)) {
    return []
  }
  const timeValues = timeData.values as number[]

  const voltageDataItems = result.data.filter(
    (item) => item.type === "voltage" && Array.isArray(item.values),
  )

  const voltageDataMap = new Map<string, number[]>()
  for (const item of voltageDataItems) {
    voltageDataMap.set(item.name.toLowerCase(), item.values as number[])
  }

  const currentDataItems = result.data.filter(
    (item) => item.type === "current" && Array.isArray(item.values),
  )

  const currentDataMap = new Map<string, number[]>()
  for (const item of currentDataItems) {
    currentDataMap.set(normalizeSpiceVector(item.name), item.values as number[])
  }

  const requestedPlots = extractRequestedPlots(spiceString)
  const voltageProbeMetadata = extractVoltageProbeMetadata(spiceString)
  const currentProbeMetadata = extractCurrentProbeMetadata(spiceString)

  if (!requestedPlots) {
    return [
      ...voltageDataItems.map((item) => {
        const metadata = voltageProbeMetadata.get(
          normalizeSpiceVector(item.name),
        )
        return {
          graphType: "voltage" as const,
          netName: metadata?.name ?? getNetName(item.name),
          time: timeValues,
          voltage: item.values as number[],
          probeMetadata: metadata,
        }
      }),
      ...currentDataItems.map((item) => {
        const metadata = currentProbeMetadata.get(
          normalizeSpiceVector(item.name),
        )
        return {
          graphType: "current" as const,
          currentName: metadata?.name ?? getCurrentName(item.name),
          time: timeValues,
          current: item.values as number[],
          probeMetadata: metadata,
        }
      }),
    ]
  }

  const graphs: SimulationGraph[] = []
  for (const [lowerCaseToken, originalToken] of requestedPlots.entries()) {
    const graph =
      createVoltageGraphFromRequestedPlot({
        lowerCaseToken,
        originalToken,
        timeValues,
        voltageDataMap,
        voltageProbeMetadata,
      }) ??
      createCurrentGraphFromRequestedPlot({
        lowerCaseToken,
        originalToken,
        timeValues,
        currentDataMap,
        currentProbeMetadata,
      })

    if (graph) graphs.push(graph)
  }

  const tranParams = parseTranParams(spiceString)
  if (
    tranParams?.tstep &&
    tranParams.tstep > 0 &&
    tranParams.tstop &&
    graphs.length > 0
  ) {
    const { tstep, tstop } = tranParams
    const tstart = tranParams.tstart ?? 0
    const numSteps = Math.floor((tstop - tstart) / tstep)

    if (numSteps > 0) {
      const newTimeValues = Array.from(
        { length: numSteps + 1 },
        (_, i) => tstart + i * tstep,
      )
      const oldTimeValues = graphs[0]!.time
      return graphs.map((graph) => {
        if (graph.graphType === "voltage") {
          return {
            ...graph,
            time: newTimeValues,
            voltage: newTimeValues.map((t) =>
              linearInterpolate(t, oldTimeValues, graph.voltage),
            ),
          }
        }

        return {
          ...graph,
          time: newTimeValues,
          current: newTimeValues.map((t) =>
            linearInterpolate(t, oldTimeValues, graph.current),
          ),
        }
      })
    }
  }

  return graphs
}

export const eecircuitResultToVGraphs = (
  result: ResultType,
  spiceString: string,
): VoltageGraph[] => {
  return eecircuitResultToSimulationGraphs(result, spiceString).filter(
    (graph): graph is VoltageGraph => graph.graphType === "voltage",
  )
}
