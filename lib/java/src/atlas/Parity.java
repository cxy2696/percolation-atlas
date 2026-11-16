package atlas;

/**
 * Golden checks for the Java edition.
 *
 * <p>They are deliberately small and self-contained: the same values are in
 * {@code data/golden/parity.json} and {@code data/golden/rng-seed42.json},
 * and the C++, Julia, Python and JavaScript suites assert them too.  Run with
 * {@code make test-java}.  Exit status 1 means a real mismatch, not a missing
 * optional dependency.
 */
public final class Parity {
    private static int failures = 0;

    public static void main(String[] args) {
        testRng();
        testSquareBond();
        testTriangularSite();
        testNewmanZiff();
        testClusterStats();
        testLabeling();
        testKCore();
        if (failures > 0) {
            System.err.println("java parity: " + failures + " failure(s)");
            System.exit(1);
        }
        System.out.println("java parity: RNG, square bond, triangular site, Newman-Ziff, labels, k-core ok");
    }

    private static void testRng() {
        double[] expected = {
            0.15377165154351735, 0.018084544121180213, 0.5348906350361368,
            0.7272476917564136, 0.572911021218635, 0.2877089619804075,
            0.8504471575585412, 0.30334379811845724
        };
        Rng rng = new Rng(42);
        for (int i = 0; i < expected.length; i++) {
            double got = rng.random();
            if (Double.compare(got, expected[i]) != 0) {
                fail("rng.random[" + i + "]=" + got + " want " + expected[i]);
            }
        }
        int[] expectedInts = {1, 2, 6, 3, 6, 7, 4, 6};
        Rng again = new Rng(42);
        for (int i = 0; i < expectedInts.length; i++) {
            int got = again.nextInt(10);
            if (got != expectedInts[i]) fail("rng.nextInt[" + i + "]=" + got + " want " + expectedInts[i]);
        }
        Rng stream = new Rng(42);
        int sum = 0;
        int hash = 0x811c9dc5;
        for (int i = 0; i < 10000; i++) {
            int v = stream.u32();
            sum += v;
            hash = (hash ^ v) * 16777619;
        }
        check(sum == 839333524, "rng sum=" + sum);
        check(Integer.toUnsignedLong(hash) == 3108118429L, "rng hash=" + Integer.toUnsignedLong(hash));
    }

    private static void testSquareBond() {
        Lattice lattice = new Lattice("square", 32, false);
        Percolation model = new Percolation(lattice, "bond");
        Rng rng = new Rng(1234);
        int hits = 0;
        for (int i = 0; i < 500; i++) {
            if (model.sample(0.5, rng).crossesLr()) hits++;
        }
        check(hits == 244, "square bond crossing=" + hits + " want 244");
    }

    private static void testTriangularSite() {
        Lattice lattice = new Lattice("triangular", 16, false);
        Percolation model = new Percolation(lattice, "site");
        Rng rng = new Rng(777);
        int hits = 0;
        for (int i = 0; i < 300; i++) {
            if (model.sample(0.5, rng).crossesLr()) hits++;
        }
        check(hits == 151, "triangular site crossing=" + hits + " want 151");
    }

    private static void testNewmanZiff() {
        Lattice lattice = new Lattice("square", 16, false);
        int[] smax = Percolation.newmanZiffSmax(lattice, new Rng(5), 64);
        int[] expected = {10, 109, 256};
        int[] idx = {smax.length / 4, smax.length / 2, smax.length - 1};
        for (int i = 0; i < expected.length; i++) {
            int got = smax[idx[i]];
            check(got == expected[i], "Newman-Ziff smax[" + idx[i] + "]=" + got + " want " + expected[i]);
        }
    }

    private static void testClusterStats() {
        Lattice lattice = new Lattice("square", 4, false);
        Percolation model = new Percolation(lattice, "site");
        Percolation.Stats full = model.sample(1.0, new Rng(7)).analyze();
        check(full.count == 1, "full site sample count=" + full.count + " want 1");
        check(full.maxSize == 16, "full site sample maxSize=" + full.maxSize + " want 16");
        Percolation.Stats empty = model.sample(0.0, new Rng(7)).analyze();
        check(empty.count == 0, "empty site sample count=" + empty.count + " want 0");
        check(empty.maxSize == 0, "empty site sample maxSize=" + empty.maxSize + " want 0");
    }

    private static void testLabeling() {
        Lattice lattice = new Lattice("square", 6, false);
        Percolation model = new Percolation(lattice, "bond");
        model.sample(0.5, new Rng(42));
        Labeling result = Labeling.label(lattice.n, lattice.eu, lattice.ev, null, model.open);
        check(result.count == 6, "label count=" + result.count + " want 6");
        check(result.maxSize == 30, "label maxSize=" + result.maxSize + " want 30");
    }

    private static void testKCore() {
        // K4 plus a pendant vertex: k=2 and k=3 leave the K4, k=4 leaves nothing.
        int[] eu = {0, 0, 0, 1, 1, 2, 3};
        int[] ev = {1, 2, 3, 2, 3, 3, 4};
        boolean[] active = {true, true, true, true, true};
        check(KCore.peel(5, eu, ev, 2, active).size == 4, "k-core k=2");
        check(KCore.peel(5, eu, ev, 3, active).size == 4, "k-core k=3");
        check(KCore.peel(5, eu, ev, 4, active).size == 0, "k-core k=4");
    }

    private static void check(boolean ok, String message) {
        if (!ok) fail(message);
    }

    private static void fail(String message) {
        failures++;
        System.err.println("FAIL " + message);
    }
}
