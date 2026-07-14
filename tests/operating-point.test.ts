import { expect, test } from "bun:test"
import {
  classifyNgspiceError,
  createNgspiceSpiceEngine,
  eecircuitResultToOperatingPointCircuitJson,
  NgspiceSimulationError,
  runWithTimeout,
} from "../lib"
import type { ResultType } from "../lib/eecircuit-engine-types"

const operatingPointResult: ResultType = {
  header: "Operating Point",
  numVariables: 2,
  variableNames: ["v(out)", "i(vsense)"],
  numPoints: 1,
  dataType: "real",
  data: [
    { name: "v(out)", type: "voltage", values: [3.3] },
    { name: "i(vsense)", type: "current", values: [0.033] },
  ],
}

test("converts no-time operating-point vectors to scalar Circuit JSON", () => {
  const spice = `
* tscircuit_probe {"simulation_voltage_probe_id":"vp1","name":"VOUT","spice_vector":"V(out)","source_node_name":"out"}
* tscircuit_current_probe {"simulation_current_probe_id":"cp1","name":"ILOAD","spice_vector":"I(Vsense)","source_component_id":"R1"}
.PRINT OP V(out) I(Vsense)
.op
.END
`

  const result = eecircuitResultToOperatingPointCircuitJson(
    operatingPointResult,
    spice,
  )

  expect(result as unknown).toEqual([
    {
      type: "simulation_operating_point_voltage",
      simulation_operating_point_voltage_id:
        "simulation_operating_point_voltage_vp1",
      simulation_experiment_id: "placeholder_simulation_experiment_id",
      simulation_voltage_probe_id: "vp1",
      voltage: 3.3,
      name: "VOUT",
      source_node_name: "out",
      reference_node_name: undefined,
    },
    {
      type: "simulation_operating_point_current",
      simulation_operating_point_current_id:
        "simulation_operating_point_current_cp1",
      simulation_experiment_id: "placeholder_simulation_experiment_id",
      simulation_current_probe_id: "cp1",
      current: 0.033,
      name: "ILOAD",
      source_component_id: "R1",
      source_trace_id: undefined,
    },
  ])
})

test("classifies convergence, model, and syntax failures", () => {
  expect(
    classifyNgspiceError(new Error("dynamic gmin stepping failed")).code,
  ).toBe("non_convergent")
  expect(classifyNgspiceError(new Error("unknown subckt: U1")).code).toBe(
    "missing_model",
  )
  expect(classifyNgspiceError(new Error("syntax error near R1")).code).toBe(
    "invalid_netlist",
  )
})

test("runWithTimeout reports a classified timeout", async () => {
  const never = new Promise<never>(() => {})

  try {
    await runWithTimeout(never, 5)
    throw new Error("Expected timeout")
  } catch (error) {
    expect(error).toBeInstanceOf(NgspiceSimulationError)
    expect((error as NgspiceSimulationError).code).toBe("timeout")
  }
})

test("engine rejects absent and unsupported analysis directives", async () => {
  const engine = await createNgspiceSpiceEngine()

  await expect(engine.simulate("R1 in 0 100\n.END")).rejects.toMatchObject({
    code: "invalid_netlist",
  })
  await expect(
    engine.simulate("V1 in 0 AC 1\n.ac dec 10 1 1k\n.END"),
  ).rejects.toMatchObject({ code: "unsupported_analysis" })
})
