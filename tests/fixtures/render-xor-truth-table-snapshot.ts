import type { SimulationTransientVoltageGraph } from "circuit-json"
import { renderSimulationSnapshot } from "./render-simulation-snapshot"

export const renderXorTruthTableSnapshot = (
  output: SimulationTransientVoltageGraph,
): string => {
  const states = [
    { inputs: "Both inputs OFF", expected: 0, sample: 50 },
    { inputs: "Only A ON", expected: 1, sample: 150 },
    { inputs: "Both inputs ON", expected: 0, sample: 250 },
    { inputs: "Only B ON", expected: 1, sample: 350 },
  ]
  const chart = renderSimulationSnapshot({
    simulationResultCircuitJson: [{ ...output, name: "Output" }],
    name: "Rule: output ON only when exactly one input is ON",
  })
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
    ${chart}
    ${labels}
    <text x="100" y="655" font-size="17" font-weight="bold">${wrongStates} of 4 output states wrong</text>
    <text x="100" y="681" font-size="15">Only the simulated output is plotted. High = ON (1 V); low = OFF (0 V).</text>
  </svg>`
}
