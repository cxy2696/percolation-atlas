package atlas;

/** Connected-component labelling in edge-scan order (Hoshen–Kopelman graph form). */
public final class Labeling {
    public final int[] labels;
    public final int count;
    public final int maxSize;

    private Labeling(int[] labels, int count, int maxSize) {
        this.labels = labels;
        this.count = count;
        this.maxSize = maxSize;
    }

    public static Labeling label(int n, int[] eu, int[] ev, boolean[] active, boolean[] openEdges) {
        Dsu dsu = new Dsu(n);
        boolean[] present = new boolean[n];
        int presentCount = 0;
        for (int v = 0; v < n; v++) {
            if (active == null || active[v]) { present[v] = true; presentCount++; }
        }
        dsu.count = presentCount;
        dsu.maxSize = presentCount == 0 ? 0 : 1;
        for (int e = 0; e < eu.length; e++) {
            if (openEdges != null && !openEdges[e]) continue;
            if (present[eu[e]] && present[ev[e]]) dsu.union(eu[e], ev[e]);
        }
        int[] labels = new int[n];
        int[] sizes = new int[n];
        int count = 0, maxSize = 0;
        for (int v = 0; v < n; v++) {
            if (!present[v]) { labels[v] = -1; continue; }
            int r = dsu.find(v);
            labels[v] = r;
            if (sizes[r] == 0) count++;
            sizes[r]++;
            if (sizes[r] > maxSize) maxSize = sizes[r];
        }
        return new Labeling(labels, count, maxSize);
    }
}
