# R edition

A base-R implementation of the core sampler and Newman–Ziff. It uses the same
xoshiro128** stream, lattice edge order and crossing definitions as the other
reference editions; no package outside base R is required.

- `R/rng.R` — xoshiro128** with SplitMix32, using 16-bit splitting for 32-bit
  multiplication;
- `R/lattice.R` — square, triangular and honeycomb edge lists (1-based R
  indices, same construction order);
- `R/percolation.R` — DSU, site/bond sampling, cluster statistics, left–right
  crossing and the Newman–Ziff sweep;
- `tests/test-parity.R` — RNG, square bond, triangular site and Newman–Ziff
  golden checks.

Run:

```sh
make -C lib/r test
# or
make test-r
```

Scope: R covers the core sampler and Newman–Ziff. The v3 bootstrap/invasion/
Leach/Achlioptas zoo and the tree/message solvers are not ported to R; the
site states this boundary rather than showing an empty file.
