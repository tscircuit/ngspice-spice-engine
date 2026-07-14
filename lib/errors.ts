export type NgspiceSimulationErrorCode =
  | "non_convergent"
  | "timeout"
  | "missing_model"
  | "unsupported_analysis"
  | "invalid_netlist"
  | "engine_error"

export class NgspiceSimulationError extends Error {
  code: NgspiceSimulationErrorCode
  diagnostics: string[]

  constructor(
    code: NgspiceSimulationErrorCode,
    message: string,
    diagnostics: string[] = [],
  ) {
    super(message)
    this.name = "NgspiceSimulationError"
    this.code = code
    this.diagnostics = diagnostics
  }
}

export const classifyNgspiceError = (
  error: unknown,
  diagnostics: string[] = [],
): NgspiceSimulationError => {
  if (error instanceof NgspiceSimulationError) return error

  const message = error instanceof Error ? error.message : String(error)
  const searchable = [message, ...diagnostics].join("\n").toLowerCase()

  if (/timed?\s*out|timeout/.test(searchable)) {
    return new NgspiceSimulationError("timeout", message, diagnostics)
  }
  if (
    /converg|timestep too small|iteration limit|singular matrix|dynamic gmin stepping failed/.test(
      searchable,
    )
  ) {
    return new NgspiceSimulationError("non_convergent", message, diagnostics)
  }
  if (
    /unknown subckt|unknown model|model .*not found|could not find a model/.test(
      searchable,
    )
  ) {
    return new NgspiceSimulationError("missing_model", message, diagnostics)
  }
  if (/unsupported analysis|unimplemented control card/.test(searchable)) {
    return new NgspiceSimulationError(
      "unsupported_analysis",
      message,
      diagnostics,
    )
  }
  if (
    /syntax error|parse error|no circuit loaded|unknown device|unknown parameter/.test(
      searchable,
    )
  ) {
    return new NgspiceSimulationError("invalid_netlist", message, diagnostics)
  }

  return new NgspiceSimulationError("engine_error", message, diagnostics)
}

export const runWithTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs?: number,
): Promise<T> => {
  if (timeoutMs === undefined) return promise
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new NgspiceSimulationError(
      "invalid_netlist",
      `Simulation timeout must be a positive number, received ${timeoutMs}`,
    )
  }

  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(
            new NgspiceSimulationError(
              "timeout",
              `Ngspice simulation timed out after ${timeoutMs}ms`,
            ),
          )
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeout !== undefined) clearTimeout(timeout)
  }
}
