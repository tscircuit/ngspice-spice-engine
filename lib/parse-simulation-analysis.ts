import { Ac, Dc, Op, parseSpiceNetlist, Tran } from "spicets"

export type SimulationAnalysis =
  | { type: "transient" }
  | { type: "dc_operating_point" }
  | { type: "dc_sweep"; sweepUnit: "V" | "A" }
  | { type: "ac_sweep" }

export const parseSimulationAnalysis = (
  spiceString: string,
): SimulationAnalysis | null => {
  const analyses = parseSpiceNetlist(spiceString, {
    dialect: "ngspice",
  }).analyses

  if (analyses.some((analysis) => analysis instanceof Tran)) {
    return { type: "transient" }
  }

  if (analyses.some((analysis) => analysis instanceof Op)) {
    return { type: "dc_operating_point" }
  }

  const dcSweep = analyses.find((analysis) => analysis instanceof Dc)
  if (dcSweep) {
    const source = dcSweep.sweeps[0]?.source
    return {
      type: "dc_sweep",
      sweepUnit: source?.toLowerCase().startsWith("i") ? "A" : "V",
    }
  }

  if (analyses.some((analysis) => analysis instanceof Ac)) {
    return { type: "ac_sweep" }
  }

  return null
}
