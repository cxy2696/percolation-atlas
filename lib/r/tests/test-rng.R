source(file.path("lib", "r", "R", "rng.R"))
r <- new_rng(42)
expected <- c(0.15377165154351735, 0.018084544121180213, 0.5348906350361368,
              0.7272476917564136, 0.572911021218635, 0.2877089619804075,
              0.8504471575585412, 0.30334379811845724)
got <- vapply(1:8, function(i) rng_random(r), numeric(1))
stopifnot(identical(all.equal(got, expected, tolerance = 0), TRUE))
cat("R RNG matches seed-42 golden\n")
