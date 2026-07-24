import { getCurrentName, getNetName } from "./create-graph-from-requested-plot"
import {
  extractCurrentProbeMetadata,
  extractVoltageProbeMetadata,
} from "./extract-probe-metadata"
import {
  getRealSampleMaps,
  getRealVoltageSamples,
  getRequestedPlotByNormalizedSpiceVector,
  type RealResult,
} from "./non-transient-result-helpers"
import type { SimulationGraph } from "./simulation-graph-types"

export const operatingPointResultToGraphs = ({
  eecircuitResult,
  spiceString,
}: {
  eecircuitResult: RealResult
  spiceString: string
}): SimulationGraph[] => {
  const simulationOutputs = eecircuitResult.data
  const { voltageSamplesBySpiceVector, currentSamplesBySpiceVector } =
    getRealSampleMaps(simulationOutputs)
  const voltageProbeMetadataBySpiceVector =
    extractVoltageProbeMetadata(spiceString)
  const currentProbeMetadataBySpiceVector =
    extractCurrentProbeMetadata(spiceString)
  const simulationGraphs: SimulationGraph[] = []

  for (const [
    normalizedSpiceVector,
    originalSpiceVector,
  ] of getRequestedPlotByNormalizedSpiceVector({
    spiceString,
    simulationOutputs,
  })) {
    if (normalizedSpiceVector.startsWith("v(")) {
      const voltage = getRealVoltageSamples({
        normalizedSpiceVector,
        originalSpiceVector,
        voltageSamplesBySpiceVector,
      })?.[0]
      if (voltage === undefined) continue

      const probeMetadata = voltageProbeMetadataBySpiceVector.get(
        normalizedSpiceVector,
      )
      simulationGraphs.push({
        graphType: "voltage",
        analysisType: "dc_operating_point",
        netName: probeMetadata?.name ?? getNetName(originalSpiceVector),
        voltage,
        probeMetadata,
      })
      continue
    }

    const current = currentSamplesBySpiceVector.get(normalizedSpiceVector)?.[0]
    if (current === undefined) continue

    const probeMetadata = currentProbeMetadataBySpiceVector.get(
      normalizedSpiceVector,
    )
    simulationGraphs.push({
      graphType: "current",
      analysisType: "dc_operating_point",
      currentName: probeMetadata?.name ?? getCurrentName(originalSpiceVector),
      current,
      probeMetadata,
    })
  }

  return simulationGraphs
}
