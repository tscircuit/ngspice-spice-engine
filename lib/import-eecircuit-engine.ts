import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import type { SimulationConstructor } from "./eecircuit-engine-types"

const EECIRCUIT_ENGINE_URL =
  "https://jscdn.tscircuit.com/@tscircuit/eecircuit-engine/1.7.4/+esm"
const EECIRCUIT_ENGINE_PACKAGE = "@tscircuit/eecircuit-engine"
const EECIRCUIT_ENGINE_TMP_DIR = join(tmpdir(), "ngspice-spice-engine")

export type EecircuitEngineModule = {
  Simulation: SimulationConstructor
}

let modulePromise: Promise<EecircuitEngineModule> | null = null

const importEecircuitEngineModule = async (
  source: string,
): Promise<EecircuitEngineModule> => {
  await mkdir(EECIRCUIT_ENGINE_TMP_DIR, { recursive: true })
  const sourceHash = createHash("sha256").update(source).digest("hex")
  const modulePath = join(
    EECIRCUIT_ENGINE_TMP_DIR,
    `eecircuit-engine-${sourceHash}.mjs`,
  )
  await writeFile(modulePath, source)
  const moduleUrl = pathToFileURL(modulePath).href
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
