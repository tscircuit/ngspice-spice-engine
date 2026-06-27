import type { SimulationConstructor } from "./eecircuit-engine-types"

const EECIRCUIT_ENGINE_URL =
  "https://jscdn.tscircuit.com/@tscircuit/eecircuit-engine/1.7.4/+esm"
const EECIRCUIT_ENGINE_PACKAGE = "@tscircuit/eecircuit-engine"

export type EecircuitEngineModule = {
  Simulation: SimulationConstructor
}

let modulePromise: Promise<EecircuitEngineModule> | null = null

const importEecircuitEngineModule = async (
  source: string,
): Promise<EecircuitEngineModule> => {
  const moduleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`
  return import(moduleUrl) as Promise<EecircuitEngineModule>
}

const importEecircuitEngineFromCdn =
  async (): Promise<EecircuitEngineModule> => {
    const response = await fetch(EECIRCUIT_ENGINE_URL)
    if (!response.ok) {
      throw new Error(
        `Failed to load @tscircuit/eecircuit-engine from ${EECIRCUIT_ENGINE_URL}: ${response.status} ${response.statusText}`,
      )
    }

    const source = await response.text()
    return importEecircuitEngineModule(source)
  }

export const importEecircuitEngine =
  async (): Promise<EecircuitEngineModule> => {
    if (!modulePromise) {
      modulePromise = import(EECIRCUIT_ENGINE_PACKAGE).catch(() =>
        importEecircuitEngineFromCdn(),
      )
    }

    return modulePromise
  }
