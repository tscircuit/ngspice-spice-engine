import { createNgspiceSpiceEngine } from "../dist/index.js"

const engine = await createNgspiceSpiceEngine()
const { simulationResultCircuitJson } = await engine.simulate(`
V1 out 0 DC 1
.PRINT TRAN V(out)
.tran 0.001 0.002
.END
`)

if (!Array.isArray(simulationResultCircuitJson)) {
  throw new Error("Expected simulationResultCircuitJson to be an array")
}

if (simulationResultCircuitJson.length !== 1) {
  throw new Error(
    `Expected one simulation graph, received ${simulationResultCircuitJson.length}`,
  )
}
