import type { CircuitJson } from "circuit-json"
import {
  convertCircuitJsonToSchematicSimulationSvg,
  convertCircuitJsonToSchematicSvg,
  isSimulationAnalysisResult,
} from "circuit-to-svg"

export const renderSimulationSnapshot = ({
  simulationResultCircuitJson,
  name,
}: {
  simulationResultCircuitJson: CircuitJson
  name: string
}): string => {
  const simulation_experiment_id = "snapshot_experiment"
  const results = simulationResultCircuitJson.map((result) => ({
    ...result,
    simulation_experiment_id,
  }))
  if (!results.some(isSimulationAnalysisResult)) {
    return convertCircuitJsonToSchematicSvg(results, {
      width: 1000,
      height: 500,
      showErrorsInTextOverlay: true,
    })
  }

  return convertCircuitJsonToSchematicSimulationSvg({
    circuitJson: [
      {
        type: "simulation_experiment",
        simulation_experiment_id,
        experiment_type: "spice_transient_analysis",
        name,
      },
      ...results,
    ],
    simulation_experiment_id,
    schematicHeightRatio: 0,
    width: 1000,
    height: 500,
    showErrorsInTextOverlay: true,
  })
}
