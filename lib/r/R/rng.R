# xoshiro128** with SplitMix32 seeding.
#
# R has no unsigned 32-bit integer type.  We store the four state words as
# numbers in [0, 2^32) and implement the few operations that need wraparound
# with 16-bit splitting.  This keeps the byte stream identical to the other
# reference editions without an external package.

.MASK32 <- 4294967296
.GOLDEN <- 2654435769

.u32 <- function(x) x %% .MASK32

.as_signed <- function(x) ifelse(x >= 2147483648, x - .MASK32, x)

.xor32 <- function(a, b) {
  z <- bitwXor(as.integer(.as_signed(a)), as.integer(.as_signed(b)))
  .u32(ifelse(z < 0, z + .MASK32, z))
}

.rotl32 <- function(x, k) {
  .u32((x %% 2^(32 - k)) * 2^k + floor(x / 2^(32 - k)))
}

.mul32 <- function(a, b) {
  a0 <- a %% 65536; a1 <- floor(a / 65536)
  b0 <- b %% 65536; b1 <- floor(b / 65536)
  lo <- a0 * b0
  mid <- (a1 * b0 + a0 * b1) %% 65536
  .u32(lo + mid * 65536)
}

.mix32 <- function(z) {
  z <- .mul32(.xor32(z, floor(z / 65536)), 569420461)
  z <- .mul32(.xor32(z, floor(z / 32768)), 1935289751)
  .xor32(z, floor(z / 32768))
}

#' Create an independent xoshiro128** stream.
#' @param seed integer-valued seed; reduced modulo 2^32.
#' @return an environment with the four state words.
new_rng <- function(seed = 2654435769) {
  e <- new.env(parent = emptyenv())
  x <- .u32(seed)
  s <- numeric(4)
  for (i in 1:4) {
    x <- .u32(x + .GOLDEN)
    s[i] <- .mix32(x)
  }
  if (all(s == 0)) s[1] <- 1
  e$s <- s
  e$spare <- NULL
  class(e) <- "atlas_rng"
  e
}

rng_u32 <- function(e) {
  s <- e$s
  result <- .mul32(.rotl32(.mul32(s[2], 5), 7), 9)
  t <- .u32(s[2] * 512)
  s[3] <- .xor32(s[3], s[1])
  s[4] <- .xor32(s[4], s[2])
  s[2] <- .xor32(s[2], s[3])
  s[1] <- .xor32(s[1], s[4])
  s[3] <- .xor32(s[3], t)
  s[4] <- .rotl32(s[4], 11)
  e$s <- s
  result
}

rng_random <- function(e) {
  a <- floor(rng_u32(e) / 64)
  b <- floor(rng_u32(e) / 32)
  (a * 134217728 + b) / 9007199254740992
}

rng_int <- function(e, n) {
  if (n <= 1) return(0L)
  if (n > .MASK32) stop("n must be <= 2^32")
  limit <- floor(.MASK32 / n) * n
  repeat {
    r <- rng_u32(e)
    if (r < limit) return(as.integer(r %% n))
  }
}

rng_shuffle <- function(e, x) {
  for (i in length(x):2) {
    j <- rng_int(e, i) + 1L
    tmp <- x[i]; x[i] <- x[j]; x[j] <- tmp
  }
  x
}
