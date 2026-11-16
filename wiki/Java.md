# Java

The Java edition is a dependency-free Java 17 implementation of the core
engine. It is deliberately smaller than the JavaScript/Python algorithm zoo.

## What it contains

| Class | Purpose |
|---|---|
| `Rng` | xoshiro128** with SplitMix32 seeding; same stream as the other editions |
| `Dsu` | union by size with full path compression |
| `Lattice` | square, triangular and honeycomb edge order |
| `Percolation` | site/bond sampling, cluster statistics, left–right and top–bottom crossing, Newman–Ziff sweep |
| `Parity` | golden checks for the RNG, crossing counts and Newman–Ziff checkpoints |

Source: `lib/java/src/atlas/`.

## Run

```sh
make -C lib/java test
# or
make test-java
```

The test prints:

```text
java parity: RNG, square bond, triangular site, Newman-Ziff ok
```

## Scope

Java covers the **Bernoulli core and Newman–Ziff**, not bootstrap, invasion,
Leath or Achlioptas. The v3 zoo keeps its Python + JavaScript contract; C++
and Julia retain their regression ports. The source browser and the README
state this boundary rather than implying that every language implements every
routine.

## What is checked

- seed-42 RNG doubles and integers;
- 10 000-draw sum and FNV hash;
- square-lattice bond crossing at `p = 1/2` (500 samples, seed 1234);
- triangular-lattice site crossing at `p = 1/2` (300 samples, seed 777);
- Newman–Ziff `S_max` checkpoints (square 16, seed 5, 64 checkpoints).

The expected values are the same `data/golden/parity.json` probes used by the
other suites.
