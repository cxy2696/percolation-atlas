# R

The R edition is a base-R implementation of the core sampler and Newman–Ziff.
It uses the same xoshiro128** stream, lattice edge order and crossing
definitions as the other reference editions. No package outside base R is
required.

## What it contains

| File | Purpose |
|---|---|
| `R/rng.R` | xoshiro128** with SplitMix32; 16-bit splitting for 32-bit multiplication |
| `R/lattice.R` | square, triangular and honeycomb edge lists (1-based R indices) |
| `R/percolation.R` | DSU, site/bond sampling, cluster statistics, crossing and Newman–Ziff |
| `tests/test-parity.R` | RNG, square bond, triangular site and Newman–Ziff golden checks |

Source: `lib/r/`.

## Run

```sh
make -C lib/r test
# or
make test-r
```

The test prints:

```text
R parity: RNG, square bond, triangular site, Newman-Ziff ok
```

## Scope

R covers the **core sampler and Newman–Ziff**. The v3 bootstrap, invasion,
Leath and Achlioptas routines and the tree/message solvers are not ported to R.
The browser runtime is separate, under `assets/js/engine`; it is not a
reference edition.

## What is checked

- seed-42 RNG doubles;
- 32×32 square bond crossing, 500 samples, seed 1234 → 244;
- 16×16 triangular site crossing, 300 samples, seed 777 → 151;
- square 16 Newman–Ziff, seed 5, 64 checkpoints → 10, 109, 256.

The same values are in `data/golden/parity.json` and are asserted by the other
reference suites.
