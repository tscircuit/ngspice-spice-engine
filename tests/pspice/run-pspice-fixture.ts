import { readFileSync } from "node:fs"
import { createNgspiceSpiceEngine } from "../../lib"

const fixturePath = process.argv[2]
const withoutPspiceCompat = process.argv.includes("--without-pspice-compat")

if (!fixturePath) {
  console.error("Missing fixture path")
  process.exit(64)
}

const spiceEngine = await createNgspiceSpiceEngine({
  pspiceCompatibility: !withoutPspiceCompat,
})
const spiceString = readFileSync(fixturePath, "utf8")
const result = await spiceEngine.simulate(spiceString)

console.log(
  JSON.stringify({
    graphCount: result.simulationResultCircuitJson.length,
    graphs: result.simulationResultCircuitJson.map((graph) => ({
      name: graph.name,
      pointCount: graph.voltage_levels.length,
      startTimeMs: graph.start_time_ms,
      endTimeMs: graph.end_time_ms,
      timePerStep: graph.time_per_step,
      firstVoltages: graph.voltage_levels.slice(0, 5),
    })),
  }),
)
