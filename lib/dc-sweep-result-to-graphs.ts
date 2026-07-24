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

export const dcSweepResultToGraphs = ({
  eecircuitResult,
  spiceString,
  sweepUnit,
}: {
  eecircuitResult: RealResult
  spiceString: string
  sweepUnit: "V" | "A"
}): SimulationGraph[] => {
  const [sweepCoordinateOutput, ...simulationOutputs] = eecircuitResult.data
  if (!sweepCoordinateOutput) return []

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
      const voltageSamples = getRealVoltageSamples({
        normalizedSpiceVector,
        originalSpiceVector,
        voltageSamplesBySpiceVector,
      })
      if (!voltageSamples) continue

      const probeMetadata = voltageProbeMetadataBySpiceVector.get(
        normalizedSpiceVector,
      )
      simulationGraphs.push({
        graphType: "voltage",
        analysisType: "dc_sweep",
        netName: probeMetadata?.name ?? getNetName(originalSpiceVector),
        sweepValues: sweepCoordinateOutput.values,
        sweepUnit,
        voltage: voltageSamples,
        probeMetadata,
      })
      continue
    }

    const currentSamples = currentSamplesBySpiceVector.get(
      normalizedSpiceVector,
    )
    if (!currentSamples) continue

    const probeMetadata = currentProbeMetadataBySpiceVector.get(
      normalizedSpiceVector,
    )
    simulationGraphs.push({
      graphType: "current",
      analysisType: "dc_sweep",
      currentName: probeMetadata?.name ?? getCurrentName(originalSpiceVector),
      sweepValues: sweepCoordinateOutput.values,
      sweepUnit,
      current: currentSamples,
      probeMetadata,
    })
  }

  return simulationGraphs
}
