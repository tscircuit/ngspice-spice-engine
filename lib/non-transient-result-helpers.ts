import type {
  ComplexDataType,
  ComplexNumber,
  RealDataType,
  ResultType,
} from "./eecircuit-engine-types"
import { normalizeSpiceVector } from "./extract-probe-metadata"
import {
  extractRequestedPlots,
  type NormalizedSpiceVector,
  type RequestedPlotByNormalizedSpiceVector,
  type SpiceVector,
} from "./extract-requested-plots"
import type {
  ComplexSamplesBySpiceVector,
  RealSamplesBySpiceVector,
} from "./simulation-output-maps"

export type RealResult = Extract<ResultType, { dataType: "real" }>
export type ComplexResult = Extract<ResultType, { dataType: "complex" }>

export const getRequestedPlotByNormalizedSpiceVector = ({
  spiceString,
  simulationOutputs,
}: {
  spiceString: string
  simulationOutputs: Array<RealDataType | ComplexDataType>
}): RequestedPlotByNormalizedSpiceVector => {
  const requestedPlotByNormalizedSpiceVector =
    extractRequestedPlots(spiceString)
  if (requestedPlotByNormalizedSpiceVector) {
    return requestedPlotByNormalizedSpiceVector
  }

  return new Map(
    simulationOutputs
      .filter(
        (simulationOutput) =>
          simulationOutput.type === "voltage" ||
          simulationOutput.type === "current",
      )
      .map((simulationOutput) => [
        normalizeSpiceVector(simulationOutput.name),
        simulationOutput.name,
      ]),
  )
}

export const getRealSampleMaps = (simulationOutputs: RealDataType[]) => {
  const voltageSamplesBySpiceVector: RealSamplesBySpiceVector = new Map(
    simulationOutputs
      .filter((simulationOutput) => simulationOutput.type === "voltage")
      .map((simulationOutput) => [
        normalizeSpiceVector(simulationOutput.name),
        simulationOutput.values,
      ]),
  )
  const currentSamplesBySpiceVector: RealSamplesBySpiceVector = new Map(
    simulationOutputs
      .filter((simulationOutput) => simulationOutput.type === "current")
      .map((simulationOutput) => [
        normalizeSpiceVector(simulationOutput.name),
        simulationOutput.values,
      ]),
  )
  return { voltageSamplesBySpiceVector, currentSamplesBySpiceVector }
}

export const getComplexSampleMaps = (simulationOutputs: ComplexDataType[]) => {
  const voltageSamplesBySpiceVector: ComplexSamplesBySpiceVector = new Map(
    simulationOutputs
      .filter((simulationOutput) => simulationOutput.type === "voltage")
      .map((simulationOutput) => [
        normalizeSpiceVector(simulationOutput.name),
        simulationOutput.values,
      ]),
  )
  const currentSamplesBySpiceVector: ComplexSamplesBySpiceVector = new Map(
    simulationOutputs
      .filter((simulationOutput) => simulationOutput.type === "current")
      .map((simulationOutput) => [
        normalizeSpiceVector(simulationOutput.name),
        simulationOutput.values,
      ]),
  )
  return { voltageSamplesBySpiceVector, currentSamplesBySpiceVector }
}

export const getRealVoltageSamples = ({
  normalizedSpiceVector,
  originalSpiceVector,
  voltageSamplesBySpiceVector,
}: {
  normalizedSpiceVector: NormalizedSpiceVector
  originalSpiceVector: SpiceVector
  voltageSamplesBySpiceVector: RealSamplesBySpiceVector
}): number[] | undefined => {
  const directVoltageSamples = voltageSamplesBySpiceVector.get(
    normalizedSpiceVector,
  )
  if (directVoltageSamples) return directVoltageSamples

  const differentialVoltageMatch = originalSpiceVector.match(
    /^v\(([^,]+),\s*([^)]+)\)$/i,
  )
  if (!differentialVoltageMatch?.[1] || !differentialVoltageMatch[2]) {
    return undefined
  }

  const positiveVoltageSamples = voltageSamplesBySpiceVector.get(
    normalizeSpiceVector(`v(${differentialVoltageMatch[1]})`),
  )
  const negativeVoltageSamples = voltageSamplesBySpiceVector.get(
    normalizeSpiceVector(`v(${differentialVoltageMatch[2]})`),
  )
  if (!positiveVoltageSamples || !negativeVoltageSamples) return undefined

  return positiveVoltageSamples.map(
    (positiveVoltage, sampleIndex) =>
      positiveVoltage - (negativeVoltageSamples[sampleIndex] ?? 0),
  )
}

export const getComplexVoltageSamples = ({
  normalizedSpiceVector,
  originalSpiceVector,
  voltageSamplesBySpiceVector,
}: {
  normalizedSpiceVector: NormalizedSpiceVector
  originalSpiceVector: SpiceVector
  voltageSamplesBySpiceVector: ComplexSamplesBySpiceVector
}): ComplexNumber[] | undefined => {
  const directVoltageSamples = voltageSamplesBySpiceVector.get(
    normalizedSpiceVector,
  )
  if (directVoltageSamples) return directVoltageSamples

  const differentialVoltageMatch = originalSpiceVector.match(
    /^v\(([^,]+),\s*([^)]+)\)$/i,
  )
  if (!differentialVoltageMatch?.[1] || !differentialVoltageMatch[2]) {
    return undefined
  }

  const positiveVoltageSamples = voltageSamplesBySpiceVector.get(
    normalizeSpiceVector(`v(${differentialVoltageMatch[1]})`),
  )
  const negativeVoltageSamples = voltageSamplesBySpiceVector.get(
    normalizeSpiceVector(`v(${differentialVoltageMatch[2]})`),
  )
  if (!positiveVoltageSamples || !negativeVoltageSamples) return undefined

  return positiveVoltageSamples.map((positiveVoltage, sampleIndex) => ({
    real:
      positiveVoltage.real - (negativeVoltageSamples[sampleIndex]?.real ?? 0),
    img: positiveVoltage.img - (negativeVoltageSamples[sampleIndex]?.img ?? 0),
  }))
}

export const toCircuitJsonComplexSamples = (complexSamples: ComplexNumber[]) =>
  complexSamples.map(({ real, img }) => ({ re: real, im: img }))
