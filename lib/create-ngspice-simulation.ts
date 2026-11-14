import { importEecircuitEngine } from "./import-eecircuit-engine"
import type { Simulation } from "./eecircuit-engine-types"

/** Shared runtime initialization for both graph rendering and raw CLI results. */
export const createNgspiceSimulation = async (): Promise<Simulation> => {
  const { Simulation: SimulationCtor } = await importEecircuitEngine()
  const simulation = new SimulationCtor({ ngBehavior: "psa" })
  await simulation.start()
  return simulation
}
