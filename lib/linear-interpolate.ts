export const linearInterpolate = (
  targetX: number,
  xPoints: number[],
  yPoints: number[],
): number => {
  if (xPoints.length === 0) {
    return 0
  }
  if (targetX <= xPoints[0]!) {
    return yPoints[0]!
  }
  if (targetX >= xPoints[xPoints.length - 1]!) {
    return yPoints[yPoints.length - 1]!
  }
  let i = 1
  while (i < xPoints.length && xPoints[i]! < targetX) {
    i++
  }
  const x1 = xPoints[i - 1]!
  const y1 = yPoints[i - 1]!
  const x2 = xPoints[i]!
  const y2 = yPoints[i]!
  if (x2 === x1) {
    return y1
  }
  return y1 + ((y2 - y1) * (targetX - x1)) / (x2 - x1)
}
