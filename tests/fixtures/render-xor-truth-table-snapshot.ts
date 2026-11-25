import type { SimulationTransientVoltageGraph } from "circuit-json"

export const renderXorTruthTableSnapshot = (
  graphs: SimulationTransientVoltageGraph[],
): string => {
  const output = graphs.find((graph) => graph.name === "out")!
  const states = [
    { inputs: "Both inputs OFF", expected: 0, sample: 50 },
    { inputs: "Only A ON", expected: 1, sample: 150 },
    { inputs: "Both inputs ON", expected: 0, sample: 250 },
    { inputs: "Only B ON", expected: 1, sample: 350 },
  ]
  const signals = [
    { name: "a", label: "Input A", color: "#2563eb" },
    { name: "b", label: "Input B", color: "#b45309" },
    { name: "out", label: "Output (simulated)", color: "#7c3aed" },
  ]
  const rows = signals
    .map(({ name, label, color }, row) => {
      const graph = graphs.find((graph) => graph.name === name)!
      const top = 106 + row * 120
      const bottom = top + 70
      const points = graph.voltage_levels
        .map((voltage, index) => {
          const time =
            graph.timestamps_ms?.[index] ??
            graph.start_time_ms + index * graph.time_per_step
          const x =
            100 +
            (800 * (time - graph.start_time_ms)) /
              (graph.end_time_ms - graph.start_time_ms)
          return `${x.toFixed(2)},${(bottom - voltage * 70).toFixed(2)}`
        })
        .join(" ")
      const grid = [0, 1, 2, 3, 4]
        .map(
          (step) =>
            `<line x1="${100 + step * 200}" y1="${top - 10}" x2="${100 + step * 200}" y2="${bottom + 10}" stroke="#ddd" />`,
        )
        .join("\n")
      return `<g>
        <text x="100" y="${top - 17}" font-size="17" font-weight="bold" fill="${color}">${label}</text>
        <rect x="100" y="${top - 10}" width="800" height="90" fill="white" />
        ${grid}
        <path d="M100 ${top} H900 M100 ${bottom} H900" stroke="#ddd" fill="none" />
        <text x="88" y="${top + 5}" text-anchor="end" font-size="14">ON</text>
        <text x="88" y="${bottom + 5}" text-anchor="end" font-size="14">OFF</text>
        <polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round" />
      </g>`
    })
    .join("\n")
  const ticks = [0, 1, 2, 3, 4]
    .map(
      (step) =>
        `<text x="${100 + step * 200}" y="465" text-anchor="middle" font-size="14">${(((output.end_time_ms - output.start_time_ms) * 1000 * step) / 4).toFixed(0)}</text>`,
    )
    .join("\n")
  const labels = states
    .map(({ inputs, expected, sample }, index) => {
      const actual = output.voltage_levels[sample]!
      const correct = actual === expected
      const color = correct ? "#166534" : "#b91c1c"
      return `<g transform="translate(${110 + index * 200}, 515)">
        <rect width="180" height="110" rx="8" fill="${correct ? "#f0fdf4" : "#fef2f2"}" stroke="${color}" />
        <text x="12" y="25" font-size="16" font-weight="bold">${inputs}</text>
        <text x="12" y="49" font-size="14">Expected: ${expected === 1 ? "ON (1 V)" : "OFF (0 V)"}</text>
        <text x="12" y="73" font-size="14" font-weight="bold" fill="${color}">Actual: ${actual === 1 ? "ON (1 V)" : "OFF (0 V)"}</text>
        <text x="12" y="96" font-size="13" font-weight="bold" fill="${color}">${correct ? "CORRECT" : "WRONG"}</text>
      </g>`
    })
    .join("\n")
  const wrongStates = states.filter(
    ({ expected, sample }) => output.voltage_levels[sample] !== expected,
  ).length

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700" font-family="Arial, sans-serif" fill="#222">
    <rect width="1000" height="700" fill="rgb(245, 241, 237)" />
    <text x="500" y="27" text-anchor="middle" font-size="21" font-weight="bold">Rule: output ON only when exactly one input is ON</text>
    <text x="500" y="53" text-anchor="middle" font-size="15">Actual ngspice signals: two inputs and their resulting output</text>
    ${rows}
    ${ticks}
    <text x="500" y="492" text-anchor="middle" font-size="15">Time (µs) — shared by all three rows</text>
    ${labels}
    <text x="100" y="655" font-size="17" font-weight="bold">${wrongStates} of 4 output states wrong</text>
    <text x="100" y="681" font-size="15">Compare inputs and output vertically. High = ON (1 V); low = OFF (0 V).</text>
  </svg>`
}
