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
  let upperIndex = xPoints.length - 1
  while (i < upperIndex) {
    const middleIndex = Math.floor((i + upperIndex) / 2)
    if (xPoints[middleIndex]! < targetX) {
      i = middleIndex + 1
    } else {
      upperIndex = middleIndex
    }
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
