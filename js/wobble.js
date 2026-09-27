/* =====================================================================
 * CLEANER — Bordes vivos (SVG + SMIL 7 fps)
 * Cada elemento .wobbly recibe dos SVG absolutos:
 *   - .wb-shadow (z-index -1): sombra "cartoon" desplazada, temblorosa
 *   - .wb-line   (z-index  2): el trazo del borde, tembloroso
 * Los trazos se generan por tamaño real del elemento (ResizeObserver),
 * así nunca quedan cortados ni "terminan donde no deben".
 * Variables CSS por elemento:
 *   --wb-w (grosor, px) · --wb-off (sombra, px; 0 = sin) · --wb-dash (1 = punteado)
 * ===================================================================== */
(function () {
    'use strict';
    const NS = 'http://www.w3.org/2000/svg';
    const FRAMES = 4;
    const DUR = (FRAMES / 7).toFixed(3) + 's';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function rnd(seed) { let s = seed % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

    // Perímetro de un rectángulo redondeado muestreado, con jitter perpendicular
    function roughRect(w, h, r, amp, seed) {
        const rand = rnd(seed);
        r = Math.max(0, Math.min(r, w / 2, h / 2));
        const pts = [];
        const step = 16;
        const edge = (x0, y0, x1, y1, nx, ny) => {
            const len = Math.hypot(x1 - x0, y1 - y0);
            const n = Math.max(1, Math.round(len / step));
            for (let i = 0; i < n; i++) {
                const t = i / n;
                const j = (rand() - 0.5) * 2 * amp;
                pts.push([x0 + (x1 - x0) * t + nx * j, y0 + (y1 - y0) * t + ny * j]);
            }
        };
        const arc = (cx, cy, a0) => {
            const n = Math.max(2, Math.round(r / 6));
            for (let i = 0; i < n; i++) {
                const a = a0 + (i / n) * Math.PI / 2;
                const j = (rand() - 0.5) * amp;
                pts.push([cx + Math.cos(a) * (r + j), cy + Math.sin(a) * (r + j)]);
            }
        };
        edge(r, 0, w - r, 0, 0, 1); arc(w - r, r, -Math.PI / 2);
        edge(w, r, w, h - r, 1, 0); arc(w - r, h - r, 0);
        edge(w - r, h, r, h, 0, 1); arc(r, h - r, Math.PI / 2);
        edge(0, h - r, 0, r, 1, 0); arc(r, r, Math.PI);
        // suavizado con cuadráticas entre puntos medios
        const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const f = v => v.toFixed(1);
        let m = mid(pts[pts.length - 1], pts[0]);
        let d = `M${f(m[0])} ${f(m[1])}`;
        for (let i = 0; i < pts.length; i++) {
            const p = pts[i], q = mid(p, pts[(i + 1) % pts.length]);
            d += `Q${f(p[0])} ${f(p[1])} ${f(q[0])} ${f(q[1])}`;
        }
        return d + 'Z';
    }

    const PAD = 10;
    function build(el) {
        const w = el.offsetWidth, h = el.offsetHeight;
        if (!w || !h) return;
        const key = w + 'x' + h;
        if (el._wbKey === key) return;
        el._wbKey = key;
        const cs = getComputedStyle(el);
        // Seguro: el marco es absoluto; si el contenedor quedó "static" se iría a otro lado
        if (cs.position === 'static') el.style.position = 'relative';
        const bw = parseFloat(cs.getPropertyValue('--wb-w')) || 2;
        const off = parseFloat(cs.getPropertyValue('--wb-off')) || 0;
        const dash = (cs.getPropertyValue('--wb-dash') || '').trim() === '1';
        const r = parseFloat(cs.borderTopLeftRadius) || 0;
        const amp = Math.min(1.6, 0.8 + Math.min(w, h) / 400);
        const seed0 = Math.floor(Math.random() * 1e6) + 7;
        const paths = Array.from({ length: FRAMES }, (_, i) => roughRect(w, h, r, amp, seed0 + i * 977));
        const anim = reduce ? '' : `<animate attributeName="d" values="${paths.join(';')}" dur="${DUR}" calcMode="discrete" repeatCount="indefinite"/>`;
        const vb = `${-PAD} ${-PAD} ${w + PAD * 2} ${h + PAD * 2}`;
        const style = `left:${-PAD}px;top:${-PAD}px;width:${w + PAD * 2}px;height:${h + PAD * 2}px`;

        let line = el.querySelector(':scope > .wb-line');
        if (!line) {
            line = document.createElementNS(NS, 'svg');
            line.setAttribute('class', 'wb-line'); line.setAttribute('aria-hidden', 'true');
            el.appendChild(line);
        }
        line.setAttribute('viewBox', vb); line.setAttribute('style', style);
        let shadow = '';
        if (off > 0) {
            // sombra "cartoon": la misma silueta desplazada, recortada para que solo asome por fuera
            const id = 'wbm' + (++uid);
            const panim = reduce ? '' : `<animate attributeName="d" values="${paths.slice(2).concat(paths.slice(0, 2)).join(';')}" dur="${DUR}" calcMode="discrete" repeatCount="indefinite"/>`;
            shadow = `<mask id="${id}" maskUnits="userSpaceOnUse" x="${-PAD}" y="${-PAD}" width="${w + PAD * 2}" height="${h + PAD * 2}">` +
                `<rect x="${-PAD}" y="${-PAD}" width="${w + PAD * 2}" height="${h + PAD * 2}" fill="#fff"/><path d="${paths[0]}" fill="#000">${anim}</path></mask>` +
                `<g mask="url(#${id})"><path d="${paths[2]}" transform="translate(${off} ${off + 1})" fill="var(--wb-color, #231F1B)">${panim}</path></g>`;
        }
        line.innerHTML = shadow + `<path d="${paths[0]}" fill="none" stroke="var(--wb-color, #231F1B)" stroke-width="${bw + 0.4}" stroke-linejoin="round" stroke-linecap="round"${dash ? ' stroke-dasharray="7 6"' : ''}>${anim}</path>`;
    }
    let uid = 0;

    const ro = new ResizeObserver(entries => entries.forEach(e => build(e.target)));
    function attach(el) {
        if (el._wb) return;
        el._wb = true;
        el.classList.add('wb-ready');
        build(el);
        ro.observe(el);
    }
    function scan(root) {
        if (root.nodeType !== 1) return;
        if (root.classList.contains('wobbly')) attach(root);
        root.querySelectorAll('.wobbly').forEach(attach);
    }

    function init() {
        scan(document.body);
        new MutationObserver(muts => muts.forEach(m => m.addedNodes.forEach(scan))).observe(document.body, { childList: true, subtree: true });
        // Las fuentes cambian medidas: recalcular cuando carguen
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => document.querySelectorAll('.wobbly').forEach(el => { el._wbKey = ''; build(el); }));
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    window.Wobble = { scan, build };
})();
