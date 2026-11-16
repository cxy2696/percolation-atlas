# Reference examples in five languages

The same experiment in each reference edition. The browser runtime in `assets/js/engine` is not a reference edition; it is not shown here. draw 1000 bond configurations on a 64×64 square lattice at `p=1/2`, count left–right crossings, and print the rate. The answer is identical for the same seed; that is the parity contract.

## Python

```python
from percolation_atlas import Rng, build_lattice, Percolation

model = Percolation(build_lattice("square", 64), mode="bond")
rng = Rng(2024)
hits = sum(model.sample(0.5, rng).crosses_lr() for _ in range(1000))
print(hits / 1000)
```

## C++

```cpp
#include <percolation_atlas/atlas.hpp>
#include <iostream>

int main() {
  const auto lat = atlas::build_lattice("square", 64);
  atlas::Percolation model(lat, atlas::Mode::Bond);
  atlas::Rng rng(2024);
  int hits = 0;
  for (int i = 0; i < 1000; ++i) {
    model.sample(0.5, rng);
    if (model.crosses_lr()) ++hits;
  }
  std::cout << hits / 1000.0 << "\n";
}
```

Compile with `-std=c++20 -Ilib/cpp/include`.

## Julia

```julia
using PercolationAtlas

model = Percolation(build_lattice("square", 64), "bond")
rng = Rng(2024)
hits = 0
for _ in 1:1000
    sample!(model, 0.5, rng)
    hits += crosses_lr(model) ? 1 : 0
end
println(hits / 1000)
```

Run from the repository root with `julia --project=lib/julia`.

## Java

```java
import atlas.Lattice;
import atlas.Percolation;
import atlas.Rng;

public class Demo {
    public static void main(String[] args) {
        Lattice lattice = new Lattice("square", 64, false);
        Percolation model = new Percolation(lattice, "bond");
        Rng rng = new Rng(2024);
        int hits = 0;
        for (int i = 0; i < 1000; i++) {
            if (model.sample(0.5, rng).crossesLr()) hits++;
        }
        System.out.println(hits / 1000.0);
    }
}
```

Compile and run from the repository root:

```sh
javac -d /tmp/atlas-classes lib/java/src/atlas/*.java Demo.java
java -cp /tmp/atlas-classes Demo
```

Java implements the core sampler, DSU, lattice order and Newman–Ziff. The
directed, tree/epidemic and v3 algorithm routines are not part of the Java
edition; the site states that boundary explicitly.

## R

```r
source("lib/r/R/rng.R")
source("lib/r/R/lattice.R")
source("lib/r/R/percolation.R")

lat <- build_lattice("square", 64)
rng <- new_rng(2024)
hits <- 0L
for (i in 1:1000) {
  s <- percolation_sample(lat, 0.5, rng, "bond")
  if (crosses_lr(lat, s)) hits <- hits + 1L
}
cat(hits / 1000, "\n")
```

R covers the core sampler, lattice and Newman–Ziff. The v3 zoo and the tree/
message solvers are not ported to R; the site states that boundary.

## Directed percolation

The directed probe returns a reachable mask and a crossing flag. The call is
the same in Python, C++ and Julia; the browser runtime mirrors it for the interactive view. The mode is `"bond"` or `"site"`.

```python
directed_crossing(build_lattice("square", 32), 0.65, Rng(4242), "bond")["cross"]
```

```cpp
atlas::directed_crossing(atlas::build_lattice("square", 32), 0.65, rng, false).cross
```

```julia
directed_crossing(build_lattice("square", 32), 0.65, Rng(4242); mode = "bond").cross
```

## API names

| concept | Python | C++ | Julia | Java |
|---|---|---|---|---|
| --- | --- | --- | --- | --- |
| generator | `Rng` | `atlas::Rng` | `Rng` | `Rng` |
| lattice | `build_lattice(kind, L, torus)` | `atlas::build_lattice(kind, L, torus)` | `build_lattice(kind, L; torus)` | `new Lattice(kind, L, torus)` |
| model | `Percolation(lat, mode)` | `atlas::Percolation(lat, mode)` | `Percolation(lat, mode)` | `new Percolation(lat, mode)` |
| sample | `sample(p, rng)` | `sample(p, rng)` | `sample!(model, p, rng)` | `sample(p, rng)` |
| crossing | `crosses_lr()` | `crosses_lr()` | `crosses_lr(model)` | `crossesLr()` |
| Newman–Ziff | `newman_ziff(lat, rng)` | `atlas::newman_ziff(lat, rng)` | `newman_ziff(lat, rng)` | `newmanZiffSmax(lat, rng, cp)` |
| directed | `directed_crossing(lat, p, rng, mode)` | `atlas::directed_crossing(lat, p, rng, site)` | `directed_crossing(lat, p, rng; mode)` | — |

The RNG and observation order are documented in `docs/RNG.md`; the full API is in `docs/API.md`.

## Algorithm zoo: bootstrap, invasion and the Achlioptas process

The zoo and the v4 solvers are exposed in Python, C++ and Julia; the browser runtime mirrors them for the laboratories. They share the Dsu and
Rng types with the core, and their parity file is
`data/golden/algorithms-v3.json`.

```python
from percolation_atlas import (
    Rng, build_lattice, bootstrap_lattice,
    invasion_percolation, explosive_random_graph,
)

lat = build_lattice("square", 64)
rng = Rng(11)
occupied = [1 if rng.random() < 0.55 else 0 for _ in range(lat.n)]
boot = bootstrap_lattice(lat, occupied, r=3)
print(boot.fraction, len(boot.rounds))       # ~0.7, a handful of rounds

inv = invasion_percolation(lat.n, lat.eu, lat.ev, seed=0, rng_seed=5)
print(inv.size, inv.last_threshold, inv.loops)

ex = explosive_random_graph(2000, rule="product", seed=7)
print(ex.points[-1]["smax"], ex.max_jump)
```


The CLI produces the same numbers:

```sh
atlas-perc bootstrap --L 64 --p 0.55 --r 3 --seed 11
atlas-perc invasion --L 64 --seed 3
atlas-perc explosive --n 2000 --rule product --seed 7
```

## Trees and the SIR final size

The same fixed point in Python, C++ and Julia. The values are the golden probes in
`data/golden/algorithms-v3.json`.

```python
from percolation_atlas import bethe_percolation, poisson_pmf, sir_final_size
print(bethe_percolation(3, 0.6).theta)                 # 0.7037037037...
print(sir_final_size(poisson_pmf(2), 1).final_size)    # 0.7968121300...
```

```cpp
#include <percolation_atlas/atlas.hpp>
#include <iostream>
int main() {
  std::cout << atlas::bethe_percolation(3, 0.6).theta << "\n";
  std::cout << atlas::sir_final_size(atlas::poisson_pmf(2), 1.0).final_size << "\n";
}
```

```julia
using PercolationAtlas
println(bethe_percolation(3, 0.6).theta)
println(sir_final_size(poisson_pmf(2), 1.0).final_size)
```

## Site Newman–Ziff and message passing

```python
from percolation_atlas import Rng, build_lattice, newman_ziff_site, message_passing_percolation
z = newman_ziff_site(build_lattice("square", 8), Rng(5), checkpoints=16)
print(z["smax"][-1])                                    # 64
eu = [(i, j) for i in range(5) for j in range(i + 1, 5)]
print(message_passing_percolation(5, [a for a, _ in eu], [b for _, b in eu], 0.4)["S"])
```

The K5 edge list is every unordered pair of five vertices. The golden probes
are `nz_site_square8_seed5_cp16` and `message_k5_T04` in
`data/golden/algorithms-v3.json`.