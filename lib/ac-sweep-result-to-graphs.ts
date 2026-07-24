import { getCurrentName, getNetName } from "./create-graph-from-requested-plot"
import {
  extractCurrentProbeMetadata,
  extractVoltageProbeMetadata,
} from "./extract-probe-metadata"
import {
  type ComplexResult,
  getComplexSampleMaps,
  getComplexVoltageSamples,
  getRequestedPlotByNormalizedSpiceVector,
  toCircuitJsonComplexSamples,
} from "./non-transient-result-helpers"
import type { SimulationGraph } from "./simulation-graph-types"

export const acSweepResultToGraphs = ({
  eecircuitResult,
  spiceString,
}: {
  eecircuitResult: ComplexResult
  spiceString: string
}): SimulationGraph[] => {
  const frequencyOutput = eecircuitResult.data.find(
    (simulationOutput) => simulationOutput.type === "frequency",
  )
  if (!frequencyOutput) return []

  const simulationOutputs = eecircuitResult.data.filter(
    (simulationOutput) => simulationOutput !== frequencyOutput,
  )
  const { voltageSamplesBySpiceVector, currentSamplesBySpiceVector } =
    getComplexSampleMaps(simulationOutputs)
  const frequenciesHz = frequencyOutput.values.map(({ real }) => real)
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
      const complexVoltageSamples = getComplexVoltageSamples({
        normalizedSpiceVector,
        originalSpiceVector,
        voltageSamplesBySpiceVector,
      })
      if (!complexVoltageSamples) continue

      const probeMetadata = voltageProbeMetadataBySpiceVector.get(
        normalizedSpiceVector,
      )
      simulationGraphs.push({
        graphType: "voltage",
        analysisType: "ac_sweep",
        netName: probeMetadata?.name ?? getNetName(originalSpiceVector),
        frequenciesHz,
        complexVoltages: toCircuitJsonComplexSamples(complexVoltageSamples),
        probeMetadata,
      })
      continue
    }

    const complexCurrentSamples = currentSamplesBySpiceVector.get(
      normalizedSpiceVector,
    )
    if (!complexCurrentSamples) continue

    const probeMetadata = currentProbeMetadataBySpiceVector.get(
      normalizedSpiceVector,
    )
    simulationGraphs.push({
      graphType: "current",
      analysisType: "ac_sweep",
      currentName: probeMetadata?.name ?? getCurrentName(originalSpiceVector),
      frequenciesHz,
      complexCurrents: toCircuitJsonComplexSamples(complexCurrentSamples),
      probeMetadata,
    })
  }

  return simulationGraphs
}
