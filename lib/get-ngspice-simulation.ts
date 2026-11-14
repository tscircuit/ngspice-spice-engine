import type { Simulation } from "./eecircuit-engine-types"
import { importEecircuitEngine } from "./import-eecircuit-engine"

const createNgspiceSimulation = async (): Promise<Simulation> => {
  const { Simulation: SimulationCtor } = await importEecircuitEngine()
  const simulation = new SimulationCtor({ ngBehavior: "psa" })
  await simulation.start()
  return simulation
}

let simulationPromise: Promise<Simulation> | null = null

/** Share one initialized WASM runtime between raw and graph consumers. */
export const getNgspiceSimulation = (): Promise<Simulation> => {
  if (!simulationPromise) {
    simulationPromise = createNgspiceSimulation().catch((error) => {
      simulationPromise = null
      throw error
    })
  }
  return simulationPromise
}
