import { describe, expect, test } from "bun:test"
import { parseTranParams } from "../lib"

describe("parseTranParams", () => {
  test("parses standard tran command", () => {
    const result = parseTranParams(`
* comment line
.TRAN 1ms 10ms 0ms 1ms UIC
V1 in 0 PULSE(0 5 0 1n 1n 5ms 10ms)
`)

    expect(result).toEqual({
      tstep: 0.001,
      tstop: 0.01,
      tstart: 0,
      tmax: 0.001,
      uic: true,
    })
  })

  test("returns null when no tran statement is present", () => {
    const result = parseTranParams(`
* circuit without transient analysis
V1 in 0 DC 5
`)

    expect(result).toBeNull()
  })

  test("ignores unparseable tokens", () => {
    const result = parseTranParams(`
.tran 0.1u 1m foo
`)

    expect(result).toEqual({
      tstep: 1e-7,
      tstop: 0.001,
    })
  })
})
