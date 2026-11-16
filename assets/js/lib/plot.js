/** Minimal HUD line plot on a canvas, no dependencies.
 *
 *  Colours are resolved from the active theme on every call, and the
 *  `PALETTE` proxy keeps older laboratories working without an import change.
 *  Spec fields:
 *    xRange, yRange, logX, logY, xLabel, yLabel, height, title, bg
 *    xTicks, yTicks, vlines, hlines
 *    series: [{x, y, err, color, width, dash, points, label, fill, band}]
 *    annotations: [{x, y, text, dx, dy, color, align}]
 */
import { palette } from '../theme.js';

let cache = null;
window.addEventListener('atlas:theme', () => {
  cache = null;
});
function P() {
  if (!cache) cache = palette();
  return cache;
}
export const PALETTE = new Proxy(
  {},
  {
    get(_target, key) {
      return P()[key];
    },
  }
);

const FONT = '11px "Avenir Next", "Segoe UI", system-ui, sans-serif';
const FONT_SMALL = '10px "Avenir Next", "Segoe UI", system-ui, sans-serif';

function niceTicks(a, b, n = 5) {
  if (!(isFinite(a) && isFinite(b)) || a === b) return [a];
  const span = b - a;
  const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const start = Math.ceil(a / step) * step;
  const out = [];
  for (let v = start; v <= b + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

function logTicks(a, b) {
  const out = [];
  for (let e = Math.floor(Math.log10(a)); e <= Math.ceil(Math.log10(b)); e++) {
    for (const m of [1, 2, 5]) {
      const v = m * Math.pow(10, e);
      if (v >= a * 0.999 && v <= b * 1.001) out.push(v);
    }
  }
  if (out.length > 12) {
    // Keep both ends of a wide range instead of truncating the top.
    return out.filter((_, i) => i === 0 || i === out.length - 1 || i % 2 === 0);
  }
  if (out.length && out[out.length - 1] < b * 0.999 && b / a < 20) out.push(b);
  return [...new Set(out)];
}

function fmtTick(v) {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1000) return v.toExponential(0);
  if (a >= 10) return v.toFixed(0);
  if (a >= 1) return v.toFixed(1);
  if (a >= 0.01) return v.toFixed(2);
  return v.toExponential(1);
}

function rgba(hex, alpha) {
  const s = String(hex || '').trim();
  const m = s.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return s;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function renderPlot(canvas, spec, hover = null) {
  const C = P();
  const dpr = window.devicePixelRatio || 1;
  const cssW = Math.max(240, canvas.parentElement.clientWidth - 2);
  const cssH = spec.height || 230;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  if (spec.bg) {
    ctx.fillStyle = spec.bg;
    ctx.fillRect(0, 0, cssW, cssH);
  }

  const hasLegend = !!(spec.series && spec.series.some((s) => s.label));
  const topPad = hasLegend ? 38 : spec.title ? 26 : 18;
  const m = { l: spec.xLabel ? 62 : 50, r: 18, t: topPad, b: spec.xLabel ? 50 : 34 };
  const W = cssW - m.l - m.r;
  const H = cssH - m.t - m.b;

  const xr = spec.xRange || [0, 1];
  const yr = spec.yRange || [0, 1];
  const logX = !!spec.logX;
  const logY = !!spec.logY;
  const sx = (x) => {
    const t = logX
      ? (Math.log10(x) - Math.log10(xr[0])) / (Math.log10(xr[1]) - Math.log10(xr[0]))
      : (x - xr[0]) / (xr[1] - xr[0]);
    return m.l + t * W;
  };
  const sy = (y) => {
    const t = logY
      ? (Math.log10(y) - Math.log10(yr[0])) / (Math.log10(yr[1]) - Math.log10(yr[0]))
      : (y - yr[0]) / (yr[1] - yr[0]);
    return m.t + H - t * H;
  };

  if (spec.title) {
    ctx.fillStyle = C.ink;
    ctx.font = FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(spec.title, m.l, 6);
  }

  // frame
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(m.l + 0.5, m.t + 0.5, W, H);

  // grid + ticks
  ctx.font = FONT;
  ctx.fillStyle = C.dim;
  const xt = spec.xTicks || (logX ? logTicks(xr[0], xr[1]) : niceTicks(xr[0], xr[1], 6));
  const yt = spec.yTicks || (logY ? logTicks(yr[0], yr[1]) : niceTicks(yr[0], yr[1], 5));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (const x of xt) {
    const px = sx(x);
    ctx.strokeStyle = C.gridFaint;
    ctx.beginPath();
    ctx.moveTo(px, m.t);
    ctx.lineTo(px, m.t + H);
    ctx.stroke();
    ctx.fillText(fmtTick(x), px, m.t + H + 6);
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const y of yt) {
    const py = sy(y);
    ctx.strokeStyle = C.gridFaint;
    ctx.beginPath();
    ctx.moveTo(m.l, py);
    ctx.lineTo(m.l + W, py);
    ctx.stroke();
    ctx.fillText(fmtTick(y), m.l - 8, py);
  }

  // axis labels
  ctx.fillStyle = C.faint;
  ctx.font = FONT_SMALL;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  if (spec.xLabel) ctx.fillText(spec.xLabel, m.l + W / 2, cssH - 4);
  if (spec.yLabel) {
    ctx.save();
    ctx.translate(13, m.t + H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(spec.yLabel, 0, 0);
    ctx.restore();
  }

  // horizontal reference lines
  for (const h of spec.hlines || []) {
    const py = sy(h.y);
    ctx.strokeStyle = refColor(h.color, C);
    ctx.setLineDash(h.dash || [3, 3]);
    ctx.beginPath();
    ctx.moveTo(m.l, py);
    ctx.lineTo(m.l + W, py);
    ctx.stroke();
    ctx.setLineDash([]);
    if (h.label) {
      ctx.fillStyle = C.dim;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(h.label, m.l + W - 3, py - 2);
    }
  }

  // vertical reference lines
  for (const v of spec.vlines || []) {
    const px = sx(v.x);
    ctx.strokeStyle = refColor(v.color, C);
    ctx.setLineDash(v.dash || [3, 3]);
    ctx.beginPath();
    ctx.moveTo(px, m.t);
    ctx.lineTo(px, m.t + H);
    ctx.stroke();
    ctx.setLineDash([]);
    if (v.label) {
      ctx.fillStyle = C.dim;
      ctx.textAlign = px > m.l + W * 0.7 ? 'right' : 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(v.label, px + (px > m.l + W * 0.7 ? -4 : 4), m.t + 3);
    }
  }

  // series
  ctx.save();
  ctx.beginPath();
  ctx.rect(m.l, m.t, W, H);
  ctx.clip();
  const autoDash = (spec.series || []).length > 1 && spec.autoDash !== false;
  const dashPatterns = [[], [6, 4], [2, 3], [9, 3, 2, 3]];
  for (let si = 0; si < (spec.series || []).length; si++) {
    const s = spec.series[si];
    if (!s.x || s.x.length === 0) continue;
    const color = s.color || C.cyan;
    const dash = s.dash !== undefined ? s.dash : autoDash ? dashPatterns[si % dashPatterns.length] : [];

    // confidence band before the centre line
    if (s.band) {
      const lo = s.band.lower || [];
      const hi = s.band.upper || [];
      ctx.fillStyle = s.band.color || rgba(color, 0.12);
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < lo.length; i++) {
        if (!isFinite(s.x[i]) || !isFinite(lo[i])) continue;
        const px = sx(s.x[i]);
        const py = sy(lo[i]);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else ctx.lineTo(px, py);
      }
      for (let i = hi.length - 1; i >= 0; i--) {
        if (!isFinite(s.x[i]) || !isFinite(hi[i])) continue;
        ctx.lineTo(sx(s.x[i]), sy(hi[i]));
      }
      if (started) {
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = s.width || 1.5;
    if (dash.length) ctx.setLineDash(dash);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < s.x.length; i++) {
      const x = s.x[i];
      const y = s.y[i];
      if (!isFinite(x) || !isFinite(y) || (logY && y <= 0) || (logX && x <= 0)) continue;
      const px = sx(x);
      const py = sy(y);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    if (s.points) {
      ctx.fillStyle = color;
      for (let i = 0; i < s.x.length; i++) {
        if (!isFinite(s.x[i]) || !isFinite(s.y[i])) continue;
        ctx.beginPath();
        ctx.arc(sx(s.x[i]), sy(s.y[i]), s.points === true ? 2.2 : s.points, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (s.err) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (let i = 0; i < s.x.length; i++) {
        const e = s.err[i];
        if (!isFinite(s.x[i]) || !isFinite(s.y[i]) || !isFinite(e) || e <= 0) continue;
        const px = sx(s.x[i]);
        const y0 = sy(Math.max(yr[0], s.y[i] - e));
        const y1 = sy(Math.min(yr[1], s.y[i] + e));
        ctx.beginPath();
        ctx.moveTo(px, y0);
        ctx.lineTo(px, y1);
        ctx.moveTo(px - 2.5, y0);
        ctx.lineTo(px + 2.5, y0);
        ctx.moveTo(px - 2.5, y1);
        ctx.lineTo(px + 2.5, y1);
        ctx.stroke();
      }
    }

    if (s.marker) {
      const i = s.marker.index;
      if (i >= 0 && i < s.x.length) {
        ctx.strokeStyle = s.color || C.amber;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(sx(s.x[i]), sy(s.y[i]), 4.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // annotations
  for (const a of spec.annotations || []) {
    if (!isFinite(a.x) || !isFinite(a.y)) continue;
    const px = sx(a.x) + (a.dx || 0);
    const py = sy(a.y) + (a.dy || 0);
    ctx.fillStyle = a.color || C.text || C.ink;
    ctx.font = FONT_SMALL;
    ctx.textAlign = a.align || 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(a.text, px, py);
  }

  // legend, in the top margin so it never covers the data
  if (hasLegend) {
    let x = m.l;
    const y = 12;
    ctx.font = FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let si = 0; si < spec.series.length; si++) {
      const s = spec.series[si];
      if (!s.label) continue;
      const width = 26 + ctx.measureText(s.label).width;
      if (x > m.l && x + width > m.l + W) {
        // One row is enough for the current charts. If a future chart has
        // more series, the extra labels start again at the left margin.
        x = m.l;
      }
      const dash = s.dash !== undefined ? s.dash : autoDash ? dashPatterns[si % dashPatterns.length] : [];
      ctx.strokeStyle = s.color || C.cyan;
      ctx.lineWidth = 2;
      if (dash.length) ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 14, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.dim;
      ctx.fillText(s.label, x + 18, y);
      x += width + 18;
    }
  }

  canvas.__plotGeom = { m, W, H, cssW, cssH, xr, yr, logX, logY, sx, sy };
  if (hover) drawHover(canvas, hover);
}

/* ---------------------------------------------------------------- interaction */
function plotValue(v) {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  if (a !== 0 && (a >= 10000 || a < 0.001)) return v.toExponential(2);
  if (a >= 100) return v.toFixed(1);
  if (a >= 1) return v.toFixed(3);
  return v.toFixed(4);
}

function dataXFromEvent(canvas, event) {
  const g = canvas.__plotGeom;
  if (!g) return null;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return null;
  const cssX = ((event.clientX - rect.left) / rect.width) * g.cssW;
  if (cssX < g.m.l || cssX > g.m.l + g.W) return null;
  const t = (cssX - g.m.l) / g.W;
  return g.logX
    ? Math.pow(10, Math.log10(g.xr[0]) + t * (Math.log10(g.xr[1]) - Math.log10(g.xr[0])))
    : g.xr[0] + t * (g.xr[1] - g.xr[0]);
}

function hoverAt(canvas, x) {
  const spec = canvas.__plotSpec;
  const g = canvas.__plotGeom;
  if (!spec || !g || !Number.isFinite(x)) return null;
  const points = [];
  for (const series of spec.series || []) {
    if (!series.x || !series.x.length) continue;
    let best = -1;
    let bestPx = Infinity;
    for (let i = 0; i < series.x.length; i++) {
      const xi = series.x[i];
      const yi = series.y[i];
      if (!Number.isFinite(xi) || !Number.isFinite(yi)) continue;
      if (g.logX && xi <= 0) continue;
      const px = Math.abs(g.sx(xi) - g.sx(x));
      if (px < bestPx) {
        bestPx = px;
        best = i;
      }
    }
    if (best >= 0 && bestPx <= 18) {
      points.push({
        index: best,
        x: series.x[best],
        y: series.y[best],
        color: series.color || P().cyan,
        label: series.label || '',
      });
    }
  }
  if (!points.length) return null;
  return { x, px: g.sx(x), points };
}

function drawHover(canvas, hover) {
  const spec = canvas.__plotSpec;
  const g = canvas.__plotGeom;
  if (!spec || !g || !hover) return;
  const C = P();
  const ctx = canvas.getContext('2d');
  const px = Math.max(g.m.l, Math.min(g.m.l + g.W, hover.px));
  ctx.save();
  ctx.strokeStyle = C.dim;
  ctx.globalAlpha = 0.55;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(px, g.m.t);
  ctx.lineTo(px, g.m.t + g.H);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  for (const point of hover.points) {
    const py = g.sy(point.y);
    ctx.fillStyle = point.color;
    ctx.beginPath();
    ctx.arc(g.sx(point.x), py, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.bg;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const lines = [
    `${spec.xLabel || 'x'} = ${plotValue(hover.x)}`,
    ...hover.points.map((p) => `${p.label || 'value'} = ${plotValue(p.y)}`),
  ];
  ctx.font = FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const pad = 7;
  const lineH = 15;
  const width = Math.max(...lines.map((line) => ctx.measureText(line).width)) + pad * 2;
  const height = lines.length * lineH + pad * 2 - 2;
  let bx = px + 12;
  if (bx + width > g.cssW - 6) bx = px - width - 12;
  bx = Math.max(6, bx);
  let by = g.m.t + 10;
  if (by + height > g.cssH - 6) by = g.cssH - height - 6;
  ctx.fillStyle = C.bg;
  ctx.globalAlpha = 0.96;
  ctx.fillRect(bx, by, width, height);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = C.grid;
  ctx.strokeRect(bx + 0.5, by + 0.5, width, height);
  ctx.fillStyle = C.ink;
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? C.dim : C.ink;
    ctx.fillText(line, bx + pad, by + pad + i * lineH);
  });
  ctx.restore();
}

function plotSummary(spec) {
  const parts = [];
  if (spec.xLabel) parts.push(`x: ${spec.xLabel}`);
  if (spec.yLabel) parts.push(`y: ${spec.yLabel}`);
  const labels = (spec.series || []).map((s) => s.label).filter(Boolean);
  if (labels.length) parts.push(`series: ${labels.join(', ')}`);
  parts.push('Use arrow keys to inspect points; hover or focus the chart for details.');
  return `${spec.title ? spec.title + '. ' : ''}${parts.join('. ')}`;
}

function downloadPlot(canvas, filename) {
  const spec = canvas.__plotSpec || {};
  const C = P();
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const ctx = out.getContext('2d');
  ctx.fillStyle = C.bg || '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  const safe = (filename || spec.title || canvas.id || 'chart')
    .toString()
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'chart';
  const a = document.createElement('a');
  a.download = `${safe}.png`;
  a.href = out.toDataURL('image/png');
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function ensureSaveButton(canvas) {
  const wrap = canvas.closest('.canvas-wrap');
  if (!wrap || wrap.querySelector('.chart-save')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chart-save';
  button.textContent = 'PNG';
  button.setAttribute('aria-label', 'Save chart as PNG');
  button.title = 'Save chart as PNG';
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    downloadPlot(canvas);
  });
  wrap.classList.add('has-chart-save');
  wrap.appendChild(button);
}

function bindPlot(canvas) {
  if (canvas.__plotBound) return;
  canvas.__plotBound = true;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');

  let live = canvas.parentElement?.querySelector('.chart-live');
  if (!live && canvas.parentElement) {
    live = document.createElement('p');
    live.className = 'sr-only chart-live';
    live.setAttribute('aria-live', 'polite');
    canvas.parentElement.appendChild(live);
  }
  const announce = (hover) => {
    if (!live) return;
    if (!hover) {
      live.textContent = '';
      return;
    }
    const spec = canvas.__plotSpec || {};
    live.textContent = `${spec.xLabel || 'x'} ${plotValue(hover.x)}; ` +
      hover.points.map((p) => `${p.label || 'value'} ${plotValue(p.y)}`).join('; ');
  };

  const redraw = () => {
    if (canvas.__plotSpec) renderPlot(canvas, canvas.__plotSpec, canvas.__plotHover || null);
  };

  canvas.addEventListener('pointermove', (event) => {
    const x = dataXFromEvent(canvas, event);
    const next = x === null ? null : hoverAt(canvas, x);
    if (next) {
      canvas.__plotHover = next;
      redraw();
      announce(next);
    } else if (canvas.__plotHover) {
      canvas.__plotHover = null;
      redraw();
      announce(null);
    }
  });
  canvas.addEventListener('pointerleave', () => {
    if (!canvas.__plotHover) return;
    canvas.__plotHover = null;
    redraw();
    announce(null);
  });
  canvas.addEventListener('blur', () => {
    if (!canvas.__plotHover) return;
    canvas.__plotHover = null;
    redraw();
    announce(null);
  });
  canvas.addEventListener('focus', () => {
    if (canvas.__plotHover) return;
    const spec = canvas.__plotSpec;
    const first = spec?.series?.find((s) => s.x && s.x.length);
    const next = first ? hoverAt(canvas, first.x[0]) : null;
    if (next) {
      canvas.__plotHover = next;
      redraw();
      announce(next);
    }
  });
  canvas.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'].includes(event.key)) return;
    const spec = canvas.__plotSpec;
    if (!spec || !spec.series) return;
    const xs = [...new Set(spec.series.flatMap((s) => (s.x || []).filter((v) => Number.isFinite(v))))].sort((a, b) => a - b);
    if (!xs.length) return;
    event.preventDefault();
    if (event.key === 'Escape') {
      canvas.__plotHover = null;
      redraw();
      announce(null);
      return;
    }
    const current = canvas.__plotHover?.x;
    const base = current === undefined ? -1 : xs.findIndex((x) => x >= current);
    let index;
    if (event.key === 'ArrowRight') index = base < 0 ? 0 : Math.min(xs.length - 1, base + 1);
    else if (event.key === 'ArrowLeft') index = base < 0 ? xs.length - 1 : Math.max(0, base - 1);
    else if (event.key === 'Home') index = 0;
    else index = xs.length - 1;
    const next = hoverAt(canvas, xs[index]);
    if (next) {
      canvas.__plotHover = next;
      redraw();
      announce(next);
    }
  });

  if ('ResizeObserver' in window) {
    let last = 0;
    const observer = new ResizeObserver(() => {
      const width = canvas.parentElement?.clientWidth || 0;
      if (Math.abs(width - last) < 2) return;
      last = width;
      redraw();
    });
    observer.observe(canvas.parentElement);
    canvas.__plotObserver = observer;
  }
}

function refColor(color, C) {
  const text = String(color || '');
  if (/rgba\(\s*255\s*,\s*180\s*,\s*84/.test(text)) return rgba(C.amber, 0.65);
  if (/rgba\(\s*110\s*,\s*240\s*,\s*168/.test(text)) return rgba(C.green, 0.65);
  return color || rgba(C.amber, 0.55);
}

export function drawPlot(canvas, spec) {
  canvas.__plotSpec = spec;
  if (spec.interactive !== false) {
    bindPlot(canvas);
    ensureSaveButton(canvas);
    canvas.closest('.canvas-wrap')?.classList.add('is-interactive');
    canvas.setAttribute('aria-label', plotSummary(spec));
  }
  renderPlot(canvas, spec, canvas.__plotHover || null);
}
