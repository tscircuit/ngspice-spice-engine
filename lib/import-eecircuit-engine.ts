import type { SimulationConstructor } from "./eecircuit-engine-types"

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
