import type { SpiceEngine } from "@tscircuit/props"
import type { CircuitJson, SimulationTransientVoltageGraph } from "circuit-json"
import type { ResultType, Simulation } from "eecircuit-engine"
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

const extractRequestedPlots = (spiceString: string): Set<string> | null => {
  const match = spiceString.match(/\.print\s+tran\s+(.*)/i)
  if (!match || !match[1]) {
    return null
  }

  const tokens = match[1].toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) {
    return null
  }

  return new Set(tokens)
}

const getNetName = (rawName: string): string => {
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

  const requestedPlots = extractRequestedPlots(spiceString)
  const timeData = result.data.find((item) => item.type === "time")

  if (!timeData || !Array.isArray(timeData.values)) {
    return []
  }

  const timeValues = timeData.values
  const graphs: VoltageGraph[] = []

  for (const item of result.data) {
    if (item.type !== "voltage" || !Array.isArray(item.values)) {
      continue
    }

    if (requestedPlots && !requestedPlots.has(item.name.toLowerCase())) {
      continue
    }

    const netName = getNetName(item.name)

    graphs.push({
      netName,
      time: timeValues,
      voltage: item.values,
    })
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
