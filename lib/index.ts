import type { ResultType, Simulation } from "@tscircuit/eecircuit-engine"
import type { SpiceEngine } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
import { parseTranParams } from "./parse-tran-params"
import { rewritePspiceCompatibilitySyntax } from "./rewrite-pspice-compatibility-syntax"
import {
  eecircuitResultToSimulationGraphs,
  simulationGraphsToCircuitJson,
} from "./simulation-graphs"

const ensureSimulation = async (): Promise<Simulation> => {
  const { Simulation: SimulationCtor } = await import(
    "@tscircuit/eecircuit-engine"
  )
  const instance = new SimulationCtor({ ngBehavior: "psa" })
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

const simulate = async (
  spiceString: string,
): Promise<{ simulationResultCircuitJson: CircuitJson }> => {
  const simulation = await getSimulation()
  const simulationSpiceString = rewritePspiceCompatibilitySyntax(spiceString)
  simulation.setNetList(simulationSpiceString)

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

  const graphs = eecircuitResultToSimulationGraphs(
    result,
    simulationSpiceString,
  )

  return {
    simulationResultCircuitJson: simulationGraphsToCircuitJson(
      graphs,
      simulationSpiceString,
    ) as CircuitJson,
  }
}

export const createNgspiceSpiceEngine = async (): Promise<SpiceEngine> => {
  return {
    simulate: (spiceString: string) => simulate(spiceString),
  }
}

export default createNgspiceSpiceEngine

export type { TranParams } from "./parse-tran-params"
export { rewritePspiceCompatibilitySyntax } from "./rewrite-pspice-compatibility-syntax"
export {
  eecircuitResultToSimulationGraphs,
  eecircuitResultToVGraphs,
  simulationGraphsToCircuitJson,
} from "./simulation-graphs"
export { parseTranParams }
