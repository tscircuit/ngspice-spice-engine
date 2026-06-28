import type { SimulationConstructor } from "./eecircuit-engine-types"

const EECIRCUIT_ENGINE_URL =
  "https://jscdn.tscircuit.com/@tscircuit/eecircuit-engine/1.7.4/+esm"
const EECIRCUIT_ENGINE_PACKAGE = "@tscircuit/eecircuit-engine"

export type EecircuitEngineModule = {
  Simulation: SimulationConstructor
}

let modulePromise: Promise<EecircuitEngineModule> | null = null

const isBrowserRuntime = (): boolean =>
  typeof window !== "undefined" && typeof document !== "undefined"

const importEecircuitEngineModule = async (
  source: string,
): Promise<EecircuitEngineModule> => {
  if (isBrowserRuntime()) {
    const moduleUrl = URL.createObjectURL(
      new Blob([source], { type: "text/javascript" }),
    )

    try {
      return (await import(moduleUrl)) as Promise<EecircuitEngineModule>
    } finally {
      URL.revokeObjectURL(moduleUrl)
    }
  }

  const [
    { createHash },
    { mkdir, writeFile },
    { tmpdir },
    { join },
    { pathToFileURL },
  ] = await Promise.all([
    import("node:crypto"),
    import("node:fs/promises"),
    import("node:os"),
    import("node:path"),
    import("node:url"),
  ])

  const moduleDir = join(tmpdir(), "ngspice-spice-engine")
  await mkdir(moduleDir, { recursive: true })
  const sourceHash = createHash("sha256").update(source).digest("hex")
  const modulePath = join(moduleDir, `eecircuit-engine-${sourceHash}.mjs`)
  await writeFile(modulePath, source)

  return import(
    pathToFileURL(modulePath).href
  ) as Promise<EecircuitEngineModule>
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
