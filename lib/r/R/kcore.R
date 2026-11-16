# k-core peeling.  Vertices and edges are 1-based; active defaults to all.

kcore <- function(n, eu, ev, k, active = NULL) {
  if (k < 0) stop("k must be non-negative")
  alive <- if (is.null(active)) rep(TRUE, n) else as.logical(active)
  adj <- vector("list", n)
  for (e in seq_along(eu)) {
    a <- eu[e]; b <- ev[e]
    if (alive[a] && alive[b]) {
      adj[[a]] <- c(adj[[a]], b)
      adj[[b]] <- c(adj[[b]], a)
    }
  }
  deg <- vapply(adj, length, integer(1))
  queue <- which(alive & deg < k)
  head <- 1L
  while (head <= length(queue)) {
    v <- queue[head]; head <- head + 1L
    if (!alive[v]) next
    alive[v] <- FALSE
    for (w in adj[[v]]) {
      if (!alive[w]) next
      deg[w] <- deg[w] - 1L
      if (deg[w] < k) queue <- c(queue, w)
    }
  }
  list(alive = alive, size = sum(alive), degree = deg)
}
