import { expect, test } from "bun:test"
import { createNgspiceSpiceEngine } from "../lib"

test("runs the installed eecircuit engine without an HTTP fetch", async () => {
  const originalFetch = globalThis.fetch
  let httpFetchCount = 0

  type FetchInput = Parameters<typeof globalThis.fetch>[0]
  type FetchInit = Parameters<typeof globalThis.fetch>[1]
  const fetchWithoutHttp = (input: FetchInput, init?: FetchInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url

    if (/^https?:/i.test(url)) {
      httpFetchCount += 1
      throw new Error(`The eecircuit engine must be available locally: ${url}`)
    }

    return originalFetch(input, init)
  }
  globalThis.fetch = fetchWithoutHttp as typeof globalThis.fetch

  try {
    const engine = await createNgspiceSpiceEngine()
    const { simulationResultCircuitJson } = await engine.simulate(
      `* offline smoke test
V1 out 0 DC 3.3
.PRINT TRAN V(out)
.tran 0.001 0.002
.END
`,
    )

    expect(simulationResultCircuitJson).toHaveLength(1)
    expect(httpFetchCount).toBe(0)
  } finally {
    globalThis.fetch = originalFetch
  }
})
