import type {
  CurrentProbeMetadataBySpiceVector,
  VoltageProbeMetadataBySpiceVector,
} from "./extract-probe-metadata"
import type {
  NormalizedSpiceVector,
  SpiceVector,
} from "./extract-requested-plots"
import type { CurrentGraph, VoltageGraph } from "./simulation-graph-types"
import type { RealSamplesBySpiceVector } from "./simulation-output-maps"

const getNetName = (spiceVector: SpiceVector): string => {
  const differentialVoltageMatch = spiceVector.match(
    /^v\(([^,]+),\s*([^)]+)\)$/i,
  )
  if (differentialVoltageMatch?.[1] && differentialVoltageMatch?.[2]) {
    return `${differentialVoltageMatch[1].trim()}-${differentialVoltageMatch[2].trim()}`
  }

  const match = spiceVector.match(/^v\((.*)\)$/i)
  if (!match) {
    return spiceVector
  }
  return match[1] ?? spiceVector
}

const getCurrentName = (spiceVector: SpiceVector): string => {
  const match = spiceVector.match(/^i\((.*)\)$/i)
  if (!match) {
    return spiceVector
  }
  return match[1] ?? spiceVector
}

export const createVoltageGraphFromRequestedPlot = ({
  normalizedSpiceVector,
  originalSpiceVector,
  timeSeconds,
  voltageSamplesBySpiceVector,
  voltageProbeMetadataBySpiceVector,
}: {
  normalizedSpiceVector: NormalizedSpiceVector
  originalSpiceVector: SpiceVector
  timeSeconds: number[]
  voltageSamplesBySpiceVector: RealSamplesBySpiceVector
  voltageProbeMetadataBySpiceVector: VoltageProbeMetadataBySpiceVector
}): VoltageGraph | null => {
  if (!normalizedSpiceVector.startsWith("v(")) return null

  const differentialVoltageMatch = originalSpiceVector.match(
    /^v\(([^,]+),\s*([^)]+)\)$/i,
  )
  let voltageSamples: number[] | undefined

  if (differentialVoltageMatch?.[1] && differentialVoltageMatch?.[2]) {
    voltageSamples = voltageSamplesBySpiceVector.get(normalizedSpiceVector)

    if (!voltageSamples) {
      const positiveNodeName = differentialVoltageMatch[1].trim()
      const referenceNodeName = differentialVoltageMatch[2].trim()
      const positiveVoltageSamples = voltageSamplesBySpiceVector.get(
        `v(${positiveNodeName.toLowerCase()})`,
      )
      const referenceVoltageSamples = voltageSamplesBySpiceVector.get(
        `v(${referenceNodeName.toLowerCase()})`,
      )

      if (positiveVoltageSamples && referenceVoltageSamples) {
        voltageSamples = positiveVoltageSamples.map(
          (positiveVoltage, sampleIndex) =>
            positiveVoltage - (referenceVoltageSamples[sampleIndex] ?? 0),
        )
      }
    }
  } else {
    voltageSamples = voltageSamplesBySpiceVector.get(normalizedSpiceVector)
  }

  if (!voltageSamples) return null

  const probeMetadata = voltageProbeMetadataBySpiceVector.get(
    normalizedSpiceVector,
  )
  const voltageGraph: VoltageGraph = {
    graphType: "voltage",
    analysisType: "transient",
    netName: probeMetadata?.name ?? getNetName(originalSpiceVector),
    time: timeSeconds,
    voltage: voltageSamples,
    probeMetadata,
  }

  return voltageGraph
}

export const createCurrentGraphFromRequestedPlot = ({
  normalizedSpiceVector,
  originalSpiceVector,
  timeSeconds,
  currentSamplesBySpiceVector,
  currentProbeMetadataBySpiceVector,
}: {
  normalizedSpiceVector: NormalizedSpiceVector
  originalSpiceVector: SpiceVector
  timeSeconds: number[]
  currentSamplesBySpiceVector: RealSamplesBySpiceVector
  currentProbeMetadataBySpiceVector: CurrentProbeMetadataBySpiceVector
}): CurrentGraph | null => {
  if (!normalizedSpiceVector.startsWith("i(")) return null

  const currentSamples = currentSamplesBySpiceVector.get(normalizedSpiceVector)
  if (!currentSamples) return null

  const probeMetadata = currentProbeMetadataBySpiceVector.get(
    normalizedSpiceVector,
  )
  const currentGraph: CurrentGraph = {
    graphType: "current",
    analysisType: "transient",
    currentName: probeMetadata?.name ?? getCurrentName(originalSpiceVector),
    time: timeSeconds,
    current: currentSamples,
    probeMetadata,
  }

  return currentGraph
}

export { getCurrentName, getNetName }
