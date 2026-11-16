# Reading the algorithm code

This note is a companion to the site's **Algorithms** view. It explains what
each routine is responsible for, where the real code lives, and which property
makes it correct. The source is the authority; this page is a map.

The shared conventions are:

- a lattice is a CSR edge list with `n` sites and `m` undirected edges;
- a DSU owns the component partition and the counters `count` and `maxSize`;
- the random stream is xoshiro128** with the consumption order documented in
  [`RNG.md`](RNG.md);
- a parity test compares integers and exact component sizes, not statistical
  summaries.

The core sampler, DSU and Newman–Ziff routines have C++, Python, Julia, Java and R implementations. The dynamics, labels, tree and message routines have C++, Python and Julia implementations. JavaScript is the browser runtime under `assets/js/engine`, not a reference edition; it is not listed as an algorithm source. The exact source and test paths are in `content/algorithms.json`.

## 1. Bernoulli sampler

`lib/python/percolation_atlas/percolation.py` · `lib/cpp/include/percolation_atlas/percolation.hpp` · `lib/julia/src/percolation.jl` · `lib/java/src/atlas/Percolation.java` · `lib/r/R/percolation.R`

The sampler walks sites (site mode) or edges (bond mode) in a fixed order and
draws one uniform per element. Closed elements still consume a draw. That is
why the stream position after `sample(p, rng)` is predictable and why the
four implementations can agree bit for bit.

After the loop the occupancy/open arrays are independent Bernoulli variables,
and the DSU holds the connected components of the occupied/open subgraph.

Common mistakes: mixing the two modes, skipping draws for closed elements, or
using the number of occupied sites as the denominator of a bond observable.
Each changes the number while leaving the picture plausible.

## 2. Union–find

`lib/python/percolation_atlas/percolation.py` · `lib/cpp/include/percolation_atlas/percolation.hpp` · `lib/julia/src/percolation.jl` · `lib/java/src/atlas/Dsu.java` · `lib/r/R/percolation.R`

`find` walks to the root and compresses the path. `union` attaches the smaller
root under the larger and updates `size`, `count` and `maxSize`. The depth is
`O(log n)` from union by size alone; full path compression adds the
amortised inverse-Ackermann bound. Either optimisation alone is weaker.

`count` and `maxSize` are maintained inside `union`, because every observable
needs them. A separate pass over the roots is fine for a diagnostic, not for a
hot loop.

## 3. Newman–Ziff

`lib/python/percolation_atlas/percolation.py` · `lib/cpp/include/percolation_atlas/percolation.hpp` · `lib/julia/src/percolation.jl` · `lib/java/src/atlas/Percolation.java` · `lib/r/R/percolation.R`

Shuffle the edge indices once. Add them one at a time. After `k` edges the open
set is a uniform `k`-subset, so it is a sample of bond percolation at
`p = k/m`. The nested samples are the point of the algorithm: one order gives
the whole curve.

When components of sizes `a` and `b` merge, `M₂` increases by `2ab`. That is
exact for the sampled configuration. The cost is `O(m α(n))` time and
`O(n + m)` memory. The price is correlation: points along one sweep are not
independent, so error bars need independent edge orders.

Two details are easy to get wrong: record the observables *after* the union,
and do not treat the `m` plotted points as `m` independent samples.

## 4. Site Newman–Ziff

`lib/python/percolation_atlas/percolation.py` · `lib/cpp/include/percolation_atlas/percolation.hpp` · `lib/julia/src/percolation.jl` · `lib/java/src/atlas/Percolation.java` · `lib/r/R/percolation.R`

The site sweep adds vertices rather than edges. Draw one random order of the
`n` sites, occupy them one at a time, and union each new site with the
neighbours that have already appeared. After `k` sites the occupied set is a
uniform `k`-subset, so the state is a site-percolation sample at `p = k/n`.
Edges are never sampled; the random stream depends on `n`, not on `m`. The
reported `chi2` uses `M₂/n` so the curve is comparable with the bond sweep.

## 5. Leath growth

`lib/python/percolation_atlas/algorithms.py` · `lib/cpp/include/percolation_atlas/algorithms.hpp` · `lib/julia/src/algorithms.jl`

Start at a seed. Test each edge incident to a visited site exactly once. An open
edge to an unvisited site is explored; a closed edge is perimeter. The visited
set is exactly the cluster of the seed, conditional on the seed being occupied.

The `tested` array is the guard that makes the exploration proportional to
the touched boundary instead of the box, after a one-time O(n + m) CSR build.
The optional `maxSize` cutoff is soft: it can overshoot by a frontier and
truncates the tail. That is a bias, not a neutral optimisation.

## 6. Bootstrap closure

`lib/python/percolation_atlas/algorithms.py` · `lib/cpp/include/percolation_atlas/algorithms.hpp` · `lib/julia/src/algorithms.jl`

The update rule is monotone, so the final set is the least fixed point and is
independent of the order in which sites are considered. The queue version
keeps two frontiers: sites that became active in round `t`, and sites that
reach the threshold while processing that frontier. The second group is
activated in round `t+1`, never in `t`. That synchronisation is the whole
correctness argument.

For `r = 2` on the square lattice the infinite-lattice threshold is zero; a
finite box fills above a crossover that depends on `L`. For `r = 3` and `r = 4`
the threshold is positive. The experiment states this rather than treating the
finite-size onset as a material constant.

## 7. Invasion percolation

`lib/python/percolation_atlas/algorithms.py` · `lib/cpp/include/percolation_atlas/algorithms.hpp` · `lib/julia/src/algorithms.jl`

