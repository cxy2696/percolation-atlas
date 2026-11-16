# Connected-component labelling in edge-scan order (Hoshen–Kopelman graph form).
# Vertices and edge arrays use R's 1-based convention.

label_clusters <- function(n, eu, ev, active = NULL, open_edges = NULL) {
  present <- if (is.null(active)) rep(TRUE, n) else as.logical(active)
  d <- new_dsu(n)
  d$count <- sum(present)
  d$max_size <- if (d$count > 0) 1L else 0L
  for (e in seq_along(eu)) {
    if (!is.null(open_edges) && !open_edges[e]) next
    a <- eu[e]; b <- ev[e]
    if (present[a] && present[b]) dsu_union(d, a, b)
  }
  labels <- rep.int(-1L, n)
  sizes <- integer(n)
  for (v in seq_len(n)) {
    if (!present[v]) next
    r <- dsu_find(d, v)
    labels[v] <- r
    sizes[r] <- sizes[r] + 1L
  }
  list(labels = labels, sizes = sizes,
       count = sum(sizes > 0), max_size = if (any(sizes > 0)) max(sizes) else 0L)
}
