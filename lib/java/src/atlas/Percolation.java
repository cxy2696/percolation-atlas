package atlas;

import java.util.ArrayList;
import java.util.List;

/**
 * Bernoulli site or bond percolation on a {@link Lattice}.
 *
 * <p>The sample order is part of the contract: site mode draws one uniform
 * per site in index order; bond mode draws one uniform per edge in the order
 * produced by {@link Lattice}.  The DSU is rebuilt lazily.
 */
public final class Percolation {
    public final Lattice lattice;
    public final String mode;
    public boolean[] occupied;
    public boolean[] open;
    public final Dsu dsu;
    private boolean dirty = true;

    public Percolation(Lattice lattice, String mode) {
        if (!mode.equals("bond") && !mode.equals("site")) {
            throw new IllegalArgumentException("mode must be bond or site");
        }
        this.lattice = lattice;
        this.mode = mode;
        this.occupied = new boolean[lattice.n];
        this.open = new boolean[lattice.m];
        java.util.Arrays.fill(occupied, true);
        java.util.Arrays.fill(open, true);
        this.dsu = new Dsu(lattice.n);
    }

    public Percolation sample(double p, Rng rng) {
        if (mode.equals("site")) {
            for (int v = 0; v < lattice.n; v++) occupied[v] = rng.random() < p;
            java.util.Arrays.fill(open, true);
        } else {
            java.util.Arrays.fill(occupied, true);
            for (int e = 0; e < lattice.m; e++) open[e] = rng.random() < p;
        }
        dirty = true;
        return this;
    }

    public Dsu build() {
        dsu.reset();
        dsu.count = 0;
        for (int v = 0; v < lattice.n; v++) {
            if (occupied[v]) dsu.count++;
        }
        dsu.maxSize = dsu.count == 0 ? 0 : 1;
        for (int e = 0; e < lattice.m; e++) {
            int a = lattice.eu[e];
            int b = lattice.ev[e];
            if (open[e] && occupied[a] && occupied[b]) dsu.union(a, b);
        }
        dirty = false;
        return dsu;
    }

    public Dsu ensureBuilt() {
        if (dirty) build();
        return dsu;
    }

    /**
     * One pass over the occupied sites, with an int array keyed by root.
     * This avoids boxing every cluster in a HashMap; on the 16k-site cube the
     * difference is small, but the code is both faster and easier to audit.
     */
    public Stats analyze() {
        Dsu d = build();
        int[] rootSize = new int[lattice.n];
        int[] roots = new int[lattice.n];
        int clusters = 0;
        for (int v = 0; v < lattice.n; v++) {
            if (!occupied[v]) continue;
            int r = d.find(v);
            if (rootSize[r] == 0) roots[clusters++] = r;
            rootSize[r]++;
        }
        int[] sizes = new int[clusters];
        for (int i = 0; i < clusters; i++) sizes[i] = rootSize[roots[i]];
        java.util.Arrays.sort(sizes);
        for (int i = 0; i < clusters / 2; i++) {
            int t = sizes[i];
            sizes[i] = sizes[clusters - 1 - i];
            sizes[clusters - 1 - i] = t;
        }
        List<Integer> list = new ArrayList<>(clusters);
        int total = 0;
        long total2 = 0;
        for (int s : sizes) {
            list.add(s);
            total += s;
            total2 += (long) s * s;
        }
        return new Stats(clusters, clusters == 0 ? 0 : sizes[0], total, total2, list);
    }

    /** Left-to-right crossing: an occupied site in every row, connected. */
    public boolean crossesLr() {
        Dsu d = ensureBuilt();
        boolean[] leftRoots = new boolean[lattice.n];
        for (int i = 0; i < lattice.L; i++) {
            int v = i * lattice.L;
            if (occupied[v]) leftRoots[d.find(v)] = true;
        }
        for (int i = 0; i < lattice.L; i++) {
            int v = i * lattice.L + lattice.L - 1;
            if (occupied[v] && leftRoots[d.find(v)]) return true;
        }
        return false;
    }

    /** Top-to-bottom crossing, used by the 3D laboratory and validation. */
    public boolean crossesTb() {
        Dsu d = ensureBuilt();
        boolean[] topRoots = new boolean[lattice.n];
        for (int j = 0; j < lattice.L; j++) {
            if (occupied[j]) topRoots[d.find(j)] = true;
        }
        int base = (lattice.L - 1) * lattice.L;
        for (int j = 0; j < lattice.L; j++) {
            int v = base + j;
            if (occupied[v] && topRoots[d.find(v)]) return true;
        }
        return false;
    }

    /**
     * One uniform edge order, then the whole S_max curve.  After k edges the
     * open set is a uniform k-subset, so the point is a sample at p=k/m.
     */
    public static int[] newmanZiffSmax(Lattice lattice, Rng rng, int checkpoints) {
        if (checkpoints < 1) throw new IllegalArgumentException("checkpoints must be positive");
        int m = lattice.m;
        int[] order = new int[m];
        for (int e = 0; e < m; e++) order[e] = e;
        rng.shuffle(order);
        Dsu d = new Dsu(lattice.n);
        int every = Math.max(1, m / checkpoints);
        int[] smax = new int[1 + (m - 1) / every];
        int out = 0;
        for (int k = 0; k < m; k++) {
            int e = order[k];
            d.union(lattice.eu[e], lattice.ev[e]);
            if ((k + 1) % every == 0 || k == m - 1) {
                if (out == smax.length) {
                    int[] bigger = new int[smax.length + 1];
                    System.arraycopy(smax, 0, bigger, 0, smax.length);
                    smax = bigger;
                }
                smax[out++] = d.maxSize;
            }
        }
        int[] result = new int[out];
        System.arraycopy(smax, 0, result, 0, out);
        return result;
    }

    public static final class Stats {
        public final int count;
        public final int maxSize;
        public final int total;
        public final long total2;
        public final List<Integer> sizes;

        Stats(int count, int maxSize, int total, long total2, List<Integer> sizes) {
            this.count = count;
            this.maxSize = maxSize;
            this.total = total;
            this.total2 = total2;
            this.sizes = sizes;
        }

        public double maxFraction() {
            return total == 0 ? 0.0 : (double) maxSize / total;
        }

        public double chi2() {
            return total == 0 ? 0.0 : (double) total2 / total;
        }
    }
}