Each edge has an i.i.d. threshold. A min-heap holds the boundary. Popping the
smallest key and accepting the edge when it reaches an unvisited site is the
definition of the process, not an approximation to Bernoulli percolation. The
accepted edges form a spanning tree of the invaded region.

Rejected loop edges are recorded once, through `loopSeen`; without that guard
an edge with two visited endpoints is pushed twice and the loop count roughly
doubles. The sequence of accepted thresholds is not monotone: a newly exposed
edge can be cheaper than the last accepted one. This is ordinary invasion with
loop rejection, not the trapping variant used for defending clusters.

## 8. Achlioptas process

`lib/python/percolation_atlas/algorithms.py` · `lib/cpp/include/percolation_atlas/algorithms.hpp` · `lib/julia/src/algorithms.jl`

Two candidates are drawn; the product rule keeps the one whose endpoint
component sizes have the smaller product (the sum rule is the weaker control).
The DSU state after each step is the component partition of the chosen edges,
so the trajectory is a deterministic function of the candidate sequence.

The visible jump is a finite-size effect. The product rule is continuous in
the thermodynamic limit; the laboratory's scaling table shows the difference.
Duplicate candidate pairs count as additions but do not merge components, and
`q = steps / n` is the right horizontal axis for this sampling scheme.

## 9. k-core peeling

`lib/python/percolation_atlas/network.py` · `lib/cpp/include/percolation_atlas/network.hpp` · `lib/julia/src/network.jl`

The k-core is the largest induced subgraph with minimum degree at least k. It
is obtained by repeatedly deleting vertices whose current degree is below k.
The result is unique, so the deletion order cannot change it.

The degree array counts active neighbours, not all neighbours in the original
graph. The queue must be a growable list: a vertex can be queued again after
each of its neighbours is peeled. A fixed array of length `n` silently drops
writes and leaves a non-k-core behind — that was a real regression in the
first edition. The cost is `O(n + m)` time; the queue can hold more than `n` entries, so worst-case auxiliary memory is `O(n + m)`.

## 10. Hoshen–Kopelman labelling

`lib/python/percolation_atlas/algorithms.py` · `lib/cpp/include/percolation_atlas/algorithms.hpp` · `lib/julia/src/algorithms.jl`

The scan visits the edge list once and unions an open edge whose two endpoints
are present. Labels are compressed in a final pass: a vertex's label is its
DSU root. In site mode an inactive vertex receives `-1`; treating it as its
own singleton is the classic error that inflates the cluster count. The
routine is `O((n + m) α(n))` time and `O(n)` memory.

The golden probe `labels_square6_p05_seed42` pins the full label array, not
just the count, because two implementations can agree on the count and
disagree on which vertices belong together.

## 11. Bethe fixed point

`lib/python/percolation_atlas/trees.py` · `lib/cpp/include/percolation_atlas/algorithms.hpp` · `lib/julia/src/algorithms.jl`

On the z-regular tree, `u = (1 - p + pu)^(z-1)` and
`θ = 1 - (1 - p + pu)^z`. The physical solution is the smallest fixed point;
bisection on the first sign change selects it. The threshold is exactly
`1/(z-1)`. Above `p_c` the mean cluster size including the infinite cluster is
infinite, so `chi` is reported as infinity rather than as a negative number
from the subcritical formula.

## 12. SIR final size

`lib/python/percolation_atlas/trees.py` · `lib/cpp/include/percolation_atlas/algorithms.hpp` · `lib/julia/src/algorithms.jl`

The final size is the configuration-model fixed point
`S = 1 - G0(1 - T + Tu)`, `u = G1(1 - T + Tu)`. The solver takes the smallest
root; iterating from `u = 0` converges to it, while starting from `u = 1`
stays at the trivial root and reports zero. The routine also
returns `R0 = T(κ-1)`, `T_c = 1/(κ-1)` and the herd-immunity fraction
`1 - 1/R0`. It is the same computation as the giant component, with the
transmissibility interpretation of Chapter 23.

## 13. Message passing

`lib/python/percolation_atlas/message.py` · `lib/cpp/include/percolation_atlas/algorithms.hpp` · `lib/julia/src/algorithms.jl`

Cavity messages solve `u[i→j] = Π_{k≠j}(1 − T + T u[k→i])`. On a tree the
factorisation is exact; on a graph with cycles it is the Bethe approximation,
controlled by the density of short loops. The implementation stores the
opposite half-edge in a `mate` array, computes each vertex's excluded product
with a prefix/suffix scan in `O(deg)`, and starts from zero to select the
physical fixed point. Reading and writing the same half-edge instead of its
mate reverses every message — the classic sign error.

## Tests and goldens

| Claim | Check |
|---|---|
| RNG stream | `data/golden/rng-seed42.json` |
| core parity | `data/golden/parity.json`, `scripts/parity.py` |
| algorithm zoo, v4 solvers, site sweep, message passing | `data/golden/algorithms-v3.json`; the exact suite for each probe is listed in `content/algorithms.json` |
| least fixed point | `lib/python/tests/test_algorithms.py` (naive closure comparison) |
| invasion tree | `lib/python/tests/test_algorithms.py` (spanning-tree count) |
| Leath extremes | `lib/python/tests/test_algorithms.py` (`p = 0`, `p = 1`) |

If you change an algorithm, change the golden file and the version, and say in
the changelog what moved. A change that "looks harmless" in the random order
will move every downstream number.
