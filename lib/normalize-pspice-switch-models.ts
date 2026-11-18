import {
  Model,
  parseSpiceNetlist,
  type SpiceNode,
  tokenizeSpice,
} from "spicets"

const getSwitchModels = (node: SpiceNode): Model[] =>
  node.getChildren().flatMap((child) => {
    if (child instanceof Model && child.modelType.toLowerCase() === "vswitch") {
      return [child]
    }
    return getSwitchModels(child)
  })

export const normalizePspiceSwitchModels = (spiceString: string): string => {
  const netlist = parseSpiceNetlist(spiceString)
  let normalizedSource = spiceString

  for (const model of getSwitchModels(netlist)) {
    const ron = model.params.get("ron")?.getString()
    const roff = model.params.get("roff")?.getString()
    const von = model.params.get("von")?.getString()
    const voff = model.params.get("voff")?.getString()
    if (!ron || !roff || !von || !voff || !model.originalSource) continue

    const ronTokens = tokenizeSpice(ron).tokens
    const roffTokens = tokenizeSpice(roff).tokens
    const ronToken = ronTokens[0]
    const roffToken = roffTokens[0]
    if (
      ronTokens.length === 1 &&
      roffTokens.length === 1 &&
      ronToken?.type === "number" &&
      roffToken?.type === "number" &&
      ronToken.value !== null &&
      roffToken.value !== null &&
      ronToken.value <= roffToken.value
    ) {
      continue
    }

    // ngspice's aswitch limiter assumes RON <= ROFF. Swapping both endpoint
    // pairs preserves the same resistance-versus-control curve.
    model.params.set("ron", `{min(${ron},${roff})}`)
    model.params.set("roff", `{max(${ron},${roff})}`)
    model.params.set("von", `{if(${ron}>${roff},${voff},${von})}`)
    model.params.set("voff", `{if(${ron}>${roff},${von},${voff})}`)
    normalizedSource = normalizedSource.replace(model.originalSource, () =>
      model.toSource({ format: "pretty" }),
    )
  }

  return normalizedSource
}
