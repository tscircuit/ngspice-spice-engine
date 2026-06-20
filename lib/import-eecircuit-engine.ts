import type { SimulationConstructor } from "./eecircuit-engine-types"

const EECIRCUIT_ENGINE_URL =
  "https://jscdn.tscircuit.com/@tscircuit/eecircuit-engine/1.7.4/+esm"

export type EecircuitEngineModule = {
  Simulation: SimulationConstructor
}

let modulePromise: Promise<EecircuitEngineModule> | null = null

export const importEecircuitEngine =
  async (): Promise<EecircuitEngineModule> => {
    if (!modulePromise) {
      modulePromise = fetch(EECIRCUIT_ENGINE_URL).then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load @tscircuit/eecircuit-engine from ${EECIRCUIT_ENGINE_URL}: ${response.status} ${response.statusText}`,
          )
        }

        const source = await response.text()
        const moduleUrl = URL.createObjectURL(
          new Blob([source], { type: "text/javascript" }),
        )

        return import(moduleUrl) as Promise<EecircuitEngineModule>
      })
    }

    return modulePromise
  }
