import { Rng, powerLawDegrees, configurationModel, kcore } from '../engine/index.js';
import { labHead, panel, canvasBox, readout, fmt, setText, bindRange } from './ui.js';
import { palette, onTheme } from '../theme.js';

const N = 400;
const LABELS = {
  en: {
    kicker: 'lab 16 · k-core',
    title: 'Peel to the core',
    lead: 'A configuration-model network of 400 vertices. The k-core is what remains after repeatedly deleting every vertex with current degree below k. Raise k and watch the core shrink; the peeled vertices are grey, the core is cyan.',
    graph: 'Graph and k-core',
    size: 'Core size',
    fraction: 'Core fraction',
    peeled: 'Peeled vertices',
    maxDeg: 'Maximum degree',
    k: 'Minimum degree k',
    regen: 'New network',
    note: 'The result is the unique maximal induced subgraph with minimum degree at least k. Deletion order cannot change it; the queue can hold more than n entries.',
  },
  zh: {
    kicker: '实验 16 · k-核',
    title: '剥到核心',
    lead: '400 个顶点的配置模型网络。k-核是反复删除当前度小于 k 的顶点后剩下的部分。增大 k，核心缩小；灰色是被剥掉的顶点，青色是核心。',
    graph: '图与 k-核',
    size: '核心大小',
    fraction: '核心占比',
    peeled: '被剥顶点',
    maxDeg: '最大度',
    k: '最小度 k',
    regen: '新网络',
    note: '结果是唯一的最大诱导子图，且最小度至少为 k；删除顺序不会改变它。队列长度可以超过 n。',
  },
  de: {
    kicker: 'Labor 16 · k-Kern',
    title: 'Bis zum Kern schälen',
    lead: 'Ein Konfigurationsmodell mit 400 Knoten. Der k-Kern bleibt übrig, wenn man wiederholt jeden Knoten mit aktuellem Grad unter k löscht. k erhöhen und den Kern schrumpfen sehen; grau ist geschält, cyan ist der Kern.',
    graph: 'Graph und k-Kern',
    size: 'Kerngröße',
    fraction: 'Kernanteil',
    peeled: 'Geschälte Knoten',
    maxDeg: 'Maximaler Grad',
    k: 'Mindestgrad k',
    regen: 'Neues Netz',
    note: 'Das Ergebnis ist der eindeutige maximale induzierte Teilgraph mit Mindestgrad k. Die Löschreihenfolge ändert ihn nicht; die Queue kann länger als n werden.',
  },
};

export function mount(root, ctx) {
  const { lang } = ctx;
  const L = LABELS[lang] || LABELS.en;
  root.innerHTML =
    labHead({ kicker: L.kicker, title: L.title, lead: L.lead, lang, guide: 'kcore' }) +
    `<div class="grid-lab">
      <div>
        ${canvasBox('kc-canvas', ['', 'n = 400', 'k-core', ''])}
        <div class="grid-2" style="margin-top:12px">
          ${panel(L.size,
            readout('kc-size', L.size) +
            readout('kc-frac', L.fraction) +
            readout('kc-peeled', L.peeled) +
            readout('kc-max', L.maxDeg))}
          ${panel(L.k, readout('kc-show', L.k))}
        </div>
        <p class="explain">${L.note}</p>
      </div>
      <aside class="panel">
        <h3>${L.graph}</h3>
        <div class="control">
          <label><span>${L.k}</span><b id="kc-k-val">3</b></label>
          <input id="kc-k" type="range" min="1" max="6" step="1" value="3" />
        </div>
        <div class="btn-row"><button class="btn primary" id="kc-regen">${L.regen}</button></div>
      </aside>
    </div>`;

  const state = { graph: null, k: 3, seed: 3001, node: [] };
  const canvas = root.querySelector('#kc-canvas');

  function build() {
    const rng = new Rng(state.seed++);
    const deg = powerLawDegrees(N, 2.5, 2, 50, rng);
    state.graph = configurationModel(deg, rng);
    const layout = new Rng(state.seed++);
    state.node = Array.from({ length: N }, () => {
      const a = 2 * Math.PI * layout.random();
      const r = 240 * Math.sqrt(layout.random());
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });
    draw();
  }

  function draw() {
    const C = palette();
    const wrap = canvas.parentElement;
    const W = Math.max(320, wrap.clientWidth - 2);
    const H = 520;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const graph = state.graph;
    if (!graph) return;
    const core = kcore(graph, new Uint8Array(N).fill(1), state.k);
    const scale = Math.min(W, H) / 520;
    const cx = W / 2, cy = H / 2;
    // edges
    g.strokeStyle = C.grid; g.lineWidth = 0.45;
    for (let v = 0; v < N; v++) {
      for (let e = graph.offset[v]; e < graph.offset[v + 1]; e++) {
        const w = graph.adj[e];
        if (w <= v) continue;
        const a = state.node[v], b = state.node[w];
        g.beginPath();
        g.moveTo(cx + a.x * scale, cy + a.y * scale);
        g.lineTo(cx + b.x * scale, cy + b.y * scale);
        g.stroke();
      }
    }
    // nodes
    for (let v = 0; v < N; v++) {
      const p = state.node[v];
      g.fillStyle = core.alive[v] ? C.cyan : C.closed;
      g.beginPath();
      g.arc(cx + p.x * scale, cy + p.y * scale, core.alive[v] ? 2.2 : 1.2, 0, 2 * Math.PI);
      g.fill();
    }
    setText('kc-size', String(core.size));
    setText('kc-frac', fmt(core.size / N, 3));
    setText('kc-peeled', String(N - core.size));
    let maxDeg = 0;
    for (let v = 0; v < N; v++) {
      maxDeg = Math.max(maxDeg, graph.offset[v + 1] - graph.offset[v]);
    }
    setText('kc-max', String(maxDeg));
    setText('kc-show', String(state.k));
  }

  bindRange('kc-k', (v) => { state.k = v | 0; draw(); }, (v) => String(v | 0));
  root.querySelector('#kc-regen').addEventListener('click', build);
  const off = onTheme(() => draw());
  window.addEventListener('resize', draw);
  build();
  return () => { off(); window.removeEventListener('resize', draw); };
}
