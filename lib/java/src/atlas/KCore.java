package atlas;

import java.util.Arrays;

/**
 * k-core peeling: repeatedly delete a vertex whose current degree is below k.
 * The surviving set is the unique maximal induced subgraph with minimum degree
 * k. The queue makes the routine O(n + m); the check {@code deg[w] < k} is
 * enough because degrees only decrease.
 */
public final class KCore {
    public final boolean[] alive;
    public final int size;
    public final int[] degree;

    private KCore(boolean[] alive, int size, int[] degree) {
        this.alive = alive;
        this.size = size;
        this.degree = degree;
    }

    public static KCore peel(int n, int[] eu, int[] ev, int k, boolean[] active) {
        if (k < 0) throw new IllegalArgumentException("k must be non-negative");
        int m = eu.length;
        int[] deg = new int[n];
        int[] start = new int[n + 1];
        for (int e = 0; e < m; e++) {
            deg[eu[e]]++;
            deg[ev[e]]++;
        }
        for (int v = 0; v < n; v++) start[v + 1] = start[v] + deg[v];
        int[] pos = Arrays.copyOf(start, n);
        int[] adj = new int[2 * m];
        for (int e = 0; e < m; e++) {
            adj[pos[eu[e]]++] = ev[e];
            adj[pos[ev[e]]++] = eu[e];
        }
        boolean[] alive = new boolean[n];
        int remaining = 0;
        for (int v = 0; v < n; v++) {
            if (active == null || active[v]) {
                alive[v] = true;
                remaining++;
            }
        }
        int[] current = new int[n];
        int[] queue = new int[n + 2 * m];
        int head = 0, tail = 0;
        for (int v = 0; v < n; v++) {
            if (!alive[v]) continue;
            int d = 0;
            for (int j = start[v]; j < start[v + 1]; j++) if (alive[adj[j]]) d++;
            current[v] = d;
            if (d < k) queue[tail++] = v;
        }
        while (head < tail) {
            int v = queue[head++];
            if (!alive[v]) continue;
            alive[v] = false;
            remaining--;
            for (int j = start[v]; j < start[v + 1]; j++) {
                int w = adj[j];
                if (!alive[w]) continue;
                current[w]--;
                if (current[w] < k) queue[tail++] = w;
            }
        }
        return new KCore(alive, remaining, current);
    }
}
