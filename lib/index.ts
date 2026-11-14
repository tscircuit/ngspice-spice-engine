import type { SpiceEngine } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
import type { ResultType } from "./eecircuit-engine-types"
import { getNgspiceSimulation } from "./get-ngspice-simulation"
import { parseTranParams } from "./parse-tran-params"
import { rewritePspiceCompatibilitySyntax } from "./rewrite-pspice-compatibility-syntax"
import {
  eecircuitResultToSimulationGraphs,
  simulationGraphsToCircuitJson,
} from "./simulation-graphs"

const simulate = async (
  spiceString: string,
): Promise<{ simulationResultCircuitJson: CircuitJson }> => {
  const simulation = await getNgspiceSimulation()
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

export type { ResultType, Simulation } from "./eecircuit-engine-types"
export { getNgspiceSimulation } from "./get-ngspice-simulation"
export { NGSPICE_ENGINE } from "./import-eecircuit-engine"

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
