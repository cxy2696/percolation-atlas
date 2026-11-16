package atlas;

import java.util.ArrayList;
import java.util.List;

/**
 * Nearest-neighbour lattices with the same edge order as build_lattice in the
 * other editions: square (E, S), triangular (E, S, SW), honeycomb (rung, strut).
 * Every undirected edge appears once.
 */
public final class Lattice {
    public final String kind;
    public final int L;
    public final int n;
    public final int m;
    public final int[] eu;
    public final int[] ev;

    public Lattice(String kind, int L, boolean torus) {
        if (!kind.equals("square") && !kind.equals("triangular") && !kind.equals("honeycomb")) {
            throw new IllegalArgumentException("unknown lattice: " + kind);
        }
        if (L < 1) throw new IllegalArgumentException("L must be positive");
        if (kind.equals("honeycomb") && (L % 2 != 0 || L < 6)) {
            throw new IllegalArgumentException("honeycomb needs even L >= 6");
        }
        this.kind = kind;
        this.L = L;
        this.n = L * L;
        List<Integer> u = new ArrayList<>();
        List<Integer> v = new ArrayList<>();
        for (int i = 0; i < L; i++) {
            for (int j = 0; j < L; j++) {
                int a = i * L + j;
                if (kind.equals("honeycomb")) {
                    if ((i + j) % 2 == 0 && (j + 1 < L || torus)) {
                        u.add(a); v.add(index(L, i, j + 1));
                    }
                    if (i + 1 < L || torus) {
                        u.add(a); v.add(index(L, i + 1, j));
                    }
                    continue;
                }
                if (j + 1 < L || torus) {
                    u.add(a); v.add(index(L, i, j + 1));
                }
                if (i + 1 < L || torus) {
                    u.add(a); v.add(index(L, i + 1, j));
                }
                if (kind.equals("triangular")
                        && (i + 1 < L || torus)
                        && (j - 1 >= 0 || torus)) {
                    u.add(a); v.add(index(L, i + 1, j - 1));
                }
            }
        }
        this.m = u.size();
        this.eu = new int[m];
        this.ev = new int[m];
        for (int e = 0; e < m; e++) {
            eu[e] = u.get(e);
            ev[e] = v.get(e);
        }
    }

    private static int index(int L, int i, int j) {
        int ii = ((i % L) + L) % L;
        int jj = ((j % L) + L) % L;
        return ii * L + jj;
    }

    public double[] position(int vertex) {
        int i = vertex / L;
        int j = vertex % L;
        if (kind.equals("honeycomb")) {
            return new double[] {(j + 0.5 * (i % 2)) / L, (double) i / L};
        }
        if (kind.equals("triangular")) {
            return new double[] {(j + 0.5 * i) / L, i * 0.8660254037844386 / L};
        }
        return new double[] {(double) j / L, (double) i / L};
    }
}
