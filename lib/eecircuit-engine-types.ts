export type ComplexNumber = {
  real: number
  img: number
}

export type RealDataType = {
  name: string
  type: "voltage" | "current" | "time" | "frequency" | "notype"
  values: number[]
}

export type ComplexDataType = {
  name: string
  type: RealDataType["type"]
  values: ComplexNumber[]
}

export type ResultType =
  | {
      header: string
      numVariables: number
      variableNames: string[]
      numPoints: number
      dataType: "real"
      data: RealDataType[]
    }
  | {
      header: string
      numVariables: number
      variableNames: string[]
      numPoints: number
      dataType: "complex"
      data: ComplexDataType[]
    }

export type Simulation = {
  start: () => Promise<void>
  runSim: () => Promise<ResultType>
  setNetList: (input: string) => void
  setNgBehavior: (ngBehavior: string | null) => void
  getInfo: () => string
  getInitInfo: () => string
  getError: () => string[]
  isInitialized: () => boolean
}

export type SimulationConstructor = new (options?: {
  ngBehavior?: string
}) => Simulation
