import type { SpiceEngine } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
import type { ResultType, Simulation } from "./eecircuit-engine-types"
import {
  classifyNgspiceError,
  NgspiceSimulationError,
  runWithTimeout,
} from "./errors"
import { importEecircuitEngine } from "./import-eecircuit-engine"
import {
  eecircuitResultToOperatingPointCircuitJson,
  isOperatingPointAnalysis,
} from "./operating-point-to-circuit-json"
import { parseTranParams } from "./parse-tran-params"
import { rewritePspiceCompatibilitySyntax } from "./rewrite-pspice-compatibility-syntax"
import {
  eecircuitResultToSimulationGraphs,
  simulationGraphsToCircuitJson,
} from "./simulation-graphs"

const ensureSimulation = async (): Promise<Simulation> => {
  const { Simulation: SimulationCtor } = await importEecircuitEngine()
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

const getSimulationDiagnostics = (simulation: Simulation): string[] => {
  try {
    return simulation.getError?.() ?? []
  } catch {
    return []
  }
}

const simulate = async (
  spiceString: string,
  options?: { timeoutMs?: number },
): Promise<{ simulationResultCircuitJson: CircuitJson }> => {
  const simulationSpiceString = rewritePspiceCompatibilitySyntax(spiceString)
  const analysis = simulationSpiceString.match(
    /^\s*\.(op|tran|ac|dc|noise|tf)(?:\s|$)/im,
  )?.[1]
  if (!analysis) {
    throw new NgspiceSimulationError(
      "invalid_netlist",
      "No supported SPICE analysis directive was found; expected .op or .tran",
    )
  }
  if (analysis.toLowerCase() !== "op" && analysis.toLowerCase() !== "tran") {
    throw new NgspiceSimulationError(
      "unsupported_analysis",
      `Unsupported SPICE analysis directive: .${analysis}`,
    )
  }

  const simulation = await getSimulation()
  simulation.setNetList(simulationSpiceString)

  let result: ResultType | null
  try {
    result = await runWithTimeout(simulation.runSim(), options?.timeoutMs)
  } catch (error) {
    const diagnostics = getSimulationDiagnostics(simulation)
    const classifiedError = classifyNgspiceError(error, diagnostics)
    if (classifiedError.code === "timeout") {
      simulationPromise = null
    }
    throw classifiedError
  }

  if (!result) {
    const diagnostics = getSimulationDiagnostics(simulation)
    throw classifyNgspiceError(
      new NgspiceSimulationError(
        "engine_error",
        "Ngspice returned no simulation result",
        diagnostics,
      ),
      diagnostics,
    )
  }

  if (isOperatingPointAnalysis(simulationSpiceString)) {
    return {
      simulationResultCircuitJson: eecircuitResultToOperatingPointCircuitJson(
        result,
        simulationSpiceString,
      ),
    }
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
    simulate: (spiceString: string, options?: { timeoutMs?: number }) =>
      simulate(spiceString, options),
  }
}

export default createNgspiceSpiceEngine

export * from "./errors"
export {
  eecircuitResultToOperatingPointCircuitJson,
  isOperatingPointAnalysis,
} from "./operating-point-to-circuit-json"
export type { TranParams } from "./parse-tran-params"
export { rewritePspiceCompatibilitySyntax } from "./rewrite-pspice-compatibility-syntax"
export {
  eecircuitResultToSimulationGraphs,
  eecircuitResultToVGraphs,
  simulationGraphsToCircuitJson,
} from "./simulation-graphs"
export { parseTranParams }
