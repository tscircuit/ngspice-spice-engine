import { CurrentSource, parseSpiceNetlist, type SpiceNode } from "spicets"

const getCurrentSources = (node: SpiceNode): CurrentSource[] =>
  node.getChildren().flatMap((child) => {
    if (child instanceof CurrentSource) return [child]
    return getCurrentSources(child)
  })

export const rewritePspiceCurrentSourceUnits = (
  spiceString: string,
): string => {
  const netlist = parseSpiceNetlist(spiceString)
  let rewrittenSource = spiceString

  for (const source of getCurrentSources(netlist)) {
    const current = source.dc?.getString()
    if (
      !current ||
      !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:meg|mil|[tgkmunpfa])?Adc$/i.test(
        current,
      ) ||
      !source.originalSource
    ) {
      continue
    }

    // PSpice's explicit ampere unit must not become ngspice's atto prefix.
    source.dc!.raw = current.slice(0, -3)
    rewrittenSource = rewrittenSource.replace(source.originalSource, () =>
      source.toSource({ format: "pretty" }),
    )
  }

  return rewrittenSource
}
