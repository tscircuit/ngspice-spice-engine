import assert from "node:assert/strict"
import { test } from "node:test"
import {
  createCurrentGraphFromRequestedPlot,
  createVoltageGraphFromRequestedPlot,
} from "../lib/create-graph-from-requested-plot.ts"

type Samples = Array<[string, number[]]>
type Case = {
  name: string
  vector: string
  samples: Samples
  expected: number[] | null
  time?: number[]
}

const cases: Case[] = [
  { name: "missing ground reference uses zero", vector: "V(out,0)", samples: [["v(out)", [10, 12, 14]]], expected: [10, 12, 14] },
  { name: "missing ground positive node uses zero", vector: "V(0,out)", samples: [["v(out)", [10, 12, 14]]], expected: [-10, -12, -14] },
  { name: "two ground nodes produce one zero per time sample", vector: "V(0,0)", samples: [], expected: [0, 0, 0] },
  { name: "two ground nodes with no samples remain empty", vector: "V(0,0)", samples: [], expected: [], time: [] },
  { name: "ordinary single-node samples are unchanged", vector: "V(out)", samples: [["v(out)", [10, 12, 14]]], expected: [10, 12, 14] },
  { name: "ordinary two-node fallback is unchanged", vector: "V(out,ref)", samples: [["v(out)", [10, 12, 14]], ["v(ref)", [6, 7, 8]]], expected: [4, 5, 6] },
  { name: "direct differential samples precede ground reference fallback", vector: "V(out,0)", samples: [["v(out,0)", [9, 8, 7]], ["v(out)", [10, 12, 14]]], expected: [9, 8, 7] },
  { name: "direct differential samples precede ground positive fallback", vector: "V(0,out)", samples: [["v(0,out)", [9, 8, 7]], ["v(out)", [10, 12, 14]]], expected: [9, 8, 7] },
  { name: "direct ground pair samples are preserved", vector: "V(0,0)", samples: [["v(0,0)", [9, 8, 7]]], expected: [9, 8, 7] },
  { name: "missing non-ground reference stays absent", vector: "V(out,missing)", samples: [["v(out)", [10, 12, 14]]], expected: null },
  { name: "missing non-ground positive node stays absent", vector: "V(missing,out)", samples: [["v(out)", [10, 12, 14]]], expected: null },
  { name: "ground reference does not invent a missing positive node", vector: "V(missing,0)", samples: [], expected: null },
  { name: "ground positive node does not invent a missing reference", vector: "V(0,missing)", samples: [], expected: null },
  { name: "00 reference is not ground", vector: "V(out,00)", samples: [["v(out)", [10, 12, 14]]], expected: null },
  { name: "00 positive node is not ground", vector: "V(00,out)", samples: [["v(out)", [10, 12, 14]]], expected: null },
  { name: "existing 00 samples are ordinary node samples", vector: "V(out,00)", samples: [["v(out)", [10, 12, 14]], ["v(00)", [1, 2, 3]]], expected: [9, 10, 11] },
  { name: "gnd reference is not implicitly aliased", vector: "V(out,gnd)", samples: [["v(out)", [10, 12, 14]]], expected: null },
  { name: "GND positive node is not implicitly aliased", vector: "V(GND,out)", samples: [["v(out)", [10, 12, 14]]], expected: null },
  { name: "0.0 reference is not numerically coerced", vector: "V(out,0.0)", samples: [["v(out)", [10, 12, 14]]], expected: null },
  { name: "case and surrounding node whitespace are preserved", vector: "V( Out , 0 )", samples: [["v(out)", [10, 12, 14]]], expected: [10, 12, 14] },
  { name: "nonzero numeric node names work with ground", vector: "V(15,0)", samples: [["v(15)", [2, 4, 6]]], expected: [2, 4, 6] },
  { name: "ground positive node negates signed samples", vector: "V(0,out)", samples: [["v(out)", [-3, 2, -1]]], expected: [3, -2, 1] },
  { name: "existing ground reference samples retain prior behavior", vector: "V(out,0)", samples: [["v(out)", [10, 12, 14]], ["v(0)", [1, 2, 3]]], expected: [9, 10, 11] },
  { name: "existing ground positive samples retain prior behavior", vector: "V(0,out)", samples: [["v(out)", [10, 12, 14]], ["v(0)", [1, 2, 3]]], expected: [-9, -10, -11] },
  { name: "empty node sample arrays remain empty", vector: "V(out,0)", samples: [["v(out)", []]], expected: [], time: [] },
]

for (const { name, vector, samples, expected, time = [0, 1, 2] } of cases) {
  test(name, () => {
    const graph = createVoltageGraphFromRequestedPlot({
      normalizedSpiceVector: vector.toLowerCase().replace(/\s/g, ""),
      originalSpiceVector: vector,
      timeSeconds: time,
      voltageSamplesBySpiceVector: new Map(samples),
      voltageProbeMetadataBySpiceVector: new Map(),
    })
    assert.deepEqual(graph?.voltage ?? null, expected)
    if (graph) {
      assert.strictEqual(graph.time, time)
      assert.equal(graph.analysisType, "transient")
      assert.equal(graph.graphType, "voltage")
    }
  })
}

test("ground fallback preserves probe metadata and requested name", () => {
  const metadata = {
    simulation_voltage_probe_id: "probe-1",
    name: "Measured voltage",
    spice_vector: "V(Out,0)",
    source_node_name: "Out",
    reference_node_name: "0",
  }
  const graph = createVoltageGraphFromRequestedPlot({
    normalizedSpiceVector: "v(out,0)",
    originalSpiceVector: "V(Out,0)",
    timeSeconds: [0, 1, 2],
    voltageSamplesBySpiceVector: new Map([["v(out)", [10, 12, 14]]]),
    voltageProbeMetadataBySpiceVector: new Map([["v(out,0)", metadata]]),
  })
  assert.ok(graph)
  assert.equal(graph.netName, "Measured voltage")
  assert.strictEqual(graph.probeMetadata, metadata)
  assert.deepEqual(graph.voltage, [10, 12, 14])
})

test("ground fallback does not mutate input samples or maps", () => {
  const samples = [10, 12, 14]
  const map = new Map([["v(out)", samples]])
  const time = [0, 1, 2]
  const graph = createVoltageGraphFromRequestedPlot({
    normalizedSpiceVector: "v(0,out)",
    originalSpiceVector: "V(0,out)",
    timeSeconds: time,
    voltageSamplesBySpiceVector: map,
    voltageProbeMetadataBySpiceVector: new Map(),
  })
  assert.ok(graph)
  assert.deepEqual(graph.voltage, [-10, -12, -14])
  assert.deepEqual(samples, [10, 12, 14])
  assert.deepEqual(time, [0, 1, 2])
  assert.equal(map.size, 1)
  assert.strictEqual(map.get("v(out)"), samples)
  assert.equal(map.has("v(0)"), false)
})

test("current graph generation is unchanged", () => {
  const samples = [1, 2, 3]
  const graph = createCurrentGraphFromRequestedPlot({
    normalizedSpiceVector: "i(vsense)",
    originalSpiceVector: "I(Vsense)",
    timeSeconds: [0, 1, 2],
    currentSamplesBySpiceVector: new Map([["i(vsense)", samples]]),
    currentProbeMetadataBySpiceVector: new Map(),
  })
  assert.ok(graph)
  assert.equal(graph.currentName, "Vsense")
  assert.strictEqual(graph.current, samples)
})
