# Site/bond Bernoulli percolation, cluster statistics and Newman-Ziff.

new_dsu <- function(n) {
  e <- new.env(parent = emptyenv())
  e$parent <- seq_len(n)
  e$size <- rep.int(1L, n)
  e$count <- n
  e$max_size <- if (n) 1L else 0L
  e
}

dsu_find <- function(e, x) {
  p <- e$parent
  root <- x
  while (p[root] != root) root <- p[root]
  while (p[x] != root) {
    nxt <- p[x]; p[x] <- root; x <- nxt
  }
  e$parent <- p
  root
}

dsu_union <- function(e, a, b) {
  ra <- dsu_find(e, a); rb <- dsu_find(e, b)
  if (ra == rb) return(FALSE)
  if (e$size[ra] < e$size[rb]) { t <- ra; ra <- rb; rb <- t }
  e$parent[rb] <- ra
  e$size[ra] <- e$size[ra] + e$size[rb]
  e$count <- e$count - 1L
  if (e$size[ra] > e$max_size) e$max_size <- e$size[ra]
  TRUE
}

percolation_sample <- function(lat, p, rng, mode = c("bond", "site")) {
  mode <- match.arg(mode)
  if (mode == "site") {
    occ <- vapply(seq_len(lat$n), function(i) rng_random(rng) < p, logical(1))
    open <- rep.int(TRUE, lat$m)
  } else {
    occ <- rep.int(TRUE, lat$n)
    open <- vapply(seq_len(lat$m), function(i) rng_random(rng) < p, logical(1))
  }
  list(occ = occ, open = open)
}

percolation_dsu <- function(lat, sample) {
  d <- new_dsu(lat$n)
  active <- sum(sample$occ)
  d$count <- as.integer(active)
  d$max_size <- if (active > 0) 1L else 0L
  for (e in seq_len(lat$m)) {
    a <- lat$eu[e]; b <- lat$ev[e]
    if (sample$open[e] && sample$occ[a] && sample$occ[b]) dsu_union(d, a, b)
  }
  d
}

percolation_stats <- function(lat, sample) {
  d <- percolation_dsu(lat, sample)
  roots <- integer(0)
  sizes <- integer(0)
  for (v in seq_len(lat$n)) {
    if (!sample$occ[v]) next
    r <- dsu_find(d, v)
    k <- match(r, roots)
    if (is.na(k)) { roots <- c(roots, r); sizes <- c(sizes, 1L) }
    else sizes[k] <- sizes[k] + 1L
  }
  sizes <- sort(sizes, decreasing = TRUE)
  list(count = length(sizes), max_size = if (length(sizes)) sizes[1] else 0L,
       total = sum(sizes), total2 = sum(sizes^2), sizes = sizes)
}

crosses_lr <- function(lat, sample) {
  d <- percolation_dsu(lat, sample)
  left <- logical(lat$n)
  for (i in 0:(lat$L - 1)) {
    v <- i * lat$L + 1L
    if (sample$occ[v]) left[dsu_find(d, v)] <- TRUE
  }
  for (i in 0:(lat$L - 1)) {
    v <- i * lat$L + lat$L
    if (sample$occ[v] && left[dsu_find(d, v)]) return(TRUE)
  }
  FALSE
}

newman_ziff <- function(lat, rng, checkpoints = 400) {
  if (checkpoints < 1) stop("checkpoints must be positive")
  order <- rng_shuffle(rng, seq_len(lat$m))
  d <- new_dsu(lat$n)
  every <- max(1L, lat$m %/% checkpoints)
  smax <- numeric(0)
  for (k in seq_along(order)) {
    e <- order[k]
    dsu_union(d, lat$eu[e], lat$ev[e])
    if (k %% every == 0 || k == lat$m) smax <- c(smax, d$max_size)
  }
  smax
}
