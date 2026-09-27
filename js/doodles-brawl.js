/* =====================================================================
 * CLEANER — Cejilla "La gran pelea": mini-Claudes vs. Chrome
 * Loop largo de 84 frames (12 s) a 7 fps, SMIL discreto:
 *   0–28  jalan la cuerda contra Chrome (y se rompe)
 *  22–42  Claude-samurái le da un katanazo
 *  40–68  Chrome escupe pestañas y Claude-escoba las barre
 *  56–72  Claude-cubetazo le echa agua con jabón
 *  70–82  nube de pelea caricaturesca ¡PUM! ¡PAF!
 *   todo  el dinosaurio de Chrome cruza perseguido por un Claude con red
 * ===================================================================== */
(function (global) {
    'use strict';
    const D = global.Doodles;
    const { INK, OR, BLUE, YEL, A, T, S, hand, svg, star, claude, bubblePath, flashBurst } = D.helpers;
    const { tl, seq } = D;
    const N = 84;
    const GY = 196; // suelo

    const mv = keys => T('translate', tl(N, keys));
    const rot = keys => T('rotate', tl(N, keys));
    const show = ranges => A('opacity', seq(N, f => (ranges.some(([a, b]) => f >= a && f <= b) ? 1 : 0)));

    /* ---------- Chrome, el villano ---------- */
    function chromeBall() {
        const R = 54;
        const p = a => `${(Math.cos(a * Math.PI / 180) * R).toFixed(1)} ${(Math.sin(a * Math.PI / 180) * R).toFixed(1)}`;
        let sectors = '';
        ['#DB4437', '#F4B400', '#0F9D58'].forEach((c, i) => {
            const a0 = -90 + i * 120;
            sectors += `<path d="M0 0 L${p(a0)} A${R} ${R} 0 0 1 ${p(a0 + 120)} Z" fill="${c}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
        });
        const spin = `<g>${T('rotate', seq(12, f => f * 30))}${sectors}</g><circle r="27" fill="#fff" ${S}/><circle r="20" fill="#4285F4" ${S}/>`;
        const legs = `<g>${T('translate', '0 0;0 -2')}<path d="M-18 48 V70 M18 48 V70" ${S} stroke-width="4"/></g>
            <path d="M-30 74 Q-30 64 -18 66 L-8 70 Q-6 76 -14 76 H-28 Z" fill="#fff" ${S} stroke-width="2"/>
            <path d="M30 74 Q30 64 18 66 L8 70 Q6 76 14 76 H28 Z" fill="#fff" ${S} stroke-width="2"/>`;
        const glove = (side, jab) => {
            const sx = side * 58;
            return `<g>${T('translate', jab)}
                <path d="M${side * 44} 4 Q${side * 54} -4 ${sx} 2" fill="none" ${S} stroke-width="3.4"/>
                <circle cx="${sx + side * 6}" cy="2" r="12" fill="#D9483B" ${S}/>
                <path d="M${sx + side * 2} -6 Q${sx + side * 10} -8 ${sx + side * 14} -2" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`;
        };
        const angry = `<g>${show([[0, 32], [46, 63], [70, 84]])}
            <ellipse cx="-18" cy="-12" rx="10" ry="11" fill="#fff" ${S} stroke-width="2"/><ellipse cx="18" cy="-12" rx="10" ry="11" fill="#fff" ${S} stroke-width="2"/>
            <circle cx="-15" cy="-9" r="4.6" fill="${INK}"/><circle cx="15" cy="-9" r="4.6" fill="${INK}"/>
            <path d="M-32 -30 L-8 -20 M32 -30 L8 -20" ${S} stroke-width="4.4"/>
            <path d="M-14 24 Q0 16 14 24" fill="none" ${S} stroke-width="3.4"/></g>`;
        const ko = `<g opacity="0">${show([[33, 45]])}
            <path d="M-26 -20 L-10 -4 M-10 -20 L-26 -4 M10 -20 L26 -4 M26 -20 L10 -4" ${S} stroke-width="4"/>
            <path d="M-12 26 Q0 16 12 26" fill="none" ${S} stroke-width="3.4"/>
            <path d="M-4 26 Q0 36 4 26" fill="#E86A5C" ${S} stroke-width="1.6"/></g>`;
        const wet = `<g opacity="0">${show([[64, 69]])}
            <circle cx="-18" cy="-12" r="10" fill="#fff" ${S} stroke-width="2"/><circle cx="18" cy="-12" r="10" fill="#fff" ${S} stroke-width="2"/>
            <circle cx="-18" cy="-12" r="3" fill="${INK}"/><circle cx="18" cy="-12" r="3" fill="${INK}"/><ellipse cx="0" cy="22" rx="8" ry="10" fill="${INK}"/></g>`;
        const spit = `<g opacity="0">${show([[44, 56]])}<ellipse cx="0" cy="22" rx="16" ry="11" fill="${INK}"/><path d="M-10 28 Q0 20 10 28" fill="#E86A5C"/></g>`;
        const foam = `<g opacity="0">${show([[64, 76]])}<circle cx="-40" cy="-36" r="10" fill="#fff" ${S} stroke-width="1.8"/><circle cx="-24" cy="-48" r="12" fill="#fff" ${S} stroke-width="1.8"/><circle cx="-6" cy="-54" r="9" fill="#fff" ${S} stroke-width="1.8"/><circle cx="34" cy="-42" r="11" fill="#fff" ${S} stroke-width="1.8"/><circle cx="48" cy="22" r="8" fill="#fff" ${S} stroke-width="1.8"/></g>`;
        return legs + glove(-1, '-14 -4;0 0;0 0;0 0') + glove(1, '0 0;0 0;14 -4;0 0') + spin + angry + ko + wet + spit + foam;
    }

    /* ---------- equipo de la cuerda ---------- */
    function member(x, k) {
        const lean = rot([[0, -12], [8, -12], [10, 8], [16, 8], [18, -16], [28, -16], [30, -50], [32, -90], [82, -90], [83, -12]]);
        const normal = `<g>${show([[0, 9], [17, 28], [83, 84]])}${claude({ x: 0, y: -19, s: 0.42, walk: true, extra: `<path d="M-14 12 L14 12" ${S} stroke-width="3"/>` })}</g>`;
        const wow = `<g opacity="0">${show([[10, 16], [29, 82]])}${claude({ x: 0, y: -19, s: 0.42, eyes: 'wow', blink: false })}</g>`;
        const dizzy = `<g opacity="0">${show([[34, 82]])}<g transform="translate(-30 -18)"><g>${T('translate', ['0 -6', '6 -2', '0 2', '-6 -2'].join(';'))}${star(0, 0, 5)}</g></g></g>`;
        return `<g transform="translate(${x} ${GY})"><g>${lean}${normal}${wow}</g>${dizzy}</g>`;
    }

    function tugTeam() {
        const dx = mv([[0, 0, 0], [8, -10, 0], [12, 40, 0], [16, 60, 0], [20, -30, 0], [26, -40, 0], [82, -40, 0], [83, 0, 0]]);
        const fall = mv([[0, 0, 0], [28, 0, 0], [30, -60, -26], [32, -100, 0], [82, -100, 0], [83, 0, 0]]);
        const rope = `<g>${show([[0, 27], [83, 84]])}<path d="M350 172 Q450 184 546 150" fill="none" stroke="#B07A45" stroke-width="5" stroke-linecap="round"/><path d="M350 172 Q450 184 546 150" fill="none" stroke="${INK}" stroke-width="1.4" stroke-dasharray="4 5"/></g>`;
        const snapped = `<g opacity="0">${show([[28, 31]])}<path d="M350 172 Q380 186 400 196" fill="none" stroke="#B07A45" stroke-width="5" stroke-linecap="round"/>${hand(450, 150, '¡crac!', 22, 'text-anchor="middle"', OR)}</g>`;
        const heave = `<g opacity="0">${show([[0, 8], [17, 26]])}${hand(390, 118, '¡jalen, jalen!', 22, 'text-anchor="middle"', OR)}</g>`;
        const help = `<g opacity="0">${show([[10, 16]])}${hand(390, 118, '¡aaaah!', 22, 'text-anchor="middle"')}</g>`;
        return `<g>${dx}${rope}${snapped}${heave}${help}<g>${fall}${member(350, 0)}${member(398, 1)}${member(446, 2)}</g></g>`;
    }

    /* ---------- Claude samurái ---------- */
    function samurai() {
        const pos = mv([[0, 1320, 177], [22, 1320, 177], [27, 800, 177], [29, 730, 100], [31, 690, 110], [32, 680, 160], [33, 690, 177], [35, 700, 177], [36, 730, 140], [38, 900, 60], [41, 1320, 20], [84, 1320, 20]]);
        const spin = rot([[0, 0], [35, 0], [41, 720], [42, 0], [84, 0]]);
        const katana = `<g transform="translate(20 -10)"><g>${rot([[0, -60], [30, -60], [31, 20], [32, 80], [36, 80], [37, -60], [84, -60]])}
            <rect x="-2" y="-2" width="5" height="12" fill="${INK}"/><rect x="-6" y="-5" width="13" height="4" fill="#C9A227" stroke="${INK}" stroke-width="1.2"/>
            <path d="M-2 -5 L-2 -56 Q0 -62 3 -56 L3 -5 Z" fill="#EEF3F7" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></g></g>`;
        const band = `<path d="M-42 -26 H42" stroke="#D9483B" stroke-width="7"/><path d="M42 -26 L58 -34 M42 -24 L56 -18" stroke="#D9483B" stroke-width="4" stroke-linecap="round"/><path d="M-30 -22 L-14 -16 M30 -22 L14 -16" ${S} stroke-width="3.4"/>`;
        const body = `<g>${pos}<g>${spin}${claude({ x: 0, y: 0, s: 0.42, walk: true, blink: false, extra: band })}${katana}</g></g>`;
        const slash = `<g opacity="0">${show([[31, 33]])}<path d="M560 40 Q640 110 660 200" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/><path d="M560 40 Q640 110 660 200" fill="none" ${S} stroke-width="1.8"/>${flashBurst(640, 110, 30)}</g>`;
        const zas = `<g opacity="0">${show([[31, 35]])}${hand(790, 70, '¡KATANAZO!', 32, 'text-anchor="middle"', OR)}</g>`;
        const snap = `<g opacity="0">${show([[34, 45]])}<path d="${bubblePath(660, 10, 160, 44, 690, 648, 72)}" fill="#fff" ${S}/>${hand(740, 40, '¡Aw, Snap!', 24, 'text-anchor="middle"')}</g>`;
        return body + slash + zas + snap;
    }

    /* ---------- Claude escoba vs. pestañas ---------- */
    function sweeper() {
        const pos = mv([[0, 1320, 177], [40, 1320, 177], [46, 920, 177], [60, 940, 177], [62, 940, 177], [68, 1320, 177], [84, 1320, 177]]);
        const broom = `<g transform="translate(-26 -4)"><g>${T('rotate', '-30;-6;18;-6')}<path d="M0 0 L-8 34" stroke="#C58B4E" stroke-width="3.6" stroke-linecap="round"/><path d="M-16 30 L-2 34 L-6 48 L-22 44 Z" fill="${YEL}" ${S} stroke-width="1.8"/></g></g>`;
        const cap = `<path d="M-40 -34 Q0 -58 40 -34 Z" fill="${BLUE}" ${S} stroke-width="2.4"/>`;
        const body = `<g>${pos}${claude({ x: 0, y: 0, s: 0.42, walk: true, eyes: 'tired', extra: cap })}${broom}</g>`;
        const pan = `<g opacity="0">${show([[46, 62]])}<path d="M990 196 L1030 178 L1040 196 Z" fill="#9BB6C8" ${S} stroke-width="2"/><path d="M1034 184 L1052 160" ${S} stroke-width="3"/></g>`;
        let tabs = '';
        for (let k = 0; k < 5; k++) {
            const t0 = 44 + k * 2;
            const tx = 690 + k * 34;
            const keys = [[0, 600, 140], [t0, 600, 140], [t0 + 3, 660 + k * 30, 30 + k * 8], [t0 + 6, tx, 186], [56, tx, 186], [60, 1010, 186], [84, 1010, 186]];
            const tab = `<path d="M-16 8 L-12 -6 Q-11 -9 -8 -9 H8 Q11 -9 12 -6 L16 8 Z" fill="#fff" ${S} stroke-width="2"/><circle cx="-5" cy="-1" r="2.4" fill="${['#DB4437', '#F4B400', '#0F9D58', '#4285F4', OR][k]}"/><path d="M1 -1 H8" ${S} stroke-width="1.6"/>`;
            tabs += `<g opacity="0">${show([[t0, 60]])}<g>${mv(keys)}<g>${T('rotate', '0;90;180;270')}${tab}</g></g></g>`;
        }
        const txt = `<g opacity="0">${show([[46, 52]])}${hand(870, 104, 'otra pestaña más…', 21, 'text-anchor="middle"')}</g>` +
            `<g opacity="0">${show([[53, 60]])}${hand(870, 104, '¡47 pestañas, Chrome!', 21, 'text-anchor="middle"', OR)}</g>`;
        return pan + tabs + body + txt;
    }

    /* ---------- Claude cubetazo ---------- */
    function waterer() {
        const pos = mv([[0, 1320, 177], [56, 1320, 177], [60, 810, 177], [68, 810, 177], [72, 1320, 177], [84, 1320, 177]]);
        const bucket = `<g transform="translate(-30 -16)"><g>${rot([[0, 0], [61, 0], [62, -50], [63, -100], [67, -100], [68, 0], [84, 0]])}
            <path d="M-12 -8 L12 -8 L9 14 Q0 17 -9 14 Z" fill="#CFE3F0" ${S} stroke-width="2"/><path d="M-12 -8 Q0 -22 12 -8" fill="none" ${S} stroke-width="2"/>
            <path d="M-10 -6 Q0 -2 10 -6" fill="${BLUE}" stroke="${INK}" stroke-width="1.4"/></g></g>`;
        const body = `<g>${pos}${claude({ x: 0, y: 0, s: 0.42, walk: true, eyes: 'happy', extra: `<path d="M-10 8 Q0 18 10 8 Z" fill="${INK}"/>` })}${bucket}</g>`;
        const splash = `<g opacity="0">${show([[62, 66]])}<path d="M770 150 Q720 60 640 70 Q600 80 580 110 Q620 96 650 104 Q700 90 770 150Z" fill="${BLUE}" fill-opacity=".85" ${S} stroke-width="2"/></g>`;
        let drops = '';
        for (let i = 0; i < 7; i++) {
            const a = -Math.PI + (i / 6) * Math.PI;
            const ex = 600 + Math.cos(a) * 110, ey = 110 + Math.sin(a) * 80;
            drops += `<g opacity="0">${show([[64, 69]])}<g>${mv([[0, 600, 110], [64, 600, 110], [67, ex, ey], [69, ex, ey + 40], [84, ex, ey + 40]])}<path d="M0 -7 Q6 0 0 6 Q-6 0 0 -7Z" fill="${BLUE}" stroke="${INK}" stroke-width="1.4"/></g></g>`;
        }
        const splat = `<g opacity="0">${show([[64, 68]])}${hand(830, 80, '¡SPLASH!', 30, 'text-anchor="middle"', BLUE)}</g>`;
        const soap = `<g opacity="0">${show([[66, 76]])}${hand(600, 28, 'con jabón, pa que se le quite lo tóxico', 20, 'text-anchor="middle"')}</g>`;
        return body + splash + drops + splat + soap;
    }

    /* ---------- nube de pelea ---------- */
    function brawl() {
        const cloudD = [
            'M500 150 Q470 110 510 90 Q510 40 570 50 Q600 10 650 40 Q710 30 710 80 Q750 100 720 140 Q740 190 680 186 Q640 206 600 188 Q540 204 520 180 Q470 180 500 150Z',
            'M496 146 Q474 104 516 94 Q518 36 574 46 Q606 14 654 44 Q716 36 712 84 Q756 106 716 146 Q734 194 676 190 Q636 202 598 190 Q536 200 516 176 Q466 172 496 146Z',
            'M504 152 Q466 114 506 86 Q504 44 566 54 Q596 6 646 36 Q706 26 706 76 Q744 96 724 136 Q746 186 684 182 Q644 210 604 186 Q544 206 524 184 Q474 186 504 152Z'
        ];
        const cloud = `<path d="${cloudD[0]}" fill="#F1E7D6" ${S} stroke-width="3">${A('d', cloudD.join(';'))}</path>`;
        const pop = (x, y, r, inner, ph) => `<g>${A('opacity', ['1;0;0;1;0;0', '0;1;0;0;1;0', '0;0;1;0;0;1'][ph % 3])}<g transform="translate(${x} ${y}) rotate(${r})">${inner}</g></g>`;
        const leg = `<rect x="-5" y="0" width="10" height="20" fill="${OR}" ${S} stroke-width="2"/>`;
        const glove = `<circle r="11" fill="#D9483B" ${S}/>`;
        const broom = `<path d="M0 0 L0 -40" stroke="#C58B4E" stroke-width="4" stroke-linecap="round"/><path d="M-8 -40 H8 L10 -56 H-10 Z" fill="${YEL}" ${S} stroke-width="1.8"/>`;
        const blade = `<path d="M-2 0 L-2 -44 Q0 -50 3 -44 L3 0 Z" fill="#EEF3F7" ${S} stroke-width="1.6"/>`;
        const parts = pop(520, 176, 20, leg, 0) + pop(700, 170, -30, leg, 1) + pop(720, 90, 40, glove, 2) + pop(490, 110, 0, glove, 1) +
            pop(640, 44, 20, broom, 0) + pop(560, 52, -30, blade, 2) + pop(690, 186, 160, leg, 2) + pop(506, 150, -80, leg, 0);
        const words = pop(560, 30, -8, hand(0, 0, '¡PUM!', 32, 'text-anchor="middle"', OR), 0) +
            pop(720, 40, 8, hand(0, 0, '¡PAF!', 32, 'text-anchor="middle"', '#D9483B'), 1) +
            pop(620, 214, 0, hand(0, 0, '¡CRASH!', 26, 'text-anchor="middle"', BLUE), 2);
        const eyes = `<g>${A('opacity', '1;1;0;1;1;0')}<rect x="578" y="110" width="8" height="8" fill="${INK}"/><rect x="604" y="110" width="8" height="8" fill="${INK}"/><circle cx="650" cy="130" r="5" fill="#fff" ${S} stroke-width="1.6"/><circle cx="650" cy="130" r="2" fill="${INK}"/></g>`;
        const stars = [star(530, 70, 10), star(710, 130, 9, BLUE), star(610, 176, 8)].map((s, i) => `<g>${A('opacity', ['1;0', '0;1', '1;1;0'][i])}${s}</g>`).join('');
        const poof = `<g opacity="0">${show([[82, 83]])}<circle cx="560" cy="130" r="18" fill="#F1E7D6" ${S}/><circle cx="650" cy="120" r="22" fill="#F1E7D6" ${S}/><circle cx="610" cy="80" r="16" fill="#F1E7D6" ${S}/></g>`;
        return `<g opacity="0">${show([[70, 81]])}<g>${T('translate', '0 0;3 -2;-2 2;2 1')}${cloud}${parts}${eyes}${stars}</g>${words}</g>${poof}`;
    }

    /* ---------- el dinosaurio de Chrome perseguido ---------- */
    function dino() {
        const G = '#535353';
        const rex = `<path d="M-2 -26 H22 V-12 H10 V-8 H16 V-4 H8 V8 H4 V14 H-10 V8 H-14 V4 H-18 V-8 H-14 V0 H-10 V-4 H-2 Z" fill="${G}"/><rect x="2" y="-22" width="4" height="4" fill="#fff"/>
            <g>${A('opacity', '1;0')}<rect x="-6" y="14" width="4" height="10" fill="${G}"/><rect x="4" y="14" width="4" height="6" fill="${G}"/></g>
            <g opacity="0">${A('opacity', '0;1')}<rect x="-6" y="14" width="4" height="6" fill="${G}"/><rect x="4" y="14" width="4" height="10" fill="${G}"/></g>`;
        const x0 = 1280, x1 = -120;
        const X = f => x0 + (x1 - x0) * (f / (N - 1));
        const jumpY = (f, s) => (f >= s && f <= s + 5 ? -[14, 26, 32, 26, 14, 0][f - s] : 0);
        const dPos = seq(N, f => `${X(f).toFixed(1)} ${GY - 24 + jumpY(f, 50) + jumpY(f, 16)}`);
        const cPos = seq(N, f => `${(X(f) + 80).toFixed(1)} ${GY - 17 + jumpY(f, 55) + jumpY(f, 21)}`);
        const net = `<g transform="translate(-26 -8)"><g>${T('rotate', '-20;10')}<path d="M0 0 L-10 -30" ${S} stroke-width="2.4"/><ellipse cx="-12" cy="-38" rx="10" ry="8" fill="#fff" fill-opacity=".6" ${S} stroke-width="1.8"/><path d="M-20 -38 H-4 M-12 -46 V-30" stroke="${INK}" stroke-width="1"/></g></g>`;
        const chaser = `<g>${T('translate', cPos)}${claude({ s: 0.36, walk: true, eyes: 'wow', blink: false })}${net}</g>`;
        return `<g>${T('translate', dPos)}${rex}</g>` + chaser;
    }

    function ramMeter() {
        const w = seq(N, f => ((f % 28) / 27 * 118).toFixed(1));
        return `<g transform="translate(40 18)">${hand(0, 18, 'RAM de Chrome', 22)}<rect x="130" y="2" width="124" height="20" rx="6" fill="#fff" ${S}/>
            <rect x="133" y="5" width="0" height="14" rx="4" fill="#D9483B">${A('width', w)}</rect>
            <g>${A('opacity', seq(N, f => (f % 28 > 22 ? 1 : 0)))}${hand(290, 19, '¡99 %!', 22, 'text-anchor="middle"', '#D9483B')}</g></g>`;
    }

    function chrome() {
        const pos = mv([[0, 600, 120], [8, 590, 120], [12, 640, 120], [16, 660, 120], [20, 570, 120], [26, 560, 120], [28, 560, 120], [29, 630, 112], [30, 600, 120],
            [32, 600, 120], [33, 614, 108], [34, 588, 116], [35, 606, 120], [36, 600, 120], [44, 600, 120], [45, 600, 112], [46, 600, 120], [63, 600, 120], [64, 590, 118], [65, 604, 120], [84, 600, 120]]);
        return `<g>${show([[0, 69], [83, 84]])}<g>${pos}${chromeBall()}</g></g>`;
    }

    function banner(mobile) {
        const groundLine = `<path d="M-10 ${GY} Q300 ${GY - 4} 600 ${GY} T1210 ${GY - 1}" fill="none" ${S}/>` +
            `<path d="M40 206 H90 M220 204 H250 M700 206 H760 M1040 205 H1080" ${S} stroke-width="1.6"/>`;
        const body = groundLine + (mobile ? '' : ramMeter()) + tugTeam() + chrome() + samurai() + sweeper() + waterer() + brawl() + dino();
        if (!mobile) return svg('0 0 1200 224', body, 'doodle-brawl', 'Mini Claudes peleándose contra Chrome');
        // Móvil: "cámara" que sigue la acción animando el viewBox (400×230)
        const pan = tl(N, [[0, 290], [27, 290], [29, 470], [44, 470], [46, 640], [57, 640], [59, 450], [69, 450], [71, 410], [82, 410], [84, 290]])
            .split(';').map(x => `${x} -4 400 230`).join(';');
        const out = svg('290 -4 400 230', body, 'doodle-brawl doodle-brawl-m', 'Mini Claudes peleándose contra Chrome');
        const cam = `<animate attributeName="viewBox" values="${pan}" dur="${(N / 7).toFixed(3)}s" calcMode="discrete" repeatCount="indefinite"/>`;
        return out.replace(/^(<svg[^>]*>)/, `$1${cam}`);
    }

    D.pieces.brawl = () => banner(false);
    D.pieces.brawlMobile = () => banner(true);
})(window);
