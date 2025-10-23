# @tscircuit/ngspice-spice-engine

A tscircuit-compatible SPICE engine using ngspice.

```tsx
import ngspiceSpiceEngine from "@tscircuit/ngspice-spice-engine"
import { Circuit } from "tscircuit"

const circuit = new Circuit({
  platform: {
    spiceEngineMap: {
      ngspice: ngspiceSpiceEngine
    }
  }
})
```
