/* =====================================================================
 * CLEANER — Doodles
 * Ilustraciones SVG "hechas a mano" animadas con SMIL a 7 fps.
 *  - Todas las animaciones usan calcMode="discrete" y frames de 1/7 s.
 *  - El trazo "tiembla" (boil) con feTurbulence + feDisplacementMap,
 *    cambiando de semilla 7 veces por segundo.
 *  - Claude = el personajito naranja cuadrado de patitas.
 * ===================================================================== */
(function (global) {
    'use strict';

    const INK = '#231F1B';
    const OR = '#EE7B3F';
    const BLUE = '#5DB7F0';
    const SOAP = '#DDF1FF';
    const YEL = '#FFD84D';
    const CHALK = '#F4F0E4';
    const FPS = 7;
    const VB = '0 0 260 190';

    /* ---------- helpers SMIL ---------- */
    const count = v => String(v).split(';').length;
    const dur = v => (count(v) / FPS).toFixed(3) + 's';
    const A = (attr, v) => `<animate attributeName="${attr}" values="${v}" dur="${dur(v)}" calcMode="discrete" repeatCount="indefinite"/>`;
    const T = (type, v) => `<animateTransform attributeName="transform" type="${type}" values="${v}" dur="${dur(v)}" calcMode="discrete" repeatCount="indefinite" additive="sum"/>`;
    const rep = (val, k) => Array(k).fill(val).join(';');
    const win = (N, a, b, on = 1, off = 0) => Array.from({ length: N }, (_, f) => (f >= a && f <= b ? on : off)).join(';');
    const shift = (v, k) => {
        const a = String(v).split(';');
        k = ((k % a.length) + a.length) % a.length;
        return a.slice(k).concat(a.slice(0, k)).join(';');
    };
    const S = `stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
    const hand = (x, y, txt, size = 18, extra = '', fill = INK) =>
        `<text x="${x}" y="${y}" font-family="Caveat, cursive" font-weight="700" font-size="${size}" fill="${fill}" ${extra}>${txt}</text>`;

    let uid = 0;
    const nextId = p => `${p}${++uid}`;

    function svg(vb, body, cls, label) {
        const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
        return `<svg class="doodle ${cls || ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" ${a11y}><g filter="url(#boil)">${body}</g></svg>`;
    }

    const ground = (w = 260, y = 174) =>
        `<path d="M10 ${y} Q ${w * 0.28} ${y - 4} ${w * 0.5} ${y} T ${w - 10} ${y - 1}" fill="none" ${S}/>`;

    const star = (x, y, r, fill = YEL) =>
        `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="${fill}" ${S} stroke-width="1.6"/>`;

    const blinkStar = (x, y, r, phase = 0, fill = YEL) =>
        `<g>${A('opacity', shift('1;1;0.2;0;0.6;1', phase))}${star(x, y, r, fill)}</g>`;

    function bubblePath(x, y, w, h, tx, px, py) {
        return `M${x + 10} ${y} H${x + w - 10} Q${x + w} ${y} ${x + w} ${y + 10} V${y + h - 10} Q${x + w} ${y + h} ${x + w - 10} ${y + h} ` +
            `H${tx + 12} L${px} ${py} L${tx} ${y + h} H${x + 10} Q${x} ${y + h} ${x} ${y + h - 10} V${y + 10} Q${x} ${y} ${x + 10} ${y}Z`;
    }

    const flashBurst = (x, y, r) => {
        let rays = '';
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            rays += `M${(x + Math.cos(a) * r * 0.55).toFixed(1)} ${(y + Math.sin(a) * r * 0.55).toFixed(1)} L${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)} `;
        }
        return `<path d="${rays}" ${S} stroke-width="2.6"/>${star(x, y, r * 0.5, '#FFF6B0')}`;
    };

    /* ---------- Claude ---------- */
    function claude(o = {}) {
        const {
            x = 0, y = 0, s = 1, eyes = 'square', walk = false, blink = true, bob = false,
            extra = '', under = '', color = OR, legColor = color, armColor = color
        } = o;
        const leg = lx => `<rect x="${lx}" y="26" width="10" height="20" fill="${legColor}" ${S}/>`;
        const legs = walk
            ? `<g>${T('translate', '0 0;0 -3')}${leg(-32)}${leg(4)}</g><g>${T('translate', '0 -3;0 0')}${leg(-14)}${leg(22)}</g>`
            : [-32, -14, 4, 22].map(leg).join('');
        let face = '';
        if (eyes === 'square') {
            const h = rep('8', 13) + ';1';
            const yy = rep('-14', 13) + ';-10.5';
            face = `<rect x="-24" y="-14" width="8" height="8" fill="${INK}">${blink ? A('height', h) + A('y', yy) : ''}</rect>` +
                   `<rect x="16" y="-14" width="8" height="8" fill="${INK}">${blink ? A('height', h) + A('y', yy) : ''}</rect>`;
        } else if (eyes === 'happy') {
            face = `<path d="M-27 -17 L-18 -11 L-27 -5" fill="none" ${S} stroke-width="3"/><path d="M25 -17 L16 -11 L25 -5" fill="none" ${S} stroke-width="3"/>`;
        } else if (eyes === 'wow') {
            face = `<circle cx="-20" cy="-10" r="5" fill="${INK}"/><circle cx="20" cy="-10" r="5" fill="${INK}"/><ellipse cx="0" cy="10" rx="5" ry="6" fill="${INK}"/>`;
        } else if (eyes === 'tired') {
            // cara de "ya no puedo más": párpados caídos, ojeras y boca chueca
            face = `<rect x="-26" y="-11" width="11" height="5" fill="${INK}"/><rect x="15" y="-11" width="11" height="5" fill="${INK}"/>` +
                `<path d="M-29 -13 L-12 -11 M29 -13 L12 -11" ${S} stroke-width="2.6"/>` +
                `<path d="M-26 -2 Q-20 1 -14 -2 M14 -2 Q20 1 26 -2" fill="none" stroke="#B4562A" stroke-width="1.8" stroke-linecap="round"/>` +
                `<path d="M-9 13 Q-4 9 0 12 Q5 15 10 10" fill="none" ${S} stroke-width="2.4"/>`;
        }
        const bobAnim = bob ? T('translate', bob === true ? '0 0;0 -2;0 0;0 1' : bob) : '';
        return `<g transform="translate(${x} ${y}) scale(${s})"><g>${bobAnim}${under}${legs}` +
            `<rect x="-58" y="-6" width="18" height="14" fill="${armColor}" ${S}/><rect x="40" y="-6" width="18" height="14" fill="${armColor}" ${S}/>` +
            `<rect x="-42" y="-34" width="84" height="62" rx="2" fill="${color}" ${S}/>${face}${extra}</g></g>`;
    }

    /* ---------- Defs globales (filtro boil) ---------- */
    function defs() {
        return `<svg width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>
<filter id="boil" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="2" result="n">${A('seed', '2;5;8;11')}</feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="wobf" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n">${A('seed', '3;17;29;41')}</feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="3.6" xChannelSelector="R" yChannelSelector="G"/></filter>
${[3, 17, 29, 41].map((sd, i) => `<filter id="wob${i + 1}" x="-4%" y="-8%" width="108%" height="116%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="${sd}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4.2" xChannelSelector="R" yChannelSelector="G"/></filter>`).join('')}
</defs></svg>`;
    }

    /* =================================================================
     * Piezas de interfaz
     * ================================================================= */
    function logo() {
        const broom = `<g transform="translate(31 5)"><g>${T('rotate', '-14;-4;8;-4')}
            <path d="M0 0 L-13 23" ${S} stroke="${INK}" stroke-width="3"/>
            <path d="M-18 21 L-8 27 L-14 40 L-30 34 Z" fill="${YEL}" ${S} stroke-width="2"/>
            <path d="M-20 29 L-24 35 M-15 31 L-19 38" ${S} stroke-width="1.6"/></g></g>`;
        return svg('0 0 44 44', broom + blinkStar(35, 34, 4, 0) + blinkStar(8, 10, 3, 3, BLUE), 'doodle-logo');
    }

    function hero() {
        const broom = `<g transform="translate(200 132)"><g>${T('rotate', '-18;-8;4;14;18;8;-4;-14')}
            <path d="M0 0 L30 60" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
            <path d="M0 0 L30 60" fill="none" stroke="#C58B4E" stroke-width="3.4" stroke-linecap="round"/>
            <path d="M20 56 L42 48 L62 80 L22 92 Z" fill="${YEL}" ${S}/>
            <path d="M20 58 L41 50" ${S} stroke-width="4"/>
            <path d="M30 70 L32 88 M40 66 L46 84 M49 62 L56 80" ${S} stroke-width="1.6"/></g></g>`;
        const puff = (x, y, k) => `<g transform="translate(${x} ${y})"><g>${T('translate', shift('0 0;5 -2;10 -4;15 -7;20 -9;25 -11;30 -13;35 -15', k))}${A('opacity', shift('1;1;.85;.7;.5;.35;.15;0', k))}
            <circle cx="0" cy="0" r="9" fill="#E7DCCB" ${S} stroke-width="1.8"/><circle cx="9" cy="-4" r="7" fill="#E7DCCB" ${S} stroke-width="1.8"/><circle cx="4" cy="5" r="6" fill="#E7DCCB" ${S} stroke-width="1.8"/></g></g>`;
        const bub = (x, y, r, k) => `<g transform="translate(${x} ${y})"><g>${T('translate', shift('0 0;2 -9;-1 -18;2 -27;0 -36;-2 -45;1 -54;0 -63', k))}${A('opacity', shift('1;1;1;1;1;.8;.5;0', k))}
            <circle r="${r}" fill="${SOAP}" ${S} stroke="${BLUE}" stroke-width="2"/><path d="M${-r * 0.5} ${-r * 0.2} Q${-r * 0.4} ${-r * 0.6} 0 ${-r * 0.6}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g></g>`;
        const body = ground(320, 206) +
            bub(38, 170, 11, 0) + bub(72, 150, 7, 3) + bub(26, 118, 6, 5) + bub(96, 180, 9, 6) +
            blinkStar(60, 60, 8, 0) + blinkStar(96, 30, 5, 2, BLUE) + blinkStar(30, 40, 6, 4) +
            claude({ x: 138, y: 142, s: 1.15, walk: true, extra: `<path d="M-10 10 Q0 17 10 10" fill="none" ${S} stroke-width="2.6"/>` }) +
            broom + puff(262, 196, 0) + puff(288, 186, 3) + puff(300, 200, 5);
        return svg('0 0 320 220', body, 'doodle-hero', 'Claude barriendo con una escoba');
    }

    function drop() {
        const sign = `<path d="M-50 0 L-42 -58 M50 0 L42 -58" fill="none" ${S} stroke-width="3"/>
            <rect x="-70" y="-96" width="140" height="40" rx="6" fill="#fff" ${S}/>
            ${hand(0, -69, '¡suéltalas aquí!', 23, 'text-anchor="middle"')}`;
        const photo = (x, k) => `<g transform="translate(${x} 20)"><g>${T('translate', shift('0 0;0 8;0 16;0 24;0 32;0 40;0 48', k))}${A('opacity', shift('1;1;1;1;.7;.3;0', k))}
            <rect x="-11" y="-9" width="22" height="18" rx="2" fill="#fff" ${S} stroke-width="2"/><path d="M-8 6 L-2 -1 L2 3 L5 0 L9 6 Z" fill="${BLUE}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><circle cx="-4" cy="-4" r="2" fill="${YEL}"/></g></g>`;
        return svg('0 0 240 150', photo(28, 0) + photo(212, 3) +
            claude({ x: 120, y: 104, s: 0.72, bob: true, extra: sign }), 'doodle-drop', 'Claude sosteniendo un cartel');
    }

    function bucket() {
        const bub = (x, r, k) => `<g transform="translate(${x} 66)"><g>${T('translate', shift('0 0;1 -9;-1 -18;1 -27;0 -36;-1 -45;0 -54', k))}${A('opacity', shift('1;1;1;.9;.7;.4;0', k))}
            <circle r="${r}" fill="${SOAP}" stroke="${BLUE}" stroke-width="2"/><path d="M${-r * 0.5} ${-r * 0.1} Q${-r * 0.4} ${-r * 0.6} 0 ${-r * 0.6}" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g></g>`;
        const waves = [
            'M30 78 Q50 70 70 78 T110 78 T140 78 L138 88 Q85 96 32 88 Z',
            'M30 78 Q50 84 70 76 T110 80 T140 76 L138 88 Q85 96 32 88 Z',
            'M30 76 Q50 70 70 80 T110 74 T140 78 L138 88 Q85 96 32 88 Z',
            'M30 80 Q50 74 70 76 T110 82 T140 76 L138 88 Q85 96 32 88 Z'
        ].join(';');
        const foam = `<g>${T('translate', '0 0;1 -1;0 1;-1 0')}
            <circle cx="46" cy="74" r="9" fill="#fff" ${S} stroke-width="1.8"/><circle cx="60" cy="69" r="10" fill="#fff" ${S} stroke-width="1.8"/>
            <circle cx="76" cy="74" r="8" fill="#fff" ${S} stroke-width="1.8"/><circle cx="116" cy="72" r="9" fill="#fff" ${S} stroke-width="1.8"/>
            <circle cx="128" cy="76" r="7" fill="#fff" ${S} stroke-width="1.8"/></g>`;
        const sponge = `<g transform="translate(96 66)"><g>${T('translate', '0 0;0 -3;0 -1;0 1')}<g>${T('rotate', '-6;0;6;0')}
            <rect x="-16" y="-10" width="32" height="20" rx="5" fill="${YEL}" ${S}/>
            <circle cx="-7" cy="-3" r="2.2" fill="#E0B32E"/><circle cx="5" cy="2" r="2.6" fill="#E0B32E"/><circle cx="9" cy="-5" r="1.8" fill="#E0B32E"/></g></g></g>`;
        const handle = `<g transform="translate(85 78)"><g>${T('rotate', '0;-4;0;4')}<path d="M-52 0 Q0 -86 52 0" fill="none" ${S} stroke-width="3.4"/></g></g>`;
        const body = handle +
            `<path d="M28 76 L142 76 L128 166 Q85 176 42 166 Z" fill="#CFE3F0" ${S}/>` +
            `<path d="M33 104 Q85 112 137 104 M37 136 Q85 144 133 136" fill="none" ${S} stroke-width="1.8"/>` +
            `<path d="${waves.split(';')[0]}" fill="${BLUE}" ${S}>${A('d', waves)}</path>` +
            foam + sponge +
            `<path d="M28 76 Q85 90 142 76" fill="none" ${S}/>` +
            bub(52, 6, 0) + bub(70, 4, 2) + bub(112, 7, 4) + bub(128, 4, 5) + bub(88, 5, 6) +
            `<g>${A('opacity', '0;0;0;0;1;1;0;0;0;0')}${hand(126, 30, 'blub', 18)}</g>`;
        return svg('0 0 170 180', body, 'doodle-bucket', 'Cubo con agua y jabón');
    }

    /* ---------- iconos de "cómo funciona" ---------- */
    function iconScan() {
        const photo = `<rect x="14" y="14" width="56" height="42" rx="3" fill="#fff" ${S}/><path d="M18 52 L34 34 L44 44 L52 38 L66 52 Z" fill="${BLUE}" ${S} stroke-width="1.8"/><circle cx="28" cy="25" r="4" fill="${YEL}" ${S} stroke-width="1.4"/>`;
        const lens = `<g transform="translate(46 34)"><g>${T('translate', '0 0;8 -4;14 4;6 12;-4 8;-8 0')}<circle r="13" fill="${SOAP}" fill-opacity=".6" ${S} stroke-width="3"/><path d="M9 9 L22 22" ${S} stroke-width="5"/></g></g>`;
        return svg('0 0 100 76', photo + lens, 'doodle-icon');
    }
    function iconClean() {
        const broom = `<g transform="translate(58 6)"><g>${T('rotate', '-16;-4;10;-4')}<path d="M0 0 L-14 36" fill="none" stroke="#C58B4E" stroke-width="4" stroke-linecap="round"/><path d="M-20 34 L-6 38 L-12 58 L-32 52 Z" fill="${YEL}" ${S} stroke-width="2"/></g></g>`;
        const puff = `<g>${T('translate', '0 0;-4 -1;-8 -2;-12 -3')}${A('opacity', '1;.7;.4;0')}<circle cx="24" cy="64" r="6" fill="#E7DCCB" ${S} stroke-width="1.6"/><circle cx="16" cy="62" r="4" fill="#E7DCCB" ${S} stroke-width="1.6"/></g>`;
        return svg('0 0 100 76', broom + puff + blinkStar(80, 58, 5, 0) + blinkStar(86, 22, 4, 3, BLUE), 'doodle-icon');
    }
    function iconCheck() {
        const board = `<rect x="22" y="10" width="48" height="58" rx="4" fill="#fff" ${S}/><rect x="36" y="5" width="20" height="10" rx="2" fill="${OR}" ${S} stroke-width="1.8"/>`;
        const check = `<path d="M32 40 L42 50 L60 28" fill="none" stroke="${OR}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="44" stroke-dashoffset="44">${A('stroke-dashoffset', '44;30;16;0;0;0;0;0')}</path>`;
        return svg('0 0 100 76', board + check + blinkStar(82, 20, 6, 0) + blinkStar(12, 56, 4, 3, BLUE), 'doodle-icon');
    }
    function iconBulb() {
        const rays = `<g>${A('opacity', '1;0;1;1;0;1')}<path d="M30 4 V10 M10 12 L14 16 M50 12 L46 16 M4 30 H10 M50 30 H56" ${S}/></g>`;
        return svg('0 0 60 60', rays + `<path d="M30 14 C18 14 14 26 20 34 C23 38 23 42 23 45 H37 C37 42 37 38 40 34 C46 26 42 14 30 14 Z" fill="${YEL}" ${S}/><rect x="23" y="45" width="14" height="8" rx="2" fill="#ddd" ${S} stroke-width="1.8"/>`, 'doodle-link');
    }
    function iconDetector() {
        const txt = `<g>${A('opacity', '1;1;1;0;0;0')}${hand(30, 36, 'IA?', 18, 'text-anchor="middle"')}</g><g>${A('opacity', '0;0;0;1;1;1')}${hand(30, 37, '✓', 22, 'text-anchor="middle"', '#2E9E5B')}</g>`;
        const lens = `<g>${T('translate', '0 0;2 -1;0 1;1 0;-1 1;0 0')}<circle cx="30" cy="30" r="17" fill="${SOAP}" ${S} stroke-width="3"/>${txt}<path d="M42 42 L54 54" ${S} stroke-width="6"/></g>`;
        return svg('0 0 60 60', lens, 'doodle-link');
    }
    function sparkle() {
        return svg('0 0 20 20', blinkStar(10, 10, 7, 0), 'doodle-sparkle');
    }

    /* =================================================================
     * Escenas del proceso (una por paso)
     * ================================================================= */
    const scenes = {};

    // 1) C2PA -> Claude poniéndose un disfraz
    scenes.c2pa = function () {
        const N = 12;
        const hat = `<g>${T('translate', '0 -96;0 -72;0 -48;0 -24;0 0;0 3;0 0;' + rep('0 0', 5))}
            <rect x="-22" y="-78" width="44" height="42" fill="${INK}" ${S}/>
            <rect x="-22" y="-47" width="44" height="8" fill="${BLUE}" ${S} stroke-width="1.8"/>
            <rect x="-36" y="-39" width="72" height="8" rx="4" fill="${INK}" ${S}/></g>`;
        const disguise = `<g opacity="0">${A('opacity', win(N, 5, 11))}
            <circle cx="-20" cy="-10" r="12" fill="#fff" fill-opacity=".4" ${S}/><circle cx="20" cy="-10" r="12" fill="#fff" fill-opacity=".4" ${S}/>
            <path d="M-8 -11 Q0 -15 8 -11" fill="none" ${S}/>
            <path d="M-18 9 Q-9 2 0 8 Q9 2 18 9 Q9 14 0 10 Q-9 14 -18 9 Z" fill="${INK}"/></g>`;
        const tag = `<g transform="translate(206 72)"><g>${T('translate', '0 0;0 0;0 0;0 0;6 -4;14 -9;24 -15;36 -22;50 -30;64 -38;0 0;0 0')}${A('opacity', '1;1;1;1;1;.9;.7;.5;.3;0;0;1')}
            <g>${T('rotate', '0;-4;4;-4;6;12;18;24;30;36;0;0')}<rect x="-30" y="-15" width="60" height="30" rx="5" fill="#fff" ${S}/>
            ${hand(0, 7, 'C2PA', 21, 'text-anchor="middle"')}<path d="M-24 -8 L24 8" ${S} stroke="${OR}" stroke-width="2.6"/></g></g></g>`;
        const bubble = `<g opacity="0">${A('opacity', win(N, 6, 11))}<path d="${bubblePath(12, 14, 128, 42, 70, 100, 76)}" fill="#fff" ${S}/>
            ${hand(76, 42, '¿C2PA? ¿quién?', 21, 'text-anchor="middle"')}</g>`;
        return svg(VB, ground() + claude({ x: 130, y: 120, bob: true, extra: hat + disguise }) + tag + bubble, 'scene', 'Claude poniéndose un disfraz');
    };

    // 2) EXIF/XMP/IPTC -> Claude con katana
    scenes.exif = function () {
        const p = nextId('kt');
        const N = 35; // 5 s: un katanazo por formato + reverencia final
        const sq = fn => Array.from({ length: N }, (_, f) => fn(f)).join(';');
        const cur = f => Math.floor(f / 10); // 0,1,2 = etiqueta en turno; 3 = final
        const rel = f => f % 10;
        // katana: descanso, carga, corte y regreso en cada ciclo
        const kat = sq(f => {
            if (cur(f) > 2) return f >= 32 ? 150 : -75;
            return [-75, -75, -80, -95, -105, 60, 88, 60, -20, -75][rel(f)];
        });
        const katana = `<g transform="translate(52 2)"><g>${T('rotate', kat)}
            <rect x="-3" y="-2" width="6" height="18" fill="${INK}"/>
            <rect x="-9" y="-7" width="18" height="5" fill="#C9A227" ${S} stroke-width="1.5"/>
            <path d="M-2.5 -7 L-2.5 -86 Q0 -95 3.5 -86 L3.5 -7 Z" fill="#EEF3F7" ${S} stroke-width="1.8"/>
            <path d="M0.5 -20 L0.5 -80" stroke="#fff" stroke-width="1.4"/></g></g>`;
        // cara de Claude: concentrado -> feliz -> ternura
        const focusOp = sq(f => (cur(f) <= 2 && rel(f) <= 5 ? 1 : 0));
        const happyOp = sq(f => (cur(f) <= 2 && rel(f) > 5 ? 1 : 0));
        const cuteOp = sq(f => (cur(f) > 2 ? 1 : 0));
        const face = `<g>${A('opacity', focusOp)}<rect x="-24" y="-12" width="8" height="6" fill="${INK}"/><rect x="16" y="-12" width="8" height="6" fill="${INK}"/><path d="M-30 -24 L-14 -17 M30 -24 L14 -17" ${S} stroke-width="3.2"/><path d="M-6 10 H6" ${S} stroke-width="2.6"/></g>
            <g opacity="0">${A('opacity', happyOp)}<path d="M-27 -16 L-18 -10 L-27 -4" fill="none" ${S} stroke-width="3"/><path d="M25 -16 L16 -10 L25 -4" fill="none" ${S} stroke-width="3"/><path d="M-8 8 Q0 15 8 8" fill="none" ${S} stroke-width="2.6"/></g>
            <g opacity="0">${A('opacity', cuteOp)}<path d="M-26 -8 Q-20 -15 -14 -8 M14 -8 Q20 -15 26 -8" fill="none" ${S} stroke-width="3"/><ellipse cx="-28" cy="4" rx="6" ry="3.4" fill="#F7A7A0"/><ellipse cx="28" cy="4" rx="6" ry="3.4" fill="#F7A7A0"/><path d="M-5 8 Q0 13 5 8" fill="none" ${S} stroke-width="2.4"/></g>`;
        const hop = sq(f => (cur(f) <= 2 ? ['0 0', '0 0', '0 1', '-2 2', '-3 2', '6 -4', '4 -2', '0 0', '0 0', '0 0'][rel(f)] : (f % 2 ? '0 -3' : '0 0')));

        // una etiqueta con carita
        const names = ['EXIF', 'XMP', 'IPTC'];
        const zasTxt = ['¡ZAS!', '¡TRAS!', '¡FIUU!'];
        const clips = `<defs><clipPath id="${p}t"><rect x="-90" y="-60" width="180" height="60" transform="rotate(-18)"/></clipPath>
            <clipPath id="${p}b"><rect x="-90" y="0" width="180" height="60" transform="rotate(-18)"/></clipPath></defs>`;
        const tag = k => {
            const pos = sq(f => {
                const c = cur(f), r = rel(f);
                if (k < c) return '170 100';
                if (k === c) return r === 0 ? '226 100' : r === 1 ? '190 100' : r >= 2 && r <= 4 ? ['170 100', '168 101', '172 99'][r - 2] : '170 100';
                const q = k - c; // en la fila
                return `${194 + (q - 1) * 42} 160`;
            });
            const scl = sq(f => (k > cur(f) ? '.6' : '1'));
            const op = sq(f => {
                const c = cur(f), r = rel(f);
                if (k < c) return 0;
                if (k === c) return r === 9 ? 0 : r === 8 ? 0.5 : 1;
                return 1;
            });
            const topMv = sq(f => (cur(f) === k ? ['0 0', '0 0', '0 0', '0 0', '0 0', '0 0', '8 -6', '16 -14', '24 -20', '28 -24'][rel(f)] : '0 0'));
            const botMv = sq(f => (cur(f) === k ? ['0 0', '0 0', '0 0', '0 0', '0 0', '0 0', '-4 8', '-8 22', '-10 42', '-12 60'][rel(f)] : '0 0'));
            const topRot = sq(f => (cur(f) === k ? [0, 0, 0, 0, 0, 0, 8, 16, 26, 34][rel(f)] : 0));
            const scared = sq(f => (cur(f) === k && rel(f) <= 5 || k > cur(f) ? 1 : 0));
            const ko = sq(f => (cur(f) === k && rel(f) > 5 ? 1 : 0));
            const body = `<rect x="-38" y="-18" width="76" height="36" rx="5" fill="#fff" ${S}/>
                ${hand(10, 7, names[k], 22, 'text-anchor="middle"')}
                <g>${A('opacity', scared)}<circle cx="-27" cy="-5" r="2.6" fill="${INK}"/><circle cx="-18" cy="-5" r="2.6" fill="${INK}"/><path d="M-27 6 Q-24.5 3 -22.5 6 Q-20.5 9 -18 6" fill="none" ${S} stroke-width="1.6"/></g>
                <g opacity="0">${A('opacity', ko)}<path d="M-30 -8 L-25 -3 M-25 -8 L-30 -3 M-21 -8 L-16 -3 M-16 -8 L-21 -3" ${S} stroke-width="1.6"/><path d="M-26 7 Q-22.5 3 -19 7" fill="none" ${S} stroke-width="1.6"/></g>`;
            const sweat = `<g opacity="0">${A('opacity', sq(f => (cur(f) === k && rel(f) >= 2 && rel(f) <= 4 ? 1 : 0)))}<path d="M34 -26 Q39 -19 34 -15 Q29 -19 34 -26Z" fill="${BLUE}" stroke="${INK}" stroke-width="1.3"/>${hand(-8, -26, '¡nooo!', 15, 'text-anchor="middle"')}</g>`;
            return `<g>${T('translate', pos)}${A('opacity', op)}<g>${T('scale', scl)}
                <g clip-path="url(#${p}t)"><g>${T('translate', topMv)}${T('rotate', topRot)}${body}</g></g>
                <g clip-path="url(#${p}b)"><g>${T('translate', botMv)}${body}</g></g>${sweat}</g></g>`;
        };
        let fx = '';
        for (let k = 0; k < 3; k++) {
            const s0 = k * 10 + 5;
            fx += `<g opacity="0">${A('opacity', win(N, s0, s0 + 1))}<path d="M132 52 Q176 96 214 150" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M132 52 Q176 96 214 150" fill="none" ${S} stroke-width="1.6"/>${blinkStar(214, 64, 7, 0)}</g>` +
                `<g opacity="0">${A('opacity', win(N, s0, s0 + 3))}${hand(206, 38 - k * 4, zasTxt[k], 26, `text-anchor="middle" transform="rotate(${[-8, 6, -4][k]} 206 38)"`, OR)}</g>` +
                `<g opacity="0">${A('opacity', win(N, s0 + 3, s0 + 5 > N - 1 ? N - 1 : s0 + 5))}<g transform="translate(${150 + k * 22} 174)">${star(0, 0, 5)}</g></g>`;
        }
        const counter = sq(f => Math.min(3, cur(f) + (rel(f) >= 6 ? 1 : 0)));
        const tally = `<g transform="translate(14 14)"><rect width="74" height="24" rx="5" fill="#fff" ${S} stroke-width="2"/>
            ${[0, 1, 2, 3].map(n => `<g opacity="0">${A('opacity', counter.split(';').map(v => (+v === n ? 1 : 0)).join(';'))}${hand(37, 18, `cortes: ${n}/3`, 17, 'text-anchor="middle"')}</g>`).join('')}</g>`;
        const bow = `<g opacity="0">${A('opacity', win(N, 30, 34))}<path d="${bubblePath(120, 14, 132, 46, 140, 118, 76)}" fill="#fff" ${S}/>
            ${hand(186, 36, 'perdón, datitos', 19, 'text-anchor="middle"')}${hand(186, 54, 'era por su bien ♥', 16, 'text-anchor="middle"', OR)}
            <g transform="translate(40 50)"><g>${T('translate', '0 0;0 -4;0 -8;0 -12;0 -16')}<path d="M0 4 C-10 -4 -6 -12 0 -6 C6 -12 10 -4 0 4Z" fill="#F7A7A0" ${S} stroke-width="1.6"/></g></g></g>`;
        return svg(VB, clips + ground() + tally +
            claude({ x: 72, y: 120, s: 0.85, eyes: 'none', bob: hop, extra: face + katana }) +
            tag(0) + tag(1) + tag(2) + fx + bow, 'scene', 'Claude cortando EXIF, XMP e IPTC con una katana, uno por uno');
    };

    // 3) Reconstrucción con modelos matemáticos -> gráfica con mucho movimiento
    scenes.rebuild = function () {
        const N = 8;
        const x0 = 34, y0 = 152, x1 = 236, yTop = 24;
        const c1 = [], c2 = [], dx = [], dy = [];
        for (let f = 0; f < N; f++) {
            const a = [], b = [];
            for (let x = x0 + 4; x <= x1 - 4; x += 12) {
                const t = (x - x0) / (x1 - x0);
                const y = 92 - 42 * Math.sin(t * 6.3 + f * 0.9) * Math.cos(t * 2.2 - f * 0.45) - 6 * Math.sin(f * 1.7 + t * 13);
                const y2 = 110 - 26 * Math.cos(t * 4.4 - f * 0.8) + 8 * Math.sin(t * 9 + f);
                a.push(`${x},${y.toFixed(1)}`); b.push(`${x},${y2.toFixed(1)}`);
            }
            c1.push(a.join(' ')); c2.push(b.join(' '));
            const px = x0 + 14 + f * 26;
            const t = (px - x0) / (x1 - x0);
            dx.push(px); dy.push((92 - 42 * Math.sin(t * 6.3 + f * 0.9) * Math.cos(t * 2.2 - f * 0.45) - 6 * Math.sin(f * 1.7 + t * 13)).toFixed(1));
        }
        let grid = '';
        for (let gx = x0 + 30; gx < x1; gx += 30) grid += `M${gx} ${yTop + 6} V${y0}`;
        for (let gy = y0 - 25; gy > yTop; gy -= 25) grid += `M${x0} ${gy} H${x1 - 4}`;
        let bars = '';
        for (let i = 0; i < 6; i++) {
            const hs = [], ys = [];
            for (let f = 0; f < N; f++) {
                const r = Math.abs(Math.sin(i * 12.9898 + f * 78.233) * 43758.5453) % 1;
                const h = 8 + r * 34;
                hs.push(h.toFixed(1)); ys.push((y0 - h).toFixed(1));
            }
            bars += `<rect x="${x0 + 10 + i * 18}" y="${ys[0]}" width="12" height="${hs[0]}" fill="${SOAP}" ${S} stroke-width="1.6">${A('height', hs.join(';'))}${A('y', ys.join(';'))}</rect>`;
        }
        const sym = (ch, x, y, k) => `<g transform="translate(${x} ${y})"><g>${T('translate', shift('0 0;0 -4;3 -2;0 2;-2 -1;1 3;0 0;-3 1', k))}${hand(0, 0, ch, 24, 'text-anchor="middle"', k % 2 ? OR : INK)}</g></g>`;
        const body =
            `<rect x="14" y="10" width="232" height="170" rx="6" fill="#fff" ${S}/>` +
            `<path d="${grid}" stroke="#E4DACB" stroke-width="1.4" stroke-dasharray="3 4"/>` +
            `<path d="M${x0} ${yTop} V${y0} H${x1}" fill="none" ${S} stroke-width="2.8"/><path d="M${x0 - 5} ${yTop + 7} L${x0} ${yTop} L${x0 + 5} ${yTop + 7} M${x1 - 7} ${y0 - 5} L${x1} ${y0} L${x1 - 7} ${y0 + 5}" fill="none" ${S}/>` +
            bars +
            `<polyline points="${c2[0]}" fill="none" stroke="${BLUE}" stroke-width="2.6" stroke-dasharray="6 5" stroke-linecap="round">${A('points', c2.join(';'))}</polyline>` +
            `<polyline points="${c1[0]}" fill="none" stroke="${OR}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${A('points', c1.join(';'))}</polyline>` +
            `<circle cx="${dx[0]}" cy="${dy[0]}" r="6" fill="${YEL}" ${S} stroke-width="2">${A('cx', dx.join(';'))}${A('cy', dy.join(';'))}</circle>` +
            sym('∑', 58, 42, 0) + sym('∫', 104, 36, 2) + sym('π', 160, 44, 4) + sym('∂', 206, 38, 6) + sym('√x', 214, 76, 3) +
            hand(40, 172, 'ƒ(x) = píxeles bonitos', 16) +
            claude({ x: 222, y: 150, s: 0.34, eyes: 'wow', blink: false, bob: '0 0;0 -4;0 0;0 -2' });
        return svg(VB, body, 'scene', 'Gráfica matemática reconstruyendo la imagen');
    };

    // 4) Lente -> cámara disparando flash
    scenes.lens = function () {
        const N = 10;
        let blades = '';
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            blades += `M${(Math.cos(a) * 9).toFixed(1)} ${(Math.sin(a) * 9).toFixed(1)} L${(Math.cos(a + 0.9) * 26).toFixed(1)} ${(Math.sin(a + 0.9) * 26).toFixed(1)} `;
        }
        const cam = `<g transform="translate(130 104)"><g>${T('translate', '0 0;0 0;0 0;0 0;0 0;0 3;1 1;0 0;0 0;0 0')}
            <path d="M-40 -42 L-30 -62 H10 L20 -42 Z" fill="#3B3632" ${S}/>
            <rect x="40" y="-60" width="30" height="18" rx="3" fill="#FFF6C8" ${S}/>
            <rect x="-80" y="-44" width="160" height="94" rx="12" fill="#3B3632" ${S}/>
            <rect x="-72" y="-36" width="24" height="10" rx="2" fill="${OR}" ${S} stroke-width="1.6"/>
            <rect x="-68" y="-50" width="16" height="7" rx="2" fill="#bbb" ${S} stroke-width="1.4"><animate attributeName="y" values="-50;-50;-50;-50;-47;-47;-50;-50;-50;-50" dur="${N / FPS}s" calcMode="discrete" repeatCount="indefinite"/></rect>
            <circle r="39" fill="#2A2623" ${S}/><circle r="29" fill="#1C1A18" stroke="#8a8580" stroke-width="2"/>
            <g>${T('rotate', '0;25;50;75;100;125;150;175;200;225')}<path d="${blades}" stroke="#8a8580" stroke-width="2"/></g>
            <circle r="9" fill="#4a6b8a" stroke="#8a8580" stroke-width="1.5"/><circle cx="-3" cy="-3" r="3" fill="#fff" opacity=".85"/></g></g>`;
        const flash = `<g opacity="0">${A('opacity', win(N, 5, 6))}${flashBurst(185, 46, 30)}${hand(222, 24, 'click!', 20, 'text-anchor="middle"', OR)}</g>`;
        const overlay = `<rect x="0" y="0" width="260" height="190" fill="#fff" opacity="0">${A('opacity', '0;0;0;0;0;.85;.35;0;0;0')}</rect>`;
        const readout = `<text class="aperture-readout" x="130" y="182" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="19" fill="${INK}">f/1.87</text>`;
        const fan = claude({ x: 28, y: 158, s: 0.36, eyes: 'wow', blink: false, bob: '0 0;0 -3;0 0;0 0;0 0;0 -6;0 -6;0 0;0 0;0 0' });
        return svg(VB, cam + fan + flash + readout + overlay, 'scene', 'Cámara tomando una foto con flash');
    };

    // 5) Fórmula de Bayer -> pizarrón
    scenes.bayer = function () {
        const p = nextId('bz');
        const N = 16;
        const lines = [
            [54, 'RGGB → demosaico'],
            [84, 'G = (N + S + E + O) / 4'],
            [114, 'σ² = r² + k · I'],
            [144, 'I′ = I + λ(I − Ĩ)   ✓']
        ];
        let clips = '<defs>';
        let texts = '';
        lines.forEach(([y, txt], i) => {
            const start = 1 + i * 3;
            const w = Array.from({ length: N }, (_, f) => {
                if (f === N - 1) return 0;
                if (f < start) return 0;
                const k = f - start;
                return k === 0 ? 60 : k === 1 ? 120 : 220;
            }).join(';');
            clips += `<clipPath id="${p}${i}"><rect x="26" y="${y - 24}" height="32" width="0">${A('width', w)}</rect></clipPath>`;
            texts += `<g clip-path="url(#${p}${i})">${hand(30, y, txt, 22, '', CHALK)}</g>`;
        });
        clips += '</defs>';
        const chalkPos = Array.from({ length: N }, (_, f) => {
            const li = Math.max(0, Math.min(3, Math.floor((f - 1) / 3)));
            const k = Math.max(0, (f - 1) - li * 3);
            const x = 26 + [60, 120, 180][Math.min(2, k)];
            return `${x} ${lines[li][0] - 6}`;
        }).join(';');
        const chalk = `<g>${T('translate', chalkPos)}<rect x="-3" y="-3" width="14" height="6" rx="2" fill="#fff" ${S} stroke-width="1.4" transform="rotate(-25)"/></g>`;
        const colors = ['#E86A5C', '#7CC47A', '#7CC47A', BLUE];
        let grid = '';
        for (let gy = 0; gy < 4; gy++) {
            for (let gx = 0; gx < 4; gx++) {
                grid += `<rect x="${196 + gx * 10}" y="${30 + gy * 10}" width="10" height="10" fill="${colors[(gy % 2) * 2 + (gx % 2)]}" stroke="${INK}" stroke-width="1"/>`;
            }
        }
        const hl = Array.from({ length: N }, (_, f) => `${(f % 4) * 10} ${(Math.floor(f / 4) % 4) * 10}`).join(';');
        grid += `<g>${T('translate', hl)}<rect x="196" y="30" width="10" height="10" fill="none" stroke="#fff" stroke-width="2.4"/></g>`;
        const body = clips +
            `<rect x="12" y="14" width="236" height="150" rx="6" fill="#2F4A3A" stroke="#8A5A36" stroke-width="7"/>` +
            `<rect x="12" y="14" width="236" height="150" rx="6" fill="none" ${S}/>` +
            grid + texts + chalk +
            `<rect x="40" y="166" width="180" height="7" rx="3" fill="#8A5A36" ${S} stroke-width="1.6"/>` +
            `<rect x="170" y="158" width="26" height="9" rx="2" fill="#f5d3c5" ${S} stroke-width="1.4"/>` +
            claude({ x: 236, y: 176, s: 0.3, eyes: 'happy', bob: '0 0;0 -3' });
        return svg(VB, body, 'scene', 'Pizarrón con la fórmula de Bayer');
    };

    // 6) Sensor / API 23 -> Claude hombres de negro
    scenes.sensor = function () {
        const N = 10;
        const suit = `<path d="M-42 -2 H42 V28 H-42 Z" fill="#1b1b1b" ${S}/>
            <path d="M-12 -2 L0 18 L12 -2 Z" fill="#fff" ${S} stroke-width="1.6"/>
            <path d="M-3 -1 H3 L4.5 11 L0 16 L-4.5 11 Z" fill="${INK}"/>
            <path d="M-34 -19 H-7 V-10 Q-20 -5 -34 -10 Z M7 -19 H34 V-10 Q20 -5 7 -10 Z" fill="#111" ${S} stroke-width="1.8"/>
            <path d="M-7 -16 H7" ${S} stroke-width="2"/>`;
        const neuralyzer = `<g transform="translate(50 -2)"><rect x="-3" y="-30" width="7" height="30" rx="2" fill="#D5DCE2" ${S} stroke-width="1.6"/>
            <circle cx="0.5" cy="-33" r="4.5" fill="#fff" ${S} stroke-width="1.4"/></g>
            <g opacity="0">${A('opacity', win(N, 6, 7))}${flashBurst(50, -38, 26)}</g>`;
        const agent = (x, y, s, extra, bob) => claude({ x, y, s, eyes: 'none', color: OR, legColor: '#1b1b1b', armColor: '#1b1b1b', bob, extra: suit + extra });
        const overlay = `<rect x="0" y="0" width="260" height="190" fill="#fff" opacity="0">${A('opacity', '0;0;0;0;0;0;.8;.3;0;0')}</rect>`;
        const bubble = `<g opacity="0">${A('opacity', win(N, 7, 9))}<path d="${bubblePath(128, 10, 124, 40, 170, 164, 66)}" fill="#fff" ${S}/>
            ${hand(190, 37, 'aquí no pasó nada', 19, 'text-anchor="middle"')}</g>`;
        const badge = `<rect x="14" y="14" width="86" height="26" rx="4" fill="#1b1b1b" ${S}/>${hand(57, 33, 'API 23', 20, 'text-anchor="middle"', '#fff')}`;
        return svg(VB, ground() + badge +
            agent(92, 118, 0.9, neuralyzer, '0 0;1 0;0 0;-1 0') +
            agent(196, 128, 0.7, '', '0 0;0 -1;0 0;0 1') + bubble + overlay, 'scene', 'Claude vestido de hombre de negro');
    };

    // 7) Empaquetando -> Claude metiendo todo en una cajita
    scenes.pack = function () {
        const N = 14;
        const item = (x, k, inner) => {
            const ys = Array.from({ length: N }, (_, f) => {
                const s = 1 + k * 3;
                if (f < s) return '0 -130';
                const d = f - s;
                return ['0 -96', '0 -60', '0 -24', '0 14'][Math.min(3, d)];
            }).join(';');
            const op = Array.from({ length: N }, (_, f) => (f < 1 + k * 3 ? 0 : 1)).join(';');
            return `<g transform="translate(${x} 120)"><g>${T('translate', ys)}${A('opacity', op)}${inner}</g></g>`;
        };
        const photo = `<rect x="-14" y="-11" width="28" height="22" rx="2" fill="#fff" ${S} stroke-width="2"/><path d="M-10 7 L-3 -1 L2 4 L6 0 L11 7 Z" fill="${BLUE}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
        const sparkleItem = star(0, 0, 11);
        const doc = `<rect x="-10" y="-13" width="20" height="26" rx="2" fill="#fff" ${S} stroke-width="2"/><path d="M-5 1 L-1 5 L6 -5" fill="none" stroke="${OR}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
        const flaps = (open, half, closed) => Array.from({ length: N }, (_, f) => (f < 10 ? open : f === 10 ? half : closed)).join(';');
        const lf = flaps('110,120 165,120 158,90 98,94', '110,120 165,120 168,110 106,112', '110,120 165,120 165,116 110,116');
        const rf = flaps('165,120 220,120 232,94 172,90', '165,120 220,120 224,112 162,110', '165,120 220,120 220,116 165,116');
        const body = ground() +
            `<path d="M110 120 L120 106 H210 L220 120 Z" fill="#A86F3E" ${S}/>` +
            item(140, 0, photo) + item(166, 1, sparkleItem) + item(192, 2, doc) +
            `<rect x="110" y="120" width="110" height="54" fill="#C98D55" ${S}/>` +
            hand(165, 154, 'CLEAN ✓', 20, 'text-anchor="middle"') +
            `<polygon points="${lf.split(';')[0]}" fill="#D9A06A" ${S}>${A('points', lf)}</polygon>` +
            `<polygon points="${rf.split(';')[0]}" fill="#D9A06A" ${S}>${A('points', rf)}</polygon>` +
            `<g opacity="0">${A('opacity', win(N, 12, 13))}<rect x="150" y="112" width="30" height="14" fill="#EBDDB0" ${S} stroke-width="1.6"/>${hand(165, 44, '¡empacado!', 24, 'text-anchor="middle"', OR)}</g>` +
            claude({ x: 58, y: 124, s: 0.74, eyes: 'happy', bob: '0 0;2 -2;0 0;2 -2' });
        return svg(VB, body, 'scene', 'Claude metiendo todo en una caja');
    };

    // 8) Listo -> Claude feliz avisando
    scenes.done = function () {
        const bubble = `<path d="${bubblePath(128, 10, 122, 58, 150, 142, 86)}" fill="#fff" ${S}/>
            ${hand(189, 38, '¡Listo! ✨', 26, 'text-anchor="middle"', OR)}
            ${hand(189, 58, 'quedó limpiecita', 17, 'text-anchor="middle"')}`;
        const confetti = (x, y, c, k) => `<g transform="translate(${x} ${y})"><g>${T('translate', shift('0 0;2 6;-1 12;2 18;0 24;-2 30;1 36;0 42', k))}${A('opacity', shift('1;1;1;1;.8;.5;.2;0', k))}<rect x="-3" y="-2" width="6" height="4" fill="${c}" stroke="${INK}" stroke-width="1"/></g></g>`;
        const body = ground() +
            confetti(30, 20, OR, 0) + confetti(60, 40, BLUE, 3) + confetti(100, 14, YEL, 5) + confetti(20, 70, '#7CC47A', 2) + confetti(236, 90, BLUE, 6) + confetti(218, 110, OR, 1) +
            blinkStar(40, 110, 9, 0) + blinkStar(222, 140, 8, 2) + blinkStar(96, 60, 6, 4, BLUE) +
            claude({ x: 100, y: 122, s: 1.05, eyes: 'happy', bob: '0 0;0 -8;0 -14;0 -8;0 0;0 0;0 0;0 0', extra: `<path d="M-12 8 Q0 20 12 8 Z" fill="${INK}"/>` }) +
            bubble;
        return svg(VB, body, 'scene', 'Claude avisando que ya está listo');
    };

    /* ---------- montaje ---------- */
    const pieces = { logo, hero, drop, bucket, iconScan, iconClean, iconCheck, iconBulb, iconDetector, sparkle };

    function mount(root) {
        if (!document.getElementById('doodle-defs')) {
            const holder = document.createElement('div');
            holder.id = 'doodle-defs';
            holder.innerHTML = defs();
            document.body.prepend(holder);
        }
        (root || document).querySelectorAll('[data-doodle]').forEach(el => {
            const fn = pieces[el.dataset.doodle];
            if (fn && !el.dataset.mounted) { el.innerHTML = fn(); el.dataset.mounted = '1'; }
        });
    }

    const helpers = { INK, OR, BLUE, SOAP, YEL, CHALK, FPS, VB, A, T, rep, win, shift, S, hand, nextId, svg, ground, star, blinkStar, bubblePath, flashBurst, claude, dur };
    global.Doodles = { mount, scenes, sparkle, pieces, helpers };
})(window);
