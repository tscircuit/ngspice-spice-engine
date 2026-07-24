import type { ComplexNumber } from "./eecircuit-engine-types"
import type { NormalizedSpiceVector } from "./extract-requested-plots"

export type RealSamplesBySpiceVector = Map<NormalizedSpiceVector, number[]>
export type ComplexSamplesBySpiceVector = Map<
  NormalizedSpiceVector,
  ComplexNumber[]
>
