import type { SpiceEngine } from "@tscircuit/props"
import type { CircuitJson, SimulationTransientVoltageGraph } from "circuit-json"
import type { ResultType, Simulation } from "eecircuit-engine"
import { linearInterpolate } from "./linear-interpolate"
import { parseTranParams } from "./parse-tran-params"

interface VoltageGraph {
  netName: string
  time: number[]
  voltage: number[]
}

const ensureSimulation = async (): Promise<Simulation> => {
  const { Simulation: SimulationCtor } = await import("eecircuit-engine")
  const instance = new SimulationCtor()
  await instance.start()
  return instance
}

let simulationPromise: Promise<Simulation> | null = null

const getSimulation = async (): Promise<Simulation> => {
  if (!simulationPromise) {
    simulationPromise = ensureSimulation().catch((error) => {
      simulationPromise = null
      throw error
    })
  }
  return simulationPromise
}

const extractRequestedPlots = (
  spiceString: string,
): Map<string, string> | null => {
  const match = spiceString.match(/\.print\s+tran\s+(.*)/i)
  if (!match || !match[1]) {
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

export const eecircuitResultToVGraphs = (
  result: ResultType,
  spiceString: string,
): VoltageGraph[] => {
  if (!result || !result.data || result.dataType !== "real") {
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

  const requestedPlots = extractRequestedPlots(spiceString)

  if (!requestedPlots) {
    // If no plots are requested, return all available voltage plots
    return voltageDataItems.map((item) => ({
      netName: getNetName(item.name),
      time: timeValues,
      voltage: item.values as number[],
    }))
  }

  const graphs: VoltageGraph[] = []
  for (const [lowerCaseToken, originalToken] of requestedPlots.entries()) {
    const diffMatch = originalToken.match(/^v\(([^,]+),\s*([^)]+)\)$/i)
    let voltage: number[] | undefined

    if (diffMatch?.[1] && diffMatch?.[2]) {
      // It's a differential plot request.
      // First, try to find a pre-calculated plot.
      voltage = voltageDataMap.get(lowerCaseToken)

      // If not found, try to calculate it from individual nodes.
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
      // It's a single-ended plot request.
      voltage = voltageDataMap.get(lowerCaseToken)
    }

    if (voltage) {
      graphs.push({
        netName: getNetName(originalToken),
        time: timeValues,
        voltage,
      })
    }
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
    // Ensure we don't divide by zero and that we have a valid range
    const numSteps = Math.floor((tstop - tstart) / tstep)

    if (numSteps > 0) {
      const newTimeValues = Array.from(
        { length: numSteps + 1 },
        (_, i) => tstart + i * tstep,
      )
      // All graphs from eecircuit-engine share the same time vector.
      const oldTimeValues = graphs[0]!.time
      return graphs.map((graph) => ({
        ...graph,
        time: newTimeValues,
        voltage: newTimeValues.map((t) =>
          linearInterpolate(t, oldTimeValues, graph.voltage),
        ),
      }))
    }
  }

  return graphs
}

const voltageGraphsToCircuitJson = (
  graphs: VoltageGraph[],
  spiceString: string,
): SimulationTransientVoltageGraph[] => {
  const tranParams = parseTranParams(spiceString)

  return graphs.map((graph) => ({
    type: "simulation_transient_voltage_graph",
    simulation_experiment_id: "placeholder_simulation_experiment_id",
    simulation_transient_voltage_graph_id: `simulation_graph_${graph.netName}`,
    name: graph.netName,
    voltage_levels: graph.voltage,
    timestamps_ms: graph.time.map((timePoint) => timePoint * 1000),
    start_time_ms: (tranParams?.tstart ?? 0) * 1000,
    time_per_step: (tranParams?.tstep ?? 0) * 1000,
    end_time_ms: (tranParams?.tstop ?? 0) * 1000,
  }))
}

const simulate = async (
  spiceString: string,
): Promise<{ simulationResultCircuitJson: CircuitJson }> => {
  const simulation = await getSimulation()
  simulation.setNetList(spiceString)

  let result: ResultType | null
  try {
    result = await simulation.runSim()
  } catch (error) {
    console.error(error)
    throw error
  }

  if (!result) {
    return { simulationResultCircuitJson: [] }
  }

  const graphs = eecircuitResultToVGraphs(result, spiceString)

  return {
    simulationResultCircuitJson: voltageGraphsToCircuitJson(
      graphs,
      spiceString,
    ),
  }
}

export const createNgspiceSpiceEngine = async (): Promise<SpiceEngine> => ({
  simulate,
})

export default createNgspiceSpiceEngine

export type { TranParams } from "./parse-tran-params"
export { parseTranParams }
