import type {
  CurrentGraph,
  CurrentProbeMetadata,
  VoltageGraph,
  VoltageProbeMetadata,
} from "./simulation-graph-types"

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

export const createVoltageGraphFromRequestedPlot = ({
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
  const voltageGraph: VoltageGraph = {
    graphType: "voltage",
    netName: metadata?.name ?? getNetName(originalToken),
    time: timeValues,
    voltage,
    probeMetadata: metadata,
  }

  return voltageGraph
}

export const createCurrentGraphFromRequestedPlot = ({
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
  const currentGraph: CurrentGraph = {
    graphType: "current",
    currentName: metadata?.name ?? getCurrentName(originalToken),
    time: timeValues,
    current,
    probeMetadata: metadata,
  }

  return currentGraph
}

export { getCurrentName, getNetName }
