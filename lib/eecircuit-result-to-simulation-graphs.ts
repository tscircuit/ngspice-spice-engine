import { acSweepResultToGraphs } from "./ac-sweep-result-to-graphs"
import {
  createCurrentGraphFromRequestedPlot,
  createVoltageGraphFromRequestedPlot,
  getCurrentName,
  getNetName,
} from "./create-graph-from-requested-plot"
import { dcSweepResultToGraphs } from "./dc-sweep-result-to-graphs"
import type { ResultType } from "./eecircuit-engine-types"
import {
  extractCurrentProbeMetadata,
  extractVoltageProbeMetadata,
  normalizeSpiceVector,
} from "./extract-probe-metadata"
import { extractRequestedPlots } from "./extract-requested-plots"
import { linearInterpolate } from "./linear-interpolate"
import { operatingPointResultToGraphs } from "./operating-point-result-to-graphs"
import { parseSimulationAnalysis } from "./parse-simulation-analysis"
import { parseTranParams } from "./parse-tran-params"
import type {
  CurrentGraph,
  SimulationGraph,
  VoltageGraph,
} from "./simulation-graph-types"
import type { RealSamplesBySpiceVector } from "./simulation-output-maps"

export const eecircuitResultToSimulationGraphs = (
  result: ResultType,
  spiceString: string,
): SimulationGraph[] => {
  const analysis = parseSimulationAnalysis(spiceString)

  if (analysis?.type === "dc_operating_point") {
    return result.dataType === "real"
      ? operatingPointResultToGraphs({ eecircuitResult: result, spiceString })
      : []
  }

  if (analysis?.type === "dc_sweep") {
    return result.dataType === "real"
      ? dcSweepResultToGraphs({
          eecircuitResult: result,
          spiceString,
          sweepUnit: analysis.sweepUnit,
        })
      : []
  }

  if (analysis?.type === "ac_sweep") {
    return result.dataType === "complex"
      ? acSweepResultToGraphs({ eecircuitResult: result, spiceString })
      : []
  }

  if (!result?.data || result.dataType !== "real") {
    return []
  }

  const timeOutput = result.data.find(
    (simulationOutput) => simulationOutput.type === "time",
  )
  if (!timeOutput || !Array.isArray(timeOutput.values)) {
    return []
  }
  const timeSeconds = timeOutput.values

  const voltageOutputs = result.data.filter(
    (simulationOutput) =>
      simulationOutput.type === "voltage" &&
      Array.isArray(simulationOutput.values),
  )

  const voltageSamplesBySpiceVector: RealSamplesBySpiceVector = new Map()
  for (const voltageOutput of voltageOutputs) {
    voltageSamplesBySpiceVector.set(
      normalizeSpiceVector(voltageOutput.name),
      voltageOutput.values,
    )
  }

  const currentOutputs = result.data.filter(
    (simulationOutput) =>
      simulationOutput.type === "current" &&
      Array.isArray(simulationOutput.values),
  )

  const currentSamplesBySpiceVector: RealSamplesBySpiceVector = new Map()
  for (const currentOutput of currentOutputs) {
    currentSamplesBySpiceVector.set(
      normalizeSpiceVector(currentOutput.name),
      currentOutput.values,
    )
  }

  const requestedPlotByNormalizedSpiceVector =
    extractRequestedPlots(spiceString)
  const voltageProbeMetadataBySpiceVector =
    extractVoltageProbeMetadata(spiceString)
  const currentProbeMetadataBySpiceVector =
    extractCurrentProbeMetadata(spiceString)

  if (!requestedPlotByNormalizedSpiceVector) {
    return [
      ...voltageOutputs.map((voltageOutput) => {
        const probeMetadata = voltageProbeMetadataBySpiceVector.get(
          normalizeSpiceVector(voltageOutput.name),
        )
        const voltageGraph: VoltageGraph = {
          graphType: "voltage" as const,
          analysisType: "transient",
          netName: probeMetadata?.name ?? getNetName(voltageOutput.name),
          time: timeSeconds,
          voltage: voltageOutput.values,
          probeMetadata,
        }

        return voltageGraph
      }),
      ...currentOutputs.map((currentOutput) => {
        const probeMetadata = currentProbeMetadataBySpiceVector.get(
          normalizeSpiceVector(currentOutput.name),
        )
        const currentGraph: CurrentGraph = {
          graphType: "current" as const,
          analysisType: "transient",
          currentName:
            probeMetadata?.name ?? getCurrentName(currentOutput.name),
          time: timeSeconds,
          current: currentOutput.values,
          probeMetadata,
        }

        return currentGraph
      }),
    ]
  }

  const graphs: Array<VoltageGraph | CurrentGraph> = []
  for (const [
    normalizedSpiceVector,
    originalSpiceVector,
  ] of requestedPlotByNormalizedSpiceVector) {
    const graph =
      createVoltageGraphFromRequestedPlot({
        normalizedSpiceVector,
        originalSpiceVector,
        timeSeconds,
        voltageSamplesBySpiceVector,
        voltageProbeMetadataBySpiceVector,
      }) ??
      createCurrentGraphFromRequestedPlot({
        normalizedSpiceVector,
        originalSpiceVector,
        timeSeconds,
        currentSamplesBySpiceVector,
        currentProbeMetadataBySpiceVector,
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
    (graph): graph is VoltageGraph =>
      graph.graphType === "voltage" && graph.analysisType === "transient",
  )
}
