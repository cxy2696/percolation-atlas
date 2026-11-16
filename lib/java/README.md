# Java edition

A dependency-free Java 17 implementation of the core engine:

- `Rng` — xoshiro128** with SplitMix32 seeding, the same stream as the other
  editions;
- `Dsu` — union by size with full path compression;
- `Lattice` — square, triangular and honeycomb edge lists in the shared order;
- `Percolation` — site/bond sampling, cluster statistics, left–right and
  top–bottom crossing, and the Newman–Ziff edge sweep;
- `Parity` — golden checks for the RNG, square bond crossing, triangular site
  crossing and the Newman–Ziff checkpoints.

Build and run:

```sh
make -C lib/java test
```

Scope note: Java implements the **Bernoulli core and Newman–Ziff**, not the
bootstrap/invasion/Achlioptas zoo. The v3 zoo's cross-language contract is
Python + JavaScript; C++ and Julia have regression ports in the v4 suite. The
site states this rather than calling all five editions identical.
