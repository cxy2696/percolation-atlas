source(file.path("R", "rng.R"))
source(file.path("R", "lattice.R"))
source(file.path("R", "percolation.R"))
source(file.path("R", "labeling.R"))
source(file.path("R", "kcore.R"))

# seed-42 RNG
r <- new_rng(42)
expected <- c(0.15377165154351735, 0.018084544121180213, 0.5348906350361368,
              0.7272476917564136, 0.572911021218635, 0.2877089619804075,
              0.8504471575585412, 0.30334379811845724)
got <- vapply(1:8, function(i) rng_random(r), numeric(1))
stopifnot(isTRUE(all.equal(got, expected, tolerance = 0)))

# square bond, 32x32, 500 samples, seed 1234
lat <- build_lattice("square", 32)
r <- new_rng(1234)
hits <- 0L
for (i in 1:500) if (crosses_lr(lat, percolation_sample(lat, 0.5, r, "bond"))) hits <- hits + 1L
stopifnot(hits == 244L)

# triangular site, 16x16, 300 samples, seed 777
lat <- build_lattice("triangular", 16)
r <- new_rng(777)
hits <- 0L
for (i in 1:300) if (crosses_lr(lat, percolation_sample(lat, 0.5, r, "site"))) hits <- hits + 1L
stopifnot(hits == 151L)

# Newman-Ziff, square 16, seed 5, 64 checkpoints
lat <- build_lattice("square", 16)
z <- newman_ziff(lat, new_rng(5), 64)
idx <- c(length(z) %/% 4 + 1L, length(z) %/% 2 + 1L, length(z))
stopifnot(identical(as.integer(z[idx]), c(10L, 109L, 256L)))

# Hoshen–Kopelman labels, square 6 bond p=0.5 seed 42
lat <- build_lattice("square", 6)
s <- percolation_sample(lat, 0.5, new_rng(42), "bond")
lab <- label_clusters(lat$n, lat$eu, lat$ev, open_edges = s$open)
stopifnot(lab$count == 6L, lab$max_size == 30L)

# K4 plus a pendant vertex: k=2 and k=3 keep the K4, k=4 removes it.
eu <- c(1, 1, 1, 2, 2, 3, 4)
ev <- c(2, 3, 4, 3, 4, 4, 5)
stopifnot(kcore(5, eu, ev, 2)$size == 4L)
stopifnot(kcore(5, eu, ev, 3)$size == 4L)
stopifnot(kcore(5, eu, ev, 4)$size == 0L)

cat("R parity: RNG, square bond, triangular site, Newman-Ziff, labels, k-core ok\n")
