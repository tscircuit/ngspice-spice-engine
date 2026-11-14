import type { Simulation } from "./eecircuit-engine-types"
import { importEecircuitEngine } from "./import-eecircuit-engine"

const createNgspiceSimulation = async (): Promise<Simulation> => {
  const { Simulation: SimulationCtor } = await importEecircuitEngine()
  const simulation = new SimulationCtor({ ngBehavior: "psa" })
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    // WASM startup can leave only a pending promise on Bun's event loop. Keep
    // CLI callers alive until startup completes, with a bounded failure path.
    await Promise.race([
      simulation.start(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error("ngspice initialization timed out after 15 seconds"),
            ),
          15000,
        )
      }),
    ])
  } finally {
    clearTimeout(timeout)
  }
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
