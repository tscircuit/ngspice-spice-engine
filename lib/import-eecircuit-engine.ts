import type { SimulationConstructor } from "./eecircuit-engine-types"

export const NGSPICE_ENGINE = {
  name: "ngspice",
  package: "@tscircuit/eecircuit-engine",
  version: "1.7.6",
  compatibility: "psa",
} as const

export type EecircuitEngineModule = {
  Simulation: SimulationConstructor
}

let modulePromise: Promise<EecircuitEngineModule> | null = null

export const importEecircuitEngine =
  async (): Promise<EecircuitEngineModule> => {
    if (!modulePromise) {
      modulePromise = import(
        "@tscircuit/eecircuit-engine"
      ) as Promise<EecircuitEngineModule>
    }

    return modulePromise
  }
