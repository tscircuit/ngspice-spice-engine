import type { ResultType } from "./eecircuit-engine-types"
import {
  createCurrentGraphFromRequestedPlot,
  createVoltageGraphFromRequestedPlot,
  getCurrentName,
  getNetName,
} from "./create-graph-from-requested-plot"
import {
  extractCurrentProbeMetadata,
  extractVoltageProbeMetadata,
  normalizeSpiceVector,
} from "./extract-probe-metadata"
import { extractRequestedPlots } from "./extract-requested-plots"
import { linearInterpolate } from "./linear-interpolate"
import { parseTranParams } from "./parse-tran-params"
import type {
  CurrentGraph,
  SimulationGraph,
  VoltageGraph,
} from "./simulation-graph-types"

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
        const voltageGraph: VoltageGraph = {
          graphType: "voltage" as const,
          netName: metadata?.name ?? getNetName(item.name),
          time: timeValues,
          voltage: item.values as number[],
          probeMetadata: metadata,
        }

        return voltageGraph
      }),
      ...currentDataItems.map((item) => {
        const metadata = currentProbeMetadata.get(
          normalizeSpiceVector(item.name),
        )
        const currentGraph: CurrentGraph = {
          graphType: "current" as const,
          currentName: metadata?.name ?? getCurrentName(item.name),
          time: timeValues,
          current: item.values as number[],
          probeMetadata: metadata,
        }

        return currentGraph
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
