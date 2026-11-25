import { expect, test } from "bun:test"
import { linearInterpolate } from "../lib/linear-interpolate"

test.each([
  { targetX: 0, xPoints: [], yPoints: [], expected: 0 },
  { targetX: 2, xPoints: [1], yPoints: [7], expected: 7 },
  { targetX: -1, xPoints: [0, 1, 3], yPoints: [0, 10, 30], expected: 0 },
  { targetX: 0.5, xPoints: [0, 1, 3], yPoints: [0, 10, 30], expected: 5 },
  { targetX: 2, xPoints: [0, 1, 3], yPoints: [0, 10, 30], expected: 20 },
  { targetX: 4, xPoints: [0, 1, 3], yPoints: [0, 10, 30], expected: 30 },
  { targetX: 1, xPoints: [0, 1, 1, 2], yPoints: [0, 10, 11, 20], expected: 10 },
  {
    targetX: 1.5,
    xPoints: [0, 1, 1, 2],
    yPoints: [0, 10, 11, 20],
    expected: 15.5,
  },
])(
  "interpolates $targetX in $xPoints",
  ({ targetX, xPoints, yPoints, expected }) => {
    expect(linearInterpolate(targetX, [...xPoints], [...yPoints])).toBe(
      expected,
    )
  },
)
