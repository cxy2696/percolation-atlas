# Lattice generators with 1-based vertex numbers (R convention).
# The edge order is the same as the other editions: E, S, (SW).

build_lattice <- function(kind = c("square", "triangular", "honeycomb"),
                          L, torus = FALSE) {
  kind <- match.arg(kind)
  if (L < 1) stop("L must be positive")
  if (kind == "honeycomb" && (L %% 2 != 0 || L < 6)) {
    stop("honeycomb needs even L >= 6")
  }
  idx <- function(i, j) ((i %% L) * L + (j %% L)) + 1L
  eu <- integer(0); ev <- integer(0); etype <- integer(0)
  add <- function(a, b, t) {
    eu[[length(eu) + 1L]] <<- a
    ev[[length(ev) + 1L]] <<- b
    etype[[length(etype) + 1L]] <<- t
  }
  for (i in 0:(L - 1)) {
    for (j in 0:(L - 1)) {
      v <- i * L + j + 1L
      if (kind == "honeycomb") {
        if ((i + j) %% 2 == 0 && (j + 1 < L || torus)) add(v, idx(i, j + 1), 0L)
        if (i + 1 < L || torus) add(v, idx(i + 1, j), 1L)
        next
      }
      if (j + 1 < L || torus) add(v, idx(i, j + 1), 0L)
      if (i + 1 < L || torus) add(v, idx(i + 1, j), 1L)
      if (kind == "triangular" && (i + 1 < L || torus) && (j - 1 >= 0 || torus)) {
        add(v, idx(i + 1, j - 1), 2L)
      }
    }
  }
  list(kind = kind, L = L, n = L * L, m = length(eu),
       eu = eu, ev = ev, etype = etype, torus = torus)
}
