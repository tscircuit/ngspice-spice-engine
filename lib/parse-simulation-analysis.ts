export type SimulationAnalysis =
  | { type: "transient" }
  | { type: "dc_operating_point" }
  | { type: "dc_sweep"; sweepUnit: "V" | "A" }
  | { type: "ac_sweep" }

export const parseSimulationAnalysis = (
  spiceString: string,
): SimulationAnalysis | null => {
  if (/^\s*\.tran\b/im.test(spiceString)) {
    return { type: "transient" }
  }

  if (/^\s*\.op\b/im.test(spiceString)) {
    return { type: "dc_operating_point" }
  }

  const dcSweepMatch = spiceString.match(/^\s*\.dc\s+(\S+)/im)
  if (dcSweepMatch?.[1]) {
    return {
      type: "dc_sweep",
      sweepUnit: dcSweepMatch[1].toLowerCase().startsWith("i") ? "A" : "V",
    }
  }

  if (/^\s*\.ac\b/im.test(spiceString)) {
    return { type: "ac_sweep" }
  }

  return null
}
