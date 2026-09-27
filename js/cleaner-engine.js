/* =====================================================================
 * CLEANER — Motor de limpieza (100 % en el navegador)
 *  - scan(bytes, name):  analiza metadatos (EXIF, XMP, IPTC, C2PA, ICC,
 *                        textos PNG, datos tras fin de imagen…)
 *  - strip(bytes, opts): elimina metadatos SIN pérdida (JPEG / PNG / WebP)
 *  - clean(file, opts):  flujo completo: "meta" (sin pérdida) o "deep"
 *                        (reprocesado de píxeles + recompresión nueva)
 * ===================================================================== */
(function (global) {
    'use strict';

    /* ------------------------------------------------------------------ */
    /* Utilidades                                                          */
    /* ------------------------------------------------------------------ */
    const latin1 = new TextDecoder('latin1');
    const ascii = (b, start, len) => latin1.decode(b.subarray(start, Math.min(b.length, start + len)));

    function concat(parts) {
        let total = 0;
        for (const p of parts) total += p.length;
        const out = new Uint8Array(total);
        let off = 0;
        for (const p of parts) { out.set(p, off); off += p.length; }
        return out;
    }

    function detectFormat(b) {
        if (b.length < 12) return 'unknown';
        if (b[0] === 0xFF && b[1] === 0xD8) return 'jpeg';
        if (b[0] === 0x89 && ascii(b, 1, 3) === 'PNG') return 'png';
        if (ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'webp';
        if (ascii(b, 0, 3) === 'GIF') return 'gif';
        if (b[0] === 0x42 && b[1] === 0x4D) return 'bmp';
        if (ascii(b, 4, 4) === 'ftyp') return 'avif';
        return 'unknown';
    }

    const MIME = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
    const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

    /* ------------------------------------------------------------------ */
    /* Pistas de IA                                                        */
    /* ------------------------------------------------------------------ */
    const AI_KEYWORDS = [
        ['c2pa', 'Content Credentials (C2PA)'],
        ['contentauth', 'Content Credentials (C2PA)'],
        ['jumbf', 'Contenedor JUMBF (C2PA)'],
        ['compositewithtrainedalgorithmicmedia', 'IPTC: editado con IA'],
        ['trainedalgorithmicmedia', 'IPTC: generado por IA'],
        ['algorithmicmedia', 'IPTC: medio algorítmico'],
        ['midjourney', 'Midjourney'],
        ['dall-e', 'DALL·E'],
        ['dall·e', 'DALL·E'],
        ['openai', 'OpenAI'],
        ['chatgpt', 'ChatGPT'],
        ['firefly', 'Adobe Firefly'],
        ['generative fill', 'Relleno generativo'],
        ['generativefill', 'Relleno generativo'],
        ['stable diffusion', 'Stable Diffusion'],
        ['stablediffusion', 'Stable Diffusion'],
        ['negative prompt', 'Prompt de IA incrustado'],
        ['comfyui', 'ComfyUI'],
        ['gemini', 'Google Gemini'],
        ['synthid', 'Google SynthID'],
        ['google ai', 'Google AI'],
        ['leonardo.ai', 'Leonardo AI'],
        ['ideogram', 'Ideogram'],
        ['black forest labs', 'FLUX'],
        ['bing image creator', 'Bing Image Creator'],
        ['microsoft designer', 'Microsoft Designer'],
        ['xai', 'Grok / xAI'],
        ['meta ai', 'Meta AI'],
        ['runwayml', 'Runway'],
        ['krea.ai', 'Krea'],
        ['made with ai', 'Etiqueta "Made with AI"'],
        ['ai generated', 'Etiqueta "AI generated"'],
        ['ai-generated', 'Etiqueta "AI generated"']
    ];

    const AI_FILENAME = /(chatgpt|dall[-_ ]?e|midjourney|gemini|firefly|leonardo|ideogram|stable[-_ ]?diffusion|sdxl|comfyui|grok|flux|nano[-_ ]?banana|ai[-_ ]?generated|generated[-_ ]?image|copilot|openai)/i;

    function findAiHints(text, set) {
        const low = text.toLowerCase();
        for (const [k, label] of AI_KEYWORDS) {
            if (k === 'xai') {
                if (/\bxai\b/.test(low)) set.add(label);
            } else if (low.includes(k)) {
                set.add(label);
            }
        }
    }

    /* ------------------------------------------------------------------ */
    /* Parser EXIF / TIFF mínimo                                           */
    /* ------------------------------------------------------------------ */
    const EXIF_TAGS = {
        0x010E: 'Descripción', 0x010F: 'Marca', 0x0110: 'Modelo', 0x0131: 'Software',
        0x0132: 'Fecha', 0x013B: 'Autor', 0x8298: 'Copyright', 0x9003: 'Fecha original',
        0xA430: 'Propietario', 0xA433: 'Marca de lente', 0xA434: 'Lente'
    };

    function parseTiff(b, start) {
        const out = { fields: {}, gps: false, orientation: 1 };
        try {
            const le = b[start] === 0x49; // 'II' = little endian
            const dv = new DataView(b.buffer, b.byteOffset + start, b.length - start);
            const u16 = o => dv.getUint16(o, le);
            const u32 = o => dv.getUint32(o, le);
            if (u16(2) !== 42) return out;
            const visited = new Set();
            const readIfd = (off, depth) => {
                if (!off || visited.has(off) || depth > 3 || off + 2 > dv.byteLength) return;
                visited.add(off);
                const n = u16(off);
                for (let i = 0; i < n && i < 500; i++) {
                    const e = off + 2 + i * 12;
                    if (e + 12 > dv.byteLength) break;
                    const tag = u16(e), type = u16(e + 2), count = u32(e + 4);
                    if (tag === 0x8825) out.gps = true;
                    if (tag === 0x0112 && type === 3) out.orientation = u16(e + 8) || 1;
                    if (tag === 0x8769) readIfd(u32(e + 8), depth + 1);
                    if (EXIF_TAGS[tag] && type === 2 && count > 0) {
                        const vOff = count <= 4 ? e + 8 : u32(e + 8);
                        if (vOff + count <= dv.byteLength) {
                            const s = latin1.decode(new Uint8Array(dv.buffer, dv.byteOffset + vOff, Math.min(count, 300)))
                                .replace(/\0+/g, ' ').trim();
                            if (s) out.fields[EXIF_TAGS[tag]] = s;
                        }
                    }
                }
            };
            readIfd(u32(4), 0);
        } catch (e) { /* EXIF corrupto: se ignora */ }
        return out;
    }

    /* ------------------------------------------------------------------ */
    /* JPEG                                                                */
    /* ------------------------------------------------------------------ */
    function walkJpeg(b) {
        const segs = [];
        const len = b.length;
        let i = 2;
        let eoi = -1;
        while (i < len - 1) {
            if (b[i] !== 0xFF) { i++; continue; }
            while (i < len - 2 && b[i + 1] === 0xFF) i++; // relleno
            const m = b[i + 1];
            if (m === 0xD9) { eoi = i; break; }
            if ((m >= 0xD0 && m <= 0xD7) || m === 0x01) {
                segs.push({ marker: m, start: i, end: i + 2, kind: 'rst' });
                i += 2; continue;
            }
            if (i + 3 >= len) break;
            const segLen = (b[i + 2] << 8) | b[i + 3];
            const end = Math.min(i + 2 + segLen, len);
            segs.push({ marker: m, start: i, end, dataStart: i + 4, kind: 'seg' });
            i = end;
            if (m === 0xDA) { // datos entrópicos después de SOS
                let j = i;
                while (j < len - 1) {
                    if (b[j] === 0xFF) {
                        const n = b[j + 1];
                        if (n === 0x00 || (n >= 0xD0 && n <= 0xD7)) { j += 2; continue; }
                        if (n === 0xFF) { j += 1; continue; }
                        break;
                    }
                    j++;
                }
                segs.push({ marker: -1, start: i, end: j, kind: 'scan' });
                i = j;
            }
        }
        const trailing = eoi >= 0 ? len - (eoi + 2) : 0;
        return { segs, eoi, trailing };
    }

    function classifyJpegSeg(b, s) {
        const m = s.marker;
        if (m === 0xFE) return 'Comentario';
        if (m < 0xE0 || m > 0xEF) return null;
        const id = ascii(b, s.dataStart, 40);
        if (m === 0xE0) return id.startsWith('JFIF') ? 'JFIF' : 'APP0';
        if (m === 0xE1) {
            if (id.startsWith('Exif')) return 'EXIF';
            if (id.includes('ns.adobe.com/xap') || id.includes('ns.adobe.com/xmp')) return 'XMP';
            return 'APP1';
        }
        if (m === 0xE2) {
            if (id.startsWith('ICC_PROFILE')) return 'ICC';
            if (id.startsWith('MPF')) return 'MPF (multi-imagen)';
            return 'APP2';
        }
        if (m === 0xEB) return 'C2PA / JUMBF';
        if (m === 0xED) return 'IPTC / Photoshop';
        if (m === 0xEE && id.startsWith('Adobe')) return 'Adobe';
        return 'APP' + (m - 0xE0);
    }

    function scanJpeg(b, r, hints) {
        const { segs, trailing } = walkJpeg(b);
        for (const s of segs) {
            const kind = classifyJpegSeg(b, s);
            if (!kind) continue;
            r.blocks.push({ type: kind, size: s.end - s.start });
            if (kind === 'EXIF') {
                const t = parseTiff(b.subarray(0, s.end), s.dataStart + 6);
                Object.assign(r.fields, t.fields);
                if (t.gps) r.gps = true;
                r.orientation = t.orientation;
            }
            if (kind !== 'ICC' && kind !== 'JFIF' && kind !== 'Adobe') {
                findAiHints(ascii(b, s.dataStart, Math.min(s.end - s.dataStart, 400000)), hints);
            }
            if (kind === 'C2PA / JUMBF') hints.add('Content Credentials (C2PA)');
        }
        if (trailing > 16) {
            r.blocks.push({ type: 'Datos tras fin de imagen', size: trailing });
            findAiHints(ascii(b, b.length - trailing, Math.min(trailing, 200000)), hints);
        }
    }

    // EXIF mínimo que SOLO contiene la orientación (para que no se gire la foto)
    function orientationApp1(o) {
        return new Uint8Array([
            0xFF, 0xE1, 0x00, 0x22,
            0x45, 0x78, 0x69, 0x66, 0x00, 0x00,           // "Exif\0\0"
            0x4D, 0x4D, 0x00, 0x2A, 0x00, 0x00, 0x00, 0x08, // TIFF big-endian
            0x00, 0x01,                                     // 1 entrada
            0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, // Orientation, SHORT, 1
            0x00, o & 0xFF, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00                          // sin más IFDs
        ]);
    }

    function stripJpeg(b, opts) {
        const { segs } = walkJpeg(b);
        const parts = [new Uint8Array([0xFF, 0xD8])];
        let orientation = 1;
        let insertedOrientation = false;
        for (const s of segs) {
            const kind = classifyJpegSeg(b, s);
            if (kind === 'EXIF') {
                orientation = parseTiff(b.subarray(0, s.end), s.dataStart + 6).orientation;
            }
        }
        const addOrientation = () => {
            if (!insertedOrientation && orientation > 1 && orientation <= 8) {
                parts.push(orientationApp1(orientation));
            }
            insertedOrientation = true;
        };
        for (const s of segs) {
            const kind = classifyJpegSeg(b, s);
            let keep = true;
            if (kind) {
                keep = kind === 'JFIF' || kind === 'Adobe' || (kind === 'ICC' && opts.keepIcc);
            }
            if (!kind && !insertedOrientation) addOrientation();
            if (keep) {
                parts.push(b.subarray(s.start, s.end));
                if (kind === 'JFIF') addOrientation();
            }
        }
        parts.push(new Uint8Array([0xFF, 0xD9])); // se descarta todo lo que venga detrás
        return concat(parts);
    }

    /* ------------------------------------------------------------------ */
    /* PNG                                                                 */
    /* ------------------------------------------------------------------ */
    function walkPng(b) {
        const chunks = [];
        const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
        let i = 8;
        while (i + 12 <= b.length) {
            const len = dv.getUint32(i);
            const type = ascii(b, i + 4, 4);
            const end = i + 12 + len;
            if (end > b.length) break;
            chunks.push({ type, start: i, dataStart: i + 8, dataEnd: i + 8 + len, end });
            i = end;
            if (type === 'IEND') break;
        }
        return { chunks, trailing: b.length - i };
    }

    const PNG_KEEP = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'sBIT', 'acTL', 'fcTL', 'fdAT']);
    const PNG_LABEL = {
        tEXt: 'Texto (tEXt)', zTXt: 'Texto comprimido (zTXt)', iTXt: 'Texto / XMP (iTXt)',
        eXIf: 'EXIF', tIME: 'Fecha (tIME)', iCCP: 'ICC', caBX: 'C2PA / JUMBF', pHYs: 'Resolución (pHYs)'
    };

    function scanPng(b, r, hints) {
        const { chunks, trailing } = walkPng(b);
        for (const c of chunks) {
            if (PNG_KEEP.has(c.type)) continue;
            r.blocks.push({ type: PNG_LABEL[c.type] || ('Bloque ' + c.type), size: c.end - c.start });
            if (c.type === 'eXIf') {
                const t = parseTiff(b.subarray(0, c.dataEnd), c.dataStart);
                Object.assign(r.fields, t.fields);
                if (t.gps) r.gps = true;
            }
            if (c.type === 'tEXt' || c.type === 'iTXt' || c.type === 'zTXt') {
                const text = ascii(b, c.dataStart, Math.min(c.dataEnd - c.dataStart, 400000));
                const key = text.split('\0')[0].toLowerCase();
                if (['parameters', 'prompt', 'workflow', 'sd-metadata', 'invokeai_metadata', 'dream'].includes(key)) {
                    hints.add('Prompt / flujo de IA incrustado');
                }
                if (c.type !== 'zTXt') findAiHints(text, hints);
                if (key === 'software') r.fields['Software'] = text.slice(key.length + 1, key.length + 120);
            }
            if (c.type === 'caBX') hints.add('Content Credentials (C2PA)');
        }
        if (trailing > 16) r.blocks.push({ type: 'Datos tras fin de imagen', size: trailing });
    }

    function stripPng(b, opts) {
        const { chunks } = walkPng(b);
        const parts = [b.subarray(0, 8)];
        for (const c of chunks) {
            if (PNG_KEEP.has(c.type) || (c.type === 'iCCP' && opts.keepIcc)) {
                parts.push(b.subarray(c.start, c.end)); // CRC intacto
            }
        }
        return concat(parts);
    }

    /* ------------------------------------------------------------------ */
    /* WebP                                                                */
    /* ------------------------------------------------------------------ */
    function walkWebp(b) {
        const chunks = [];
        const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
        let i = 12;
        while (i + 8 <= b.length) {
            const type = ascii(b, i, 4);
            const size = dv.getUint32(i + 4, true);
            const end = Math.min(i + 8 + size + (size & 1), b.length);
            chunks.push({ type, start: i, dataStart: i + 8, dataEnd: i + 8 + size, end });
            i = end;
        }
        return chunks;
    }

    const WEBP_KEEP = new Set(['VP8 ', 'VP8L', 'VP8X', 'ALPH', 'ANIM', 'ANMF']);

    function scanWebp(b, r, hints) {
        for (const c of walkWebp(b)) {
            if (WEBP_KEEP.has(c.type)) continue;
            const label = c.type === 'EXIF' ? 'EXIF' : c.type === 'XMP ' ? 'XMP' : c.type === 'ICCP' ? 'ICC' : ('Bloque ' + c.type.trim());
            r.blocks.push({ type: label, size: c.end - c.start });
            if (c.type === 'EXIF') {
                let s = c.dataStart;
                if (ascii(b, s, 4) === 'Exif') s += 6;
                const t = parseTiff(b.subarray(0, c.dataEnd), s);
                Object.assign(r.fields, t.fields);
                if (t.gps) r.gps = true;
            }
            if (c.type !== 'ICCP') findAiHints(ascii(b, c.dataStart, Math.min(c.dataEnd - c.dataStart, 400000)), hints);
        }
    }

    function stripWebp(b, opts) {
        const parts = [];
        for (const c of walkWebp(b)) {
            if (WEBP_KEEP.has(c.type) || (c.type === 'ICCP' && opts.keepIcc)) {
                let chunk = b.slice(c.start, c.end);
                if (c.type === 'VP8X') {
                    // Actualiza flags: quita EXIF (0x08) y XMP (0x04), y el ICC (0x20) si se elimina
                    chunk[8] &= ~(0x08 | 0x04 | (opts.keepIcc ? 0 : 0x20));
                }
                parts.push(chunk);
            }
        }
        const body = concat(parts);
        const header = new Uint8Array(12);
        header.set([0x52, 0x49, 0x46, 0x46]); // RIFF
        new DataView(header.buffer).setUint32(4, body.length + 4, true);
        header.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
        return concat([header, body]);
    }

    /* ------------------------------------------------------------------ */
    /* API: scan / strip                                                   */
    /* ------------------------------------------------------------------ */
    function scan(bytes, name) {
        const r = { format: detectFormat(bytes), blocks: [], fields: {}, gps: false, orientation: 1, aiHints: [], filenameHint: false };
        const hints = new Set();
        try {
            if (r.format === 'jpeg') scanJpeg(bytes, r, hints);
            else if (r.format === 'png') scanPng(bytes, r, hints);
            else if (r.format === 'webp') scanWebp(bytes, r, hints);
        } catch (e) { console.warn('CLEANER scan:', e); }
        for (const v of Object.values(r.fields)) findAiHints(v, hints);
        if (name && AI_FILENAME.test(name)) r.filenameHint = true;
        r.aiHints = [...hints];
        const ignorable = new Set(['JFIF', 'Adobe']);
        r.metaBlocks = r.blocks.filter(bk => !ignorable.has(bk.type));
        r.metaBytes = r.metaBlocks.reduce((a, bk) => a + bk.size, 0);
        return r;
    }

    function canStripLossless(format) {
        return format === 'jpeg' || format === 'png' || format === 'webp';
    }

    function strip(bytes, opts) {
        const f = detectFormat(bytes);
        if (f === 'jpeg') return stripJpeg(bytes, opts);
        if (f === 'png') return stripPng(bytes, opts);
        if (f === 'webp') return stripWebp(bytes, opts);
        throw new Error('Formato no compatible con limpieza sin pérdida');
    }

    /* ------------------------------------------------------------------ */
    /* Utilidades del pipeline forense                                     */
    /* ------------------------------------------------------------------ */
    // PRNG rápido con semilla criptográfica (cada imagen tiene una huella distinta)
    function makeRng() {
        const seed = new Uint32Array(1);
        crypto.getRandomValues(seed);
        let s = seed[0] || 0x9E3779B9;
        return () => {
            s ^= s << 13; s >>>= 0;
            s ^= s >>> 17;
            s ^= s << 5; s >>>= 0;
            return s / 4294967296;
        };
    }

    async function decode(blob) {
        if ('createImageBitmap' in global) {
            try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }); } catch (e) { /* fallback */ }
        }
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => { resolve(img); setTimeout(() => URL.revokeObjectURL(url), 0); };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo decodificar la imagen')); };
            img.src = url;
        });
    }

    function canvasToBlob(canvas, type, quality) {
        return new Promise((resolve, reject) => {
            canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Error al codificar'))), type, quality);
        });
    }

    /* ------------------------------------------------------------------ */
    /* Simulación de cámara (modo forense)                                 */
    /* Reproduce la cadena de una cámara real: geometría de lente,         */
    /* aberración cromática, viñeteo, filtro Bayer + demosaico, nitidez    */
    /* del procesador y ruido de sensor dependiente de la señal.           */
    /* ------------------------------------------------------------------ */
    const CAMERA = {
        low:    { rot: 0.15, shift: 0.6, cycle: 0,    ca: 0.0004, vig: 0.025, cfa: 0.6,  sharp: 0.18, shot: 0.012, read: 0.9, chroma: 0.35, gain: 0.003 },
        medium: { rot: 0.30, shift: 0.9, cycle: 0.93, ca: 0.0007, vig: 0.045, cfa: 0.85, sharp: 0.26, shot: 0.022, read: 1.3, chroma: 0.40, gain: 0.005 },
        high:   { rot: 0.55, shift: 1.3, cycle: 0.87, ca: 0.0011, vig: 0.07,  cfa: 1.0,  sharp: 0.34, shot: 0.040, read: 1.8, chroma: 0.45, gain: 0.008 }
    };

    // Cede el hilo principal para que la interfaz y las animaciones SVG sigan vivas.
    // Espera a un frame pintado (rAF) con un respaldo por si la pestaña está en segundo plano.
    let lastYield = 0;
    const frame = () => new Promise(r => {
        let done = false;
        const go = () => { if (!done) { done = true; r(); } };
        requestAnimationFrame(() => setTimeout(go, 0));
        setTimeout(go, 120);
    });
    async function breathe(force) {
        const now = performance.now();
        if (force || now - lastYield > 40) { await frame(); lastYield = performance.now(); }
    }
    const tick = () => breathe(true);
    const noop = async () => {};

    function sample(a, W, H, x, y, c) {
        if (x < 0) x = 0; else if (x > W - 1) x = W - 1;
        if (y < 0) y = 0; else if (y > H - 1) y = H - 1;
        const x0 = x | 0, y0 = y | 0;
        const x1 = x0 < W - 1 ? x0 + 1 : x0, y1 = y0 < H - 1 ? y0 + 1 : y0;
        const fx = x - x0, fy = y - y0;
        const r0 = y0 * W, r1 = y1 * W;
        const top = a[(r0 + x0) * 4 + c] * (1 - fx) + a[(r0 + x1) * 4 + c] * fx;
        const bot = a[(r1 + x0) * 4 + c] * (1 - fx) + a[(r1 + x1) * 4 + c] * fx;
        return top * (1 - fy) + bot * fy;
    }

    const gauss = rnd => (rnd() + rnd() + rnd() + rnd() - 2) * 1.7320508;

    async function cameraPipeline(blob, outType, quality, level, stage) {
        stage = stage || noop;
        const P = CAMERA[level] || CAMERA.medium;
        await stage('rebuild');
        const rnd = makeRng();
        const bmp = await decode(blob);
        const W = bmp.width, H = bmp.height, N = W * H;

        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (outType === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1) Ciclo de remuestreo (borra la huella de "upsampling" de los generadores)
        if (P.cycle && W > 64 && H > 64) {
            const f = P.cycle + (rnd() - 0.5) * 0.02;
            const tmp = document.createElement('canvas');
            tmp.width = Math.round(W * f); tmp.height = Math.round(H * f);
            const t = tmp.getContext('2d');
            t.imageSmoothingEnabled = true; t.imageSmoothingQuality = 'high';
            t.drawImage(bmp, 0, 0, tmp.width, tmp.height);
            ctx.drawImage(tmp, 0, 0, W, H);
            tmp.width = tmp.height = 1;
        } else {
            ctx.drawImage(bmp, 0, 0);
        }
        if (bmp.close) bmp.close();

        const img = ctx.getImageData(0, 0, W, H);
        const src = img.data;
        let hasAlpha = false;
        for (let i = 3; i < src.length; i += 4) { if (src[i] < 255) { hasAlpha = true; break; } }
        await tick();
        await stage('lens');

        // 2) Óptica: micro-rotación, desplazamiento sub-píxel, distorsión, aberración cromática y viñeteo
        const th = (rnd() * 2 - 1) * P.rot * Math.PI / 180;
        const cos = Math.cos(th), sin = Math.sin(th);
        const ratio = Math.max(W / H, H / W);
        const shx = (rnd() * 2 - 1) * P.shift, shy = (rnd() * 2 - 1) * P.shift;
        const scale = Math.abs(cos) + ratio * Math.abs(sin) + (2 * P.shift + 2) / Math.min(W, H);
        const k = (rnd() * 2 - 1) * 0.004;
        const caR = 1 + P.ca * (0.6 + rnd() * 0.8), caB = 1 - P.ca * (0.6 + rnd() * 0.8);
        const cx = (W - 1) / 2, cy = (H - 1) / 2;
        const R2 = cx * cx + cy * cy;
        const vig = P.vig * (0.7 + rnd() * 0.6);

        const F = new Float32Array(N * 3);
        const A = hasAlpha ? new Uint8ClampedArray(N) : null;
        for (let y = 0; y < H; y++) {
            if ((y & 7) === 0) await breathe();
            const dy = y - cy;
            for (let x = 0; x < W; x++) {
                const dx = x - cx;
                const r2 = (dx * dx + dy * dy) / R2;
                const d = (1 + k * r2) / scale;
                const u = (cos * dx + sin * dy) * d;
                const v = (-sin * dx + cos * dy) * d;
                const bx = cx + shx, by = cy + shy;
                const vg = 1 - vig * r2;
                const o = (y * W + x) * 3;
                F[o]     = sample(src, W, H, bx + u * caR, by + v * caR, 0) * vg;
                F[o + 1] = sample(src, W, H, bx + u, by + v, 1) * vg;
                F[o + 2] = sample(src, W, H, bx + u * caB, by + v * caB, 2) * vg;
                if (A) A[y * W + x] = sample(src, W, H, bx + u, by + v, 3);
            }
        }
        await tick();
        await stage('bayer');

        // 3) Sensor: mosaico Bayer (RGGB) con ruido de disparo + ruido de lectura
        const ox = rnd() < 0.5 ? 0 : 1, oy = rnd() < 0.5 ? 0 : 1;
        const M = new Float32Array(N);
        for (let y = 0; y < H; y++) {
            if ((y & 15) === 0) await breathe();
            const py = (y + oy) & 1;
            for (let x = 0; x < W; x++) {
                const px = (x + ox) & 1;
                const ch = px === 0 && py === 0 ? 0 : (px === 1 && py === 1 ? 2 : 1);
                const i = y * W + x;
                const val = F[i * 3 + ch];
                const sigma = Math.sqrt(P.read * P.read + P.shot * Math.max(0, val) * 3);
                M[i] = val + gauss(rnd) * sigma;
            }
        }
        await tick();

        // 4) Demosaico bilineal (correlación entre canales propia de una cámara real)
        const m = (x, y) => {
            if (x < 0) x = 1; else if (x >= W) x = W - 2;
            if (y < 0) y = 1; else if (y >= H) y = H - 2;
            return M[y * W + x];
        };
        const cfa = P.cfa, keep = 1 - cfa;
        const chromaN = P.read * P.chroma;
        for (let y = 0; y < H; y++) {
            if ((y & 7) === 0) await breathe();
            const py = (y + oy) & 1;
            for (let x = 0; x < W; x++) {
                const px = (x + ox) & 1;
                const c = m(x, y);
                const cross = (m(x - 1, y) + m(x + 1, y) + m(x, y - 1) + m(x, y + 1)) * 0.25;
                const diag = (m(x - 1, y - 1) + m(x + 1, y - 1) + m(x - 1, y + 1) + m(x + 1, y + 1)) * 0.25;
                const hz = (m(x - 1, y) + m(x + 1, y)) * 0.5;
                const vt = (m(x, y - 1) + m(x, y + 1)) * 0.5;
                let r, g, b;
                if (px === 0 && py === 0) { r = c; g = cross; b = diag; }
                else if (px === 1 && py === 1) { b = c; g = cross; r = diag; }
                else if (py === 0) { g = c; r = hz; b = vt; }
                else { g = c; r = vt; b = hz; }
                const o = (y * W + x) * 3;
                F[o]     = r * cfa + F[o] * keep + gauss(rnd) * chromaN;
                F[o + 1] = g * cfa + F[o + 1] * keep;
                F[o + 2] = b * cfa + F[o + 2] * keep + gauss(rnd) * chromaN;
            }
        }
        await tick();
        await stage('sensor');

        // 5) Procesador de imagen: nitidez (unsharp mask) + balance de blancos + dithering
        const out = img.data;
        const gains = [1 + (rnd() * 2 - 1) * P.gain, 1 + (rnd() * 2 - 1) * P.gain, 1 + (rnd() * 2 - 1) * P.gain];
        const sharp = P.sharp;
        for (let c = 0; c < 3; c++) {
            for (let y = 0; y < H; y++) {
                if ((y & 15) === 0) await breathe();
                const row = y * W;
                for (let x = 0; x < W; x++) {
                    const xl = x > 0 ? x - 1 : 0, xr = x < W - 1 ? x + 1 : x;
                    M[row + x] = (F[(row + xl) * 3 + c] + F[(row + x) * 3 + c] + F[(row + xr) * 3 + c]) / 3;
                }
            }
            const g = gains[c];
            for (let y = 0; y < H; y++) {
                if ((y & 15) === 0) await breathe();
                const yu = y > 0 ? y - 1 : 0, yd = y < H - 1 ? y + 1 : y;
                for (let x = 0; x < W; x++) {
                    const i = y * W + x;
                    const v = F[i * 3 + c];
                    const blur = (M[yu * W + x] + M[i] + M[yd * W + x]) / 3;
                    out[i * 4 + c] = (v + sharp * (v - blur)) * g + (rnd() - 0.5);
                }
            }
            await tick();
        }
        for (let i = 0; i < N; i++) out[i * 4 + 3] = A ? A[i] : 255;
        ctx.putImageData(img, 0, 0);
        await stage('pack');
        await tick();

        let q = quality;
        if (outType !== 'image/png') q = Math.min(1, Math.max(0.8, quality + Math.round((rnd() * 2 - 1) * 2) / 100));
        const outBlob = await canvasToBlob(canvas, outType, q);
        canvas.width = canvas.height = 1;
        return { blob: outBlob, width: W, height: H };
    }

    /* ------------------------------------------------------------------ */
    /* API principal                                                       */
    /* ------------------------------------------------------------------ */
    function pad(n) { return String(n).padStart(2, '0'); }

    function buildName(originalName, ext, rename, index) {
        if (rename) {
            const d = new Date(Date.now() - index * 1000);
            return `IMG_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.${ext}`;
        }
        const base = originalName.replace(/\.[^.]+$/, '') || 'imagen';
        return `${base}.${ext}`;
    }

    /**
     * Limpieza forense completa.
     * 1) Quita metadatos sin pérdida (EXIF/XMP/IPTC/C2PA) del archivo de origen
     *    para que el decodificador no arrastre nada.
     * 2) Reconstruye la imagen con la simulación de cámara.
     * @param {File} file
     * @param {{intensity:string, format:string, quality:number, rename:boolean, index:number, onStage?:(id:string)=>Promise<void>}} opts
     */
    async function clean(file, opts) {
        const stage = opts.onStage || noop;
        const bytes = new Uint8Array(await file.arrayBuffer());
        const srcFormat = detectFormat(bytes);
        if (srcFormat === 'unknown') throw new Error('Formato de imagen no reconocido');

        const srcMime = MIME[srcFormat];
        let outType = opts.format === 'original' ? (srcMime || 'image/png') : opts.format;

        await stage('c2pa');
        await stage('exif');
        let source = file;
        if (canStripLossless(srcFormat)) {
            try { source = new Blob([strip(bytes, { keepIcc: true })], { type: srcMime }); } catch (e) { source = file; }
        }

        const res = await cameraPipeline(source, outType, opts.quality, opts.intensity, stage);
        const blob = res.blob;
        outType = blob.type || outType;
        const width = res.width, height = res.height;
        const method = 'Forense (simulación de cámara)';

        const outBytes = new Uint8Array(await blob.arrayBuffer());
        const after = scan(outBytes, '');
        const name = buildName(file.name, EXT[outType] || 'png', opts.rename, opts.index || 0);
        return { blob, name, width, height, method, after, outType };
    }

    global.CleanerEngine = { scan, strip, clean, detectFormat };
})(window);
