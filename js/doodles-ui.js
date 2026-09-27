/* =====================================================================
 * CLEANER — Doodles de interfaz (parte 2)
 *  - Título "CLEANER" dibujado a mano con mugre que se lava con jabón
 *  - Botón CTA: Claude (con cara de "ya no puedo") limpiando a un robot
 *  - Logo del Modo Forense (Claude detective)
 *  - Iconos de intensidad, iconos de botones y tarjetas de enlaces
 * Todo SVG + SMIL a 7 fps (calcMode discrete).
 * ===================================================================== */
(function (global) {
    'use strict';
    const D = global.Doodles;
    const { INK, OR, BLUE, SOAP, YEL, A, T, rep, win, shift, S, hand, nextId, svg, star, blinkStar, claude } = D.helpers;
    const MUD = '#6E4B2F';

    /* ---------- utilidades de animación ---------- */
    // Interpolación lineal entre keyframes: keys = [[frame, n1, n2...], ...]
    function tl(N, keys) {
        const out = [];
        for (let f = 0; f < N; f++) {
            let a = keys[0], b = keys[keys.length - 1];
            for (let i = 0; i < keys.length; i++) {
                if (keys[i][0] <= f) a = keys[i];
                if (keys[i][0] >= f) { b = keys[i]; break; }
            }
            const t = b[0] === a[0] ? 0 : (f - a[0]) / (b[0] - a[0]);
            out.push(a.slice(1).map((v, i) => +(v + (b[i + 1] - v) * t).toFixed(1)).join(' '));
        }
        return out.join(';');
    }
    const seq = (N, fn) => Array.from({ length: N }, (_, f) => fn(f)).join(';');
    function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
    // Versión estática (sin animaciones) de un SVG
    const still = html => html.replace(/<animate(Transform)?\b[^>]*\/>/g, '');

    /* =================================================================
     * Título CLEANER
     * ================================================================= */
    function title() {
        const N = 42;
        const m = nextId('tm');
        const L = {
            C: 'M62 52 Q40 34 22 50 Q4 68 8 96 Q12 134 40 138 Q58 142 66 124',
            L: 'M14 42 L12 136 L62 134',
            E: 'M60 44 L14 44 L12 136 L62 136 M13 90 L50 88',
            A: 'M6 138 L36 42 L66 138 M18 106 L56 104',
            N: 'M10 138 L12 44 L60 136 L62 42',
            R: 'M12 138 L12 44 Q62 38 60 70 Q58 96 14 94 M30 94 L66 138'
        };
        const word = [['C', 14], ['L', 98], ['E', 168], ['A', 246], ['N', 330], ['E', 412], ['R', 494]];
        const line = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;
        let letters = '';
        word.forEach(([ch, x], i) => {
            const d = L[ch];
            letters += `<g transform="translate(${x} 0)"><g>${T('translate', shift('0 0;0 -3;1 -1;-1 1', i))}${T('rotate', shift('-2 36 90;1 36 90;-1 36 90;2 36 90', i))}
                <path d="${d}" ${line} stroke="${INK}" stroke-width="25" transform="translate(6 6)"/>
                <path d="${d}" ${line} stroke="${INK}" stroke-width="25"/>
                <path d="${d}" ${line} stroke="${OR}" stroke-width="14"/>
                <path d="${d}" ${line} stroke="#FFD9BF" stroke-width="3.2" stroke-dasharray="10 16" transform="translate(-3 -3)"/></g></g>`;
        });

        // mugre (determinista)
        const r = rng(91);
        let grunge = '';
        for (let i = 0; i < 16; i++) {
            const cx = 20 + r() * 550, cy = 52 + r() * 88, rad = 7 + r() * 14;
            let d = '';
            for (let k = 0; k < 8; k++) {
                const a = (k / 8) * Math.PI * 2;
                const rr = rad * (0.6 + r() * 0.6);
                d += (k ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1) + ' ';
            }
            grunge += `<path d="${d}Z" fill="${i % 3 ? MUD : '#8A6A48'}" opacity=".82" stroke="${MUD}" stroke-width="2" stroke-linejoin="round"/>`;
        }
        for (let i = 0; i < 46; i++) grunge += `<circle cx="${(10 + r() * 570).toFixed(1)}" cy="${(40 + r() * 110).toFixed(1)}" r="${(1.2 + r() * 3).toFixed(1)}" fill="${MUD}" opacity=".85"/>`;
        for (let i = 0; i < 6; i++) {
            const x = 40 + r() * 510, y = 110 + r() * 25;
            grunge += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} q2 12 0 ${(12 + r() * 16).toFixed(1)}" stroke="${MUD}" stroke-width="4" stroke-linecap="round" fill="none"/>`;
        }
        grunge += `<path d="M60 70 L150 60 M300 120 L420 112 M470 64 L560 78" stroke="${MUD}" stroke-width="2" stroke-dasharray="3 5" fill="none"/>`;

        // barrido de esponja
        const sweep = tl(N, [[0, -80], [9, 0], [24, 610], [25, 700], [33, 700], [34, 0], [41, 0]]);
        const maskX = sweep.split(';').map((v, f) => (f >= 34 ? 0 : Math.max(0, +v))).join(';');
        const dirtOp = seq(N, f => (f < 34 ? 1 : [0.12, 0.25, 0.4, 0.55, 0.7, 0.82, 0.92, 1][f - 34]));
        const sy = seq(N, f => (f % 2 ? 58 : 112));
        const spongeT = sweep.split(';').map((x, f) => `${x} ${sy.split(';')[f]}`).join(';');
        const sponge = `<g>${T('translate', spongeT)}${A('opacity', seq(N, f => (f >= 25 && f <= 33 ? 0 : 1)))}<g transform="rotate(-12)">
            <rect x="-26" y="-18" width="52" height="36" rx="9" fill="${YEL}" ${S} stroke-width="3"/>
            <rect x="-26" y="6" width="52" height="12" rx="4" fill="#5FBF6A" ${S} stroke-width="3"/>
            <circle cx="-12" cy="-6" r="3.4" fill="#E0B32E"/><circle cx="6" cy="-9" r="2.6" fill="#E0B32E"/><circle cx="14" cy="-1" r="3" fill="#E0B32E"/>
            <circle cx="-30" cy="-16" r="9" fill="#fff" ${S} stroke-width="2"/><circle cx="-38" cy="-4" r="7" fill="#fff" ${S} stroke-width="2"/><circle cx="-34" cy="10" r="6" fill="#fff" ${S} stroke-width="2"/></g></g>`;

        // burbujas que deja la esponja
        let foam = '';
        for (let i = 0; i < 10; i++) {
            const bx = 30 + i * 58, by = 50 + (i % 3) * 36;
            const on = Math.round(9 + (bx / 610) * 15);
            const op = seq(N, f => (f >= on && f < on + 8 ? 1 : 0));
            const tr = seq(N, f => (f >= on && f < on + 8 ? `0 ${-(f - on) * 5}` : '0 0'));
            foam += `<g transform="translate(${bx} ${by})"><g>${T('translate', tr)}${A('opacity', op)}<circle r="${6 + (i % 3) * 2}" fill="${SOAP}" stroke="${BLUE}" stroke-width="2.2"/><path d="M-3 -2 Q-2 -5 1 -5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g></g>`;
        }
        // brillitos de "limpio"
        let shine = '';
        [[40, 38], [190, 30], [300, 150], [420, 32], [560, 44]].forEach(([x, y], i) => {
            shine += `<g opacity="0">${A('opacity', seq(N, f => (f >= 24 + (i % 3) && f <= 33 ? (f % 2 ? 1 : 0.5) : 0)))}${star(x, y, 11 + (i % 2) * 4)}</g>`;
        });

        const body = `<defs><mask id="${m}" maskUnits="userSpaceOnUse" x="-20" y="0" width="640" height="190"><rect x="0" y="0" width="700" height="190" fill="#fff">${A('x', maskX)}</rect></mask></defs>` +
            letters +
            `<g mask="url(#${m})"><g>${A('opacity', dirtOp)}${grunge}</g></g>` +
            foam + shine + sponge;
        return svg('-10 20 610 160', body, 'doodle-title', 'CLEANER');
    }

    /* =================================================================
     * Botón CTA: Claude cansadísimo limpiando a un robot
     * ================================================================= */
    /* ---------- CTA v2: loop de 4 s con historia ----------
     *  0–13 Claude talla al robot (espuma, la mugre se va)
     * 14–20 robot rechinando de limpio (^^ + brillos); Claude se seca el sudor: "ufff…"
     * 21–22 ¡splat! cae un lodazal del cielo sobre el robot
     * 23–27 Claude, cara de culo total: "¿otra vez?" y vuelve a empezar */
    function cta() {
        const N = 28;
        const P = f => (f < 14 ? 'scrub' : f < 21 ? 'rest' : f < 23 ? 'splat' : 'again');
        const on = test => seq(N, f => (test(f) ? 1 : 0));
        // mugre del robot: se va mientras talla, vuelve con el splat
        const dirt = seq(N, f => (f < 14 ? Math.max(0, 1 - f / 12).toFixed(2) : f < 21 ? 0 : 1));
        const scrub = ['0 0', '8 -8', '2 -2', '9 6', '1 0', '8 -10', '1 -3', '9 7', '0 0', '8 -8', '2 -2', '9 6', '0 0', '6 -4'];
        const spongePos = seq(N, f => (f < 14 ? scrub[f] : f < 21 ? '-18 26' : f < 23 ? '-18 26' : ['-18 26', '-10 16', '-4 6', '0 0', '0 0'][f - 23]));
        const [sx, sy] = [110, 34];
        const armX2 = spongePos.split(';').map(p => sx + +p.split(' ')[0]).join(';');
        const armY2 = spongePos.split(';').map(p => sy + +p.split(' ')[1]).join(';');
        const robot = `<g transform="translate(134 50)"><g>${T('rotate', seq(N, f => (P(f) === 'scrub' ? [0, -3, 0, 3][f % 4] : P(f) === 'rest' ? [0, -6, 0, 6][f % 4] : P(f) === 'splat' ? -8 : 0)))}${T('translate', seq(N, f => (P(f) === 'rest' && f % 2 ? '0 -3' : P(f) === 'splat' ? '0 3' : '0 0')))}
            <path d="M0 -26 V-34" ${S} stroke-width="2"/><circle cx="0" cy="-36" r="3.6" fill="#E86A5C" ${S} stroke-width="1.6">${A('fill', seq(N, f => (P(f) === 'rest' ? (f % 2 ? YEL : '#7DF0C8') : f % 4 < 2 ? '#E86A5C' : '#FFB3A8')))}</circle>
            <rect x="-20" y="-26" width="40" height="30" rx="6" fill="#C9D3DC" ${S}/>
            <rect x="-15" y="-21" width="30" height="18" rx="4" fill="#2A3440" stroke="${INK}" stroke-width="1.6"/>
            <g>${A('opacity', on(f => P(f) === 'scrub'))}<path d="M-11 -13 H-4 M4 -13 H11" stroke="#7DF0C8" stroke-width="2.4" stroke-linecap="round"/></g>
            <g opacity="0">${A('opacity', on(f => P(f) === 'rest'))}<path d="M-11 -10 L-7 -15 L-3 -10 M3 -10 L7 -15 L11 -10" fill="none" stroke="#7DF0C8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>
            <g opacity="0">${A('opacity', on(f => f >= 21))}<path d="M-11 -15 L-5 -9 M-5 -15 L-11 -9 M5 -15 L11 -9 M11 -15 L5 -9" stroke="#FF8A7A" stroke-width="2.2" stroke-linecap="round"/></g>
            <rect x="-14" y="4" width="28" height="22" rx="4" fill="#AEB9C4" ${S}/>
            <circle cx="-5" cy="14" r="2.4" fill="${OR}"/><circle cx="4" cy="14" r="2.4" fill="${BLUE}"/>
            <path d="M14 10 L24 4" ${S} stroke-width="2.4"/>
            <g>${A('opacity', on(f => P(f) !== 'rest'))}<path d="M-14 10 L-24 16" ${S} stroke-width="2.4"/></g>
            <g opacity="0">${A('opacity', on(f => P(f) === 'rest'))}<path d="M-14 10 L-24 0" ${S} stroke-width="2.4"/><rect x="-30" y="-8" width="9" height="9" rx="2" fill="#AEB9C4" ${S} stroke-width="1.6"/><path d="M-26 -8 V-13" ${S} stroke-width="2.4"/></g>
            <path d="M-8 26 V32 M8 26 V32" ${S} stroke-width="2.6"/>
            <g>${A('opacity', dirt)}<path d="M-20 -26 Q-12 -20 -6 -26 Q2 -18 10 -26 Q16 -20 20 -26 V-16 Q12 -12 4 -18 Q-6 -10 -20 -16Z" fill="${MUD}"/><circle cx="-15" cy="-2" r="4" fill="${MUD}"/><circle cx="12" cy="0" r="3.4" fill="${MUD}"/><circle cx="-8" cy="20" r="3.2" fill="${MUD}"/><circle cx="7" cy="16" r="2.4" fill="${MUD}"/><path d="M-4 -26 q1 7 0 12 M9 4 q1 5 0 9" stroke="${MUD}" stroke-width="2.6" stroke-linecap="round"/></g></g></g>`;
        // espuma que se acumula mientras talla
        const foam = [[120, 30, 6, 3], [146, 22, 7, 6], [128, 58, 5, 8], [150, 48, 6, 10], [136, 14, 5, 12]].map(([x, y, r, s]) =>
            `<g opacity="0">${A('opacity', on(f => f >= s && f < 21))}<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" ${S} stroke-width="1.6"/><path d="M${x - r / 2} ${y - 1} q1 -3 4 -3" stroke="${BLUE}" stroke-width="1.4" fill="none"/></g>`).join('');
        const shine = [[112, 12, 6], [160, 26, 7], [158, 70, 5]].map(([x, y, r], i) =>
            `<g opacity="0">${A('opacity', seq(N, f => (P(f) === 'rest' ? ((f + i) % 2 ? 1 : 0.3) : 0)))}${star(x, y, r)}</g>`).join('');
        const splat = `<g opacity="0">${A('opacity', on(f => f >= 20 && f <= 22))}<g>${T('translate', seq(N, f => (f === 20 ? '0 -30' : f === 21 ? '0 -6' : '0 0')))}
            <path d="M118 10 Q126 -2 134 8 Q142 -4 150 10 Q158 16 148 20 Q134 26 120 20 Q110 16 118 10Z" fill="${MUD}" ${S} stroke-width="1.8"/></g></g>
            <g opacity="0">${A('opacity', on(f => f >= 21 && f <= 23))}${hand(162, 12, '¡splat!', 15, 'text-anchor="middle"', MUD)}</g>`;
        const sponge = `<g transform="translate(${sx} ${sy})"><g>${T('translate', spongePos)}<rect x="-9" y="-7" width="18" height="14" rx="4" fill="${YEL}" ${S} stroke-width="1.8"/><rect x="-9" y="3" width="18" height="4" rx="2" fill="#5FBF6A" stroke="${INK}" stroke-width="1.4"/></g></g>`;
        const arm = `<line x1="60" y1="46" x2="${sx}" y2="${sy}" ${S} stroke-width="3.4">${A('x2', armX2)}${A('y2', armY2)}</line>`;
        // brazo izquierdo: se seca el sudor en "rest"
        const wipe = `<g opacity="0">${A('opacity', on(f => P(f) === 'rest'))}<line x1="24" y1="48" x2="30" y2="26" ${S} stroke-width="3.4">${A('x2', '24;32;40;32;24;32;40')}</line></g>`;
        const faceTired = `<g>${A('opacity', on(f => P(f) === 'scrub'))}${claude({ x: 42, y: 56, s: 0.42, eyes: 'tired', blink: false })}</g>`;
        const faceUff = `<g opacity="0">${A('opacity', on(f => P(f) === 'rest' || P(f) === 'splat'))}${claude({ x: 42, y: 56, s: 0.42, eyes: 'none', extra: `<path d="M-28 -10 H-14 M14 -10 H28" ${S} stroke-width="3.4"/><ellipse cx="0" cy="12" rx="6" ry="7" fill="${INK}"/><path d="M-26 -1 Q-20 2 -14 -1 M14 -1 Q20 2 26 -1" fill="none" stroke="#B4562A" stroke-width="1.8"/>` })}</g>`;
        const faceMad = `<g opacity="0">${A('opacity', on(f => P(f) === 'again'))}${claude({ x: 42, y: 56, s: 0.42, eyes: 'none', bob: '0 0;1 0', extra: `<rect x="-26" y="-10" width="11" height="4" fill="${INK}"/><rect x="15" y="-10" width="11" height="4" fill="${INK}"/><path d="M-30 -20 L-12 -14 M30 -20 L12 -14" ${S} stroke-width="3"/><path d="M-10 13 Q0 7 10 13" fill="none" ${S} stroke-width="2.6"/><path d="M28 -30 l4 -4 m-4 0 l4 4" stroke="#D9483B" stroke-width="2.4" stroke-linecap="round"/>` })}</g>`;
        const sweat = `<g transform="translate(18 20)"><g>${T('translate', seq(N, f => `0 ${(f % 7) * 3}`))}${A('opacity', seq(N, f => (f % 7 < 5 ? 1 : 0)))}<path d="M0 -5 Q4 0 0 4 Q-4 0 0 -5Z" fill="${BLUE}" stroke="${INK}" stroke-width="1.4"/></g></g>`;
        const texts = `<g opacity="0">${A('opacity', on(f => P(f) === 'rest'))}${hand(6, 13, 'ufff…', 16)}</g>` +
            `<g opacity="0">${A('opacity', on(f => P(f) === 'again'))}${hand(4, 13, '¿otra vez?', 15, '', '#D9483B')}</g>` +
            `<g opacity="0">${A('opacity', on(f => P(f) === 'scrub' && f > 3))}${hand(10, 13, 'talla, talla…', 13, '', '#8C8378')}</g>`;
        const body = `<path d="M4 82 Q80 78 172 82" fill="none" ${S} stroke-width="2"/>` +
            faceTired + faceUff + faceMad + wipe + robot + foam + arm + sponge + splat + shine + sweat + texts;
        return svg('0 0 176 88', body, 'doodle-cta');
    }

    /* ---------- CLEANER en pequeño (nav / footer) ---------- */
    function wordmark(color = OR, shadow = INK) {
        const L = {
            C: 'M62 52 Q40 34 22 50 Q4 68 8 96 Q12 134 40 138 Q58 142 66 124',
            L: 'M14 42 L12 136 L62 134',
            E: 'M60 44 L14 44 L12 136 L62 136 M13 90 L50 88',
            A: 'M6 138 L36 42 L66 138 M18 106 L56 104',
            N: 'M10 138 L12 44 L60 136 L62 42',
            R: 'M12 138 L12 44 Q62 38 60 70 Q58 96 14 94 M30 94 L66 138'
        };
        const word = [['C', 14], ['L', 98], ['E', 168], ['A', 246], ['N', 330], ['E', 412], ['R', 494]];
        const line = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';
        const letters = word.map(([ch, x], i) => `<g transform="translate(${x} 0)"><g>${T('translate', shift('0 0;0 -4;2 -1;-1 2', i))}
            <path d="${L[ch]}" ${line} stroke="${shadow}" stroke-width="30" transform="translate(7 7)"/>
            <path d="${L[ch]}" ${line} stroke="${shadow}" stroke-width="30"/>
            <path d="${L[ch]}" ${line} stroke="${color}" stroke-width="16"/></g></g>`).join('');
        return svg('-12 22 612 136', letters, 'doodle-wordmark', 'CLEANER');
    }

    /* ---------- Iconos de navegación ---------- */
    const nav = {
        clean: () => svg('0 0 32 32', `<g transform="translate(22 3)"><g>${T('rotate', '-24;-8;10;-8')}<path d="M0 0 L-6 15" stroke="#C58B4E" stroke-width="3" stroke-linecap="round"/><path d="M-11 14 L-2 17 L-5 28 L-17 24 Z" fill="${YEL}" ${S} stroke-width="1.8"/></g></g>` +
            `<g>${A('opacity', '1;0;1;1')}${star(7, 8, 4)}</g>`, 'doodle-btn'),
        how: () => svg('0 0 32 32', `<g transform="translate(16 16)"><g>${T('rotate', '0;45;90;135')}<path d="M0 -12 L3 -8 L8 -9 L8 -4 L12 0 L8 4 L8 9 L3 8 L0 12 L-3 8 L-8 9 L-8 4 L-12 0 L-8 -4 L-8 -9 L-3 -8 Z" fill="#FFE98A" ${S} stroke-width="1.8"/></g><circle r="4" fill="#fff" ${S} stroke-width="1.8"/></g>`, 'doodle-btn'),
        links: () => svg('0 0 32 32', `<g>${T('translate', '0 0;1 -1;0 0;-1 1')}<rect x="3" y="11" width="16" height="10" rx="5" fill="none" ${S} stroke-width="2.6" transform="rotate(-30 11 16)"/></g><g>${T('translate', '0 0;-1 1;0 0;1 -1')}<rect x="13" y="11" width="16" height="10" rx="5" fill="none" stroke="${OR}" stroke-width="2.6" transform="rotate(-30 21 16)"/></g>`, 'doodle-btn'),
        squiggle: () => `<svg class="nav-squiggle" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><path d="M2 4 Q14 0 26 4 T50 4 T74 4 T98 4" fill="none" stroke="${OR}" stroke-width="2.4" stroke-linecap="round">${A('d', 'M2 4 Q14 0 26 4 T50 4 T74 4 T98 4;M2 4 Q14 8 26 4 T50 4 T74 4 T98 4')}</path></svg>`
    };

    /* ---------- Footer ---------- */
    function footerScene() {
        // Fin del turno: Claude dormido recargado en la escoba, con el cubo al lado
        const zz = [0, 3].map(k => `<g transform="translate(96 30)"><g>${T('translate', shift('0 0;4 -5;8 -10;12 -15;16 -20;20 -25', k))}${A('opacity', shift('1;1;.8;.6;.3;0', k))}${hand(0, 0, 'z', 16 + k * 2)}</g></g>`).join('');
        const broom = `<path d="M40 80 L58 20" stroke="#C58B4E" stroke-width="4" stroke-linecap="round"/><path d="M50 16 L68 22 L62 6 L54 4 Z" fill="${YEL}" ${S} stroke-width="1.8" transform="rotate(180 59 13) translate(0 -2)"/>`;
        const pail = `<path d="M118 60 L146 60 L142 84 Q132 88 122 84 Z" fill="#CFE3F0" ${S} stroke-width="2"/><path d="M118 60 Q132 50 146 60" fill="none" ${S} stroke-width="1.8"/><path d="M120 63 Q132 66 144 63" stroke="${BLUE}" stroke-width="3"/>`;
        const bub = `<g transform="translate(138 52)"><g>${T('translate', '0 0;0 -4;0 -8;0 -12;0 -14')}${A('opacity', '1;1;.7;.4;0')}<circle r="3" fill="#fff" stroke="${BLUE}" stroke-width="1.4"/></g></g>`;
        const body = `<path d="M6 88 Q80 84 164 88" fill="none" ${S} stroke-width="2"/>` + broom +
            claude({ x: 70, y: 64, s: 0.38, eyes: 'none', bob: '0 0;0 0;0 1;0 1', extra: `<path d="M-28 -10 Q-20 -5 -12 -10 M12 -10 Q20 -5 28 -10" fill="none" ${S} stroke-width="3"/><circle cx="4" cy="12" r="3" fill="${INK}"/><path d="M-40 -34 L-46 -54 Q-30 -48 -14 -34 Z" fill="${BLUE}" ${S} stroke-width="2"/><circle cx="-46" cy="-56" r="5" fill="#fff" ${S} stroke-width="2"/>` }) +
            pail + bub + zz;
        return svg('0 0 170 94', body, 'doodle-footer');
    }
    function footerWave() {
        const w = [
            'M0 34 V18 Q60 4 120 16 T240 14 T360 18 T480 12 T600 18 T720 12 T840 16 T960 12 T1080 18 T1200 14 V34 Z',
            'M0 34 V16 Q60 24 120 14 T240 18 T360 12 T480 18 T600 12 T720 18 T840 12 T960 18 T1080 12 T1200 16 V34 Z',
            'M0 34 V14 Q60 8 120 18 T240 12 T360 16 T480 14 T600 16 T720 14 T840 18 T960 14 T1080 16 T1200 12 V34 Z'
        ];
        return `<svg class="footer-wave" viewBox="0 0 1200 34" preserveAspectRatio="none" aria-hidden="true"><path d="${w[0]}" fill="${INK}">${A('d', w.join(';'))}</path></svg>`;
    }

    /* =================================================================
     * Logo del Modo Forense: Claude detective con lupa y pipa
     * ================================================================= */
    function forense() {
        const hat = `<path d="M-34 -30 Q-30 -68 0 -70 Q30 -68 34 -30 Z" fill="#8A5A36" ${S}/>
            <path d="M-26 -60 L26 -36 M-32 -44 L10 -66 M-10 -68 L32 -40" stroke="#5B3A20" stroke-width="2.4"/>
            <path d="M-44 -30 H44 Q40 -22 0 -22 Q-40 -22 -44 -30Z" fill="#A36B3F" ${S}/>
            <path d="M-6 -70 L0 -80 L6 -70" fill="#8A5A36" ${S} stroke-width="1.8"/>`;
        const pipe = `<path d="M8 10 Q22 16 30 12" fill="none" ${S} stroke-width="3"/><path d="M28 2 H40 V14 Q34 20 28 14 Z" fill="#5B3A20" ${S} stroke-width="2"/>`;
        const smoke = [0, 3].map(k => `<g transform="translate(34 -4)"><g>${T('translate', shift('0 0;3 -6;0 -12;4 -18;1 -24;5 -30', k))}${A('opacity', shift('.9;.8;.6;.45;.25;0', k))}<circle r="${5 - k}" fill="#fff" ${S} stroke-width="1.6"/></g></g>`).join('');
        const glass = `<g transform="translate(-48 18)"><g>${T('translate', '0 0;-4 -6;2 -10;6 -4;2 2;-2 0')}
            <path d="M8 10 L22 24" ${S} stroke-width="6"/>
            <circle r="17" fill="${SOAP}" ${S} stroke-width="3.4"/>
            <circle r="9" fill="#fff" stroke="${INK}" stroke-width="1.6"/>
            <circle r="5" fill="${INK}">${A('cx', '0;2;-2;0;3;-1')}${A('cy', '0;-1;1;2;0;-2')}</circle>
            <path d="M-10 -8 Q-6 -13 0 -13" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round">${A('opacity', '1;0;1;1;0;1')}</path></g></g>`;
        const body = claude({ x: 58, y: 58, s: 0.5, bob: '0 0;0 -2', extra: hat + pipe + smoke + glass }) +
            blinkStar(98, 14, 6, 0) + blinkStar(12, 18, 4, 3, BLUE);
        return svg('0 0 110 90', body, 'doodle-forense', 'Claude detective');
    }

    /* =================================================================
     * Iconos de intensidad (se animan al seleccionarlos)
     * ================================================================= */
    function intLow() {
        const sponge = `<g transform="translate(26 24)"><g>${T('translate', '0 0;0 -3;0 -5;0 -3;0 0;0 1')}<rect x="-12" y="-8" width="24" height="16" rx="5" fill="${SOAP}" ${S} stroke-width="2"/><rect x="-12" y="3" width="24" height="5" rx="2" fill="${BLUE}" ${S} stroke-width="2"/></g></g>`;
        const b = (x, k) => `<g transform="translate(${x} 14)"><g>${T('translate', shift('0 0;1 -3;-1 -6;0 -9;1 -12;0 -14', k))}${A('opacity', shift('1;1;.8;.5;.2;0', k))}<circle r="3.4" fill="#fff" stroke="${BLUE}" stroke-width="1.6"/></g></g>`;
        return svg('0 0 60 40', `<path d="M8 34 Q30 31 52 34" fill="none" ${S} stroke-width="1.8"/>` + sponge + b(42, 0) + b(48, 3) + b(12, 2), 'doodle-int');
    }
    function intMid() {
        const broom = `<g transform="translate(34 2)"><g>${T('rotate', '-24;-8;10;24;10;-8')}<path d="M0 0 L0 22" stroke="#C58B4E" stroke-width="3.4" stroke-linecap="round"/><path d="M-9 20 H9 L12 34 H-12 Z" fill="${YEL}" ${S} stroke-width="2"/><path d="M-5 26 V33 M0 26 V33 M5 26 V33" ${S} stroke-width="1.2"/></g></g>`;
        const puff = (x, k) => `<g transform="translate(${x} 32)"><g>${T('translate', shift('0 0;-3 -2;-6 -4;-9 -5;-12 -6;-14 -6', k))}${A('opacity', shift('1;.8;.6;.4;.2;0', k))}<circle r="4" fill="#E7DCCB" ${S} stroke-width="1.4"/></g></g>`;
        return svg('0 0 60 40', puff(20, 0) + puff(16, 3) + broom, 'doodle-int');
    }
    function intHigh() {
        const flames = `<g>${A('opacity', '1;.6;1;.8;1;.6')}<path d="M8 36 Q4 24 12 18 Q12 26 16 26 Q14 14 22 10 Q22 22 26 24 Q30 18 28 12 Q38 22 32 36 Z" fill="#FF8A3D" ${S} stroke-width="1.8"><animate attributeName="d" values="M8 36 Q4 24 12 18 Q12 26 16 26 Q14 14 22 10 Q22 22 26 24 Q30 18 28 12 Q38 22 32 36 Z;M8 36 Q6 22 13 16 Q14 24 17 24 Q16 10 23 7 Q24 20 27 22 Q32 14 30 9 Q40 22 32 36 Z;M8 36 Q3 26 11 20 Q12 27 15 27 Q13 16 21 12 Q21 23 25 25 Q29 20 27 14 Q36 24 32 36 Z" dur="${3 / 7}s" calcMode="discrete" repeatCount="indefinite"/></path><path d="M14 36 Q12 28 18 24 Q18 30 22 30 Q24 24 26 22 Q30 30 26 36Z" fill="${YEL}"/></g>`;
        const jet = `<g>${A('opacity', '1;1;0;1;1;0')}<path d="M40 16 L58 10 M40 20 L58 20 M40 24 L58 30" stroke="${BLUE}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="4 3"/></g>`;
        const gun = `<g>${T('translate', '0 0;1 -1;0 1;-1 0')}<path d="M30 14 H42 V22 H34 L32 30 H27 L29 22 Z" fill="#555" ${S} stroke-width="1.8"/></g>`;
        return svg('0 0 60 40', flames + gun + jet + hand(46, 40, '!!', 13, '', '#D9483B'), 'doodle-int');
    }

    /* =================================================================
     * Iconos para botones (32×32)
     * ================================================================= */
    const icons = {
        broom: () => svg('0 0 32 32', `<g transform="translate(20 2)"><g>${T('rotate', '-20;-6;10;-6')}<path d="M0 0 L-6 16" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path d="M-11 15 L-2 18 L-5 29 L-17 25 Z" fill="${YEL}" ${S} stroke-width="1.8"/></g></g>` +
            `<g>${T('translate', '0 0;-2 -1;-4 -2;-6 -3')}${A('opacity', '1;.7;.4;0')}<circle cx="8" cy="27" r="3" fill="#E7DCCB" ${S} stroke-width="1.2"/></g>`, 'doodle-btn'),
        trash: () => svg('0 0 32 32', `<path d="M8 12 H24 L22 29 H10 Z" fill="#fff" ${S} stroke-width="2"/><path d="M13 16 V25 M16 16 V25 M19 16 V25" ${S} stroke-width="1.4"/>` +
            `<g>${T('translate', '0 0;0 -4;0 -6;0 -4;0 0;0 0')}${T('rotate', '0 8 10;-12 8 10;-18 8 10;-12 8 10;0 8 10;0 8 10')}<path d="M6 10 H26 M13 10 V7 H19 V10" fill="none" ${S} stroke-width="2"/></g>`, 'doodle-btn'),
        zip: () => svg('0 0 32 32', `<g>${T('translate', '0 0;0 -2;0 0;0 1')}<path d="M5 12 L16 7 L27 12 L27 26 L16 30 L5 26 Z" fill="#D9A06A" ${S} stroke-width="2"/><path d="M5 12 L16 17 L27 12 M16 17 V30" fill="none" ${S} stroke-width="1.6"/><path d="M16 17 V29" stroke="${INK}" stroke-width="3" stroke-dasharray="1.6 1.6"/></g>` + blinkStar(27, 5, 3.4, 0), 'doodle-btn'),
        download: () => svg('0 0 32 32', `<path d="M5 22 V28 H27 V22" fill="none" ${S} stroke-width="2.4"/>` +
            `<g>${T('translate', '0 -4;0 -1;0 2;0 3;0 -4')}${A('opacity', '1;1;1;.4;0')}<path d="M16 4 V18 M10 13 L16 19 L22 13" fill="none" ${S} stroke-width="2.6"/></g>`, 'doodle-btn'),
        compare: () => svg('0 0 32 32', `<g>${T('translate', '0 0;2 0;4 0;2 0')}<rect x="3" y="7" width="15" height="18" rx="2" fill="#fff" ${S} stroke-width="2"/></g><g>${T('translate', '0 0;-2 0;-4 0;-2 0')}<rect x="14" y="7" width="15" height="18" rx="2" fill="${SOAP}" ${S} stroke-width="2"/></g><path d="M16 3 V29" stroke="${OR}" stroke-width="2" stroke-dasharray="3 2"/>`, 'doodle-btn'),
        soap: () => svg('0 0 32 32', [0, 2, 4].map((k, i) => `<g transform="translate(${8 + i * 8} 24)"><g>${T('translate', shift('0 0;1 -4;-1 -8;0 -12;1 -15;0 -18', k))}${A('opacity', shift('1;1;.8;.6;.3;0', k))}<circle r="${4 - i * 0.6}" fill="${SOAP}" stroke="${BLUE}" stroke-width="1.8"/></g></g>`).join(''), 'doodle-btn'),
        arrow: () => svg('0 0 40 30', `<g>${T('translate', '0 0;2 -1;4 -2;2 -1')}<path d="M4 22 Q14 4 32 10" fill="none" ${S} stroke-width="2.6"/><path d="M24 4 L33 10 L25 17" fill="none" ${S} stroke-width="2.6"/></g>`, 'doodle-arrow')
    };

    /* =================================================================
     * Tarjetas de enlaces
     * ================================================================= */
    function linkIdea() {
        const bulb = `<g transform="translate(0 -62)"><g>${T('translate', '0 0;0 -3;0 0;0 -2')}
            <g>${A('opacity', '0;1;1;0;1;1;1')}<path d="M0 -40 V-48 M-24 -30 L-30 -36 M24 -30 L30 -36 M-30 -12 H-38 M30 -12 H38" ${S} stroke-width="3"/></g>
            <path d="M0 -36 C-18 -36 -22 -18 -14 -6 C-10 0 -10 4 -10 8 H10 C10 4 10 0 14 -6 C22 -18 18 -36 0 -36 Z" fill="${YEL}" ${S}><animate attributeName="fill" values="#FFF3B0;${YEL};${YEL};#FFF3B0;${YEL};${YEL};${YEL}" dur="1s" calcMode="discrete" repeatCount="indefinite"/></path>
            <rect x="-10" y="8" width="20" height="10" rx="2" fill="#ddd" ${S}/></g></g>`;
        const body = claude({ x: 64, y: 100, s: 0.62, eyes: 'wow', blink: false, bob: '0 0;0 -3', extra: bulb }) +
            `<g opacity="0">${A('opacity', '0;0;1;1;1;1;0')}${hand(104, 30, '¡idea!', 20, 'text-anchor="middle"', OR)}</g>` + blinkStar(18, 30, 6, 2);
        return svg('0 0 130 130', body, 'doodle-linkcard');
    }
    function linkDetector() {
        const read = `<g>${A('opacity', '1;1;1;0;0;0;0')}${hand(92, 30, 'IA: ???', 18, 'text-anchor="middle"')}</g><g opacity="0">${A('opacity', '0;0;0;1;1;1;1')}${hand(92, 30, 'IA: 0 %', 18, 'text-anchor="middle"', '#2E9E5B')}</g>`;
        const glass = `<g transform="translate(60 76)"><g>${T('translate', '-16 -6;-8 -10;0 -8;8 -4;14 -8;4 -12;-8 -8')}<circle r="26" fill="${SOAP}" fill-opacity=".55" ${S} stroke-width="3.4"/><path d="M18 18 L34 34" ${S} stroke-width="7"/><path d="M-14 -12 Q-8 -20 0 -20" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/></g></g>`;
        const body = claude({ x: 60, y: 92, s: 0.55, eyes: 'happy', bob: '0 0;0 -2' }) + glass + read + blinkStar(118, 62, 6, 1, BLUE);
        return svg('0 0 130 130', body, 'doodle-linkcard');
    }

    Object.assign(D.pieces, { title, cta, forense, intLow, intMid, intHigh, linkIdea, linkDetector, arrow: icons.arrow,
        icoBroom: icons.broom, icoTrash: icons.trash, icoZip: icons.zip, icoSoap: icons.soap,
        wordmark: () => wordmark(), wordmarkLight: () => wordmark(OR, '#FBF6EC'),
        navClean: nav.clean, navHow: nav.how, navLinks: nav.links, navSquiggle: nav.squiggle,
        footerScene, footerWave });
    D.icons = icons;
    D.icon = name => (icons[name] ? icons[name]() : '');
    D.still = still;
    D.tl = tl;
    D.seq = seq;
})(window);
