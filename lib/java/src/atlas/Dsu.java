package atlas;

/** Disjoint sets with full path compression and union by size. */
public final class Dsu {
    public final int[] parent;
    public final int[] size;
    public int count;
    public int maxSize;

    public Dsu(int n) {
        parent = new int[n];
        size = new int[n];
        reset();
    }

    public void reset() {
        for (int i = 0; i < parent.length; i++) {
            parent[i] = i;
            size[i] = 1;
        }
        count = parent.length;
        maxSize = parent.length == 0 ? 0 : 1;
    }

    public int find(int x) {
        int root = x;
        while (parent[root] != root) root = parent[root];
        while (parent[x] != root) {
            int next = parent[x];
            parent[x] = root;
            x = next;
        }
        return root;
    }

    public boolean union(int a, int b) {
        int ra = find(a);
        int rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) {
            int t = ra;
            ra = rb;
            rb = t;
        }
        parent[rb] = ra;
        size[ra] += size[rb];
        count--;
        if (size[ra] > maxSize) maxSize = size[ra];
        return true;
    }
}
