import type { SpiceEngine } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
import type { ResultType, Simulation } from "./eecircuit-engine-types"
import { createNgspiceSimulation } from "./create-ngspice-simulation"
import { parseTranParams } from "./parse-tran-params"
import { rewritePspiceCompatibilitySyntax } from "./rewrite-pspice-compatibility-syntax"
import {
  eecircuitResultToSimulationGraphs,
  simulationGraphsToCircuitJson,
} from "./simulation-graphs"

let simulationPromise: Promise<Simulation> | null = null

const getSimulation = async (): Promise<Simulation> => {
  if (!simulationPromise) {
    simulationPromise = createNgspiceSimulation().catch((error) => {
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

  const result: ResultType | null = await simulation.runSim()

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

export { createNgspiceSimulation } from "./create-ngspice-simulation"
export { NGSPICE_ENGINE } from "./import-eecircuit-engine"
export type { ResultType, Simulation } from "./eecircuit-engine-types"

export type { SimulationAnalysis } from "./parse-simulation-analysis"
export { parseSimulationAnalysis } from "./parse-simulation-analysis"
export type { TranParams } from "./parse-tran-params"
export { rewritePspiceCompatibilitySyntax } from "./rewrite-pspice-compatibility-syntax"
export {
  eecircuitResultToSimulationGraphs,
  eecircuitResultToVGraphs,
  simulationGraphsToCircuitJson,
} from "./simulation-graphs"
export { parseTranParams }
