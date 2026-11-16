package atlas;

/**
 * xoshiro128** with SplitMix32 seeding.
 *
 * <p>This is the same stream as the C++, Julia, Python and JavaScript
 * editions.  The conventions are part of the public contract: seed modulo
 * 2^32, four SplitMix32 steps, two 32-bit outputs per double (high 26 bits
 * then low 27 bits), rejection sampling for integers, and Fisher-Yates in
 * descending index order.  Do not "improve" one of these in isolation.
 */
public final class Rng {
    private static final int GOLDEN = 0x9e3779b9;
    private final int[] s = new int[4];
    private Double spare = null;

    public Rng(long seed) {
        reseed(seed);
    }

    public void reseed(long seed) {
        int x = (int) seed;
        for (int i = 0; i < 4; i++) {
            x += GOLDEN;
            s[i] = mix32(x);
        }
        if ((s[0] | s[1] | s[2] | s[3]) == 0) s[0] = 1;
        spare = null;
    }

    private static int mix32(int z) {
        z = (z ^ (z >>> 16)) * 0x21f0aaad;
        z = (z ^ (z >>> 15)) * 0x735a2d97;
        return z ^ (z >>> 15);
    }

    private static int rotl(int x, int k) {
        return (x << k) | (x >>> (32 - k));
    }

    /** Raw 32-bit output. */
    public int u32() {
        int result = rotl(s[1] * 5, 7) * 9;
        int t = s[1] << 9;
        s[2] ^= s[0];
        s[3] ^= s[1];
        s[1] ^= s[2];
        s[0] ^= s[3];
        s[2] ^= t;
        s[3] = rotl(s[3], 11);
        return result;
    }

    /** Uniform double in [0,1) with 53 bits of resolution. */
    public double random() {
        int a = u32() >>> 6;
        int b = u32() >>> 5;
        return (a * 134217728L + b) / 9007199254740992.0;
    }

    /** Uniform integer in [0,n), n >= 1. */
    public int nextInt(int n) {
        if (n <= 1) return 0;
        if (n > 0x100000000L) throw new IllegalArgumentException("n must be <= 2^32");
        long limit = (0x100000000L / n) * n;
        long r;
        do {
            r = Integer.toUnsignedLong(u32());
        } while (r >= limit);
        return (int) (r % n);
    }

    public boolean bernoulli(double p) {
        return random() < p;
    }

    /** In-place Fisher-Yates shuffle, descending. */
    public void shuffle(int[] a) {
        for (int i = a.length - 1; i > 0; i--) {
            int j = nextInt(i + 1);
            int t = a[i];
            a[i] = a[j];
            a[j] = t;
        }
    }

    /** Standard normal via the polar Box-Muller method (cached spare). */
    public double normal() {
        if (spare != null) {
            double value = spare;
            spare = null;
            return value;
        }
        while (true) {
            double u = 2.0 * random() - 1.0;
            double v = 2.0 * random() - 1.0;
            double q = u * u + v * v;
            if (q > 0.0 && q < 1.0) {
                double m = Math.sqrt(-2.0 * Math.log(q) / q);
                spare = v * m;
                return u * m;
            }
        }
    }
}
