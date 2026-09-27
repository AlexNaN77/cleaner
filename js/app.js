/* =====================================================================
 * CLEANER — Lógica de interfaz
 * ===================================================================== */
(function () {
    'use strict';

    const $ = sel => document.querySelector(sel);
    const els = {
        drop: $('#drop-zone'), input: $('#file-input'), list: $('#queue-list'),
        toolbar: $('#queue-toolbar'), summary: $('#queue-summary'),
        clean: $('#clean-btn'), zip: $('#zip-btn'), clear: $('#clear-btn'),
        format: $('#format-select'), quality: $('#quality-range'), qualityOut: $('#quality-value'),
        qualityField: $('#quality-field'), rename: $('#rename-check'),
        pDialog: $('#process-dialog'), pCount: $('#process-count'), pFile: $('#process-file'),
        pStage: $('#process-stage'), pLabel: $('#process-step-label'), pFill: $('#process-bar-fill'), pSteps: $('#process-steps'),
        dialog: $('#compare-dialog'), cTitle: $('#compare-title'), cBefore: $('#compare-before'),
        cAfter: $('#compare-after'), cWrap: $('#compare-before-wrap'), cHandle: $('#compare-handle'),
        cRange: $('#compare-range'), cClose: $('#compare-close')
    };

    Doodles.mount();

    /* ---------- Pasos del proceso (experiencia) ---------- */
    // "Jarvis, invéntate una apertura": f/1.xx realista (serie de tercios de paso entre f/1.2 y f/1.8)
    function inventAperture() {
        const stops = [1.2, 1.4, 1.6, 1.8];
        const base = stops[Math.floor(Math.random() * stops.length)];
        const wobble = (Math.random() - 0.5) * 0.18;
        const f = Math.min(1.99, Math.max(1.1, base + wobble));
        return 'f/' + f.toFixed(2);
    }

    const STEPS = [
        { id: 'c2pa',    min: 2300, label: () => 'Quitando metadatos C2PA' },
        { id: 'exif',    min: 2300, label: () => 'Eliminando EXIF, XMP, IPTC :)' },
        { id: 'rebuild', min: 2300, label: () => 'Reconstruyendo imagen a partir de modelos matemáticos' },
        { id: 'lens',    min: 2300, label: ctx => `Calculando lente de exposición ${ctx.aperture}` },
        { id: 'bayer',   min: 2600, label: () => 'Haciendo simulación de fórmula de Bayer' },
        { id: 'sensor',  min: 2300, label: () => 'Remodelando el sensor y apertura de API 23' },
        { id: 'pack',    min: 2000, label: () => 'Empaquetando todo' },
        { id: 'done',    min: 1900, label: () => '¡Listo!' }
    ];
    const STEP_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.id, i]));

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    /** @type {Array<{id:string,file:File,url:string,scan:object,status:string,step?:number,result?:object,resultUrl?:string,error?:string}>} */
    let items = [];
    let busy = false;

    /* ---------- helpers ---------- */
    const fmtSize = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB';
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const uid = () => Math.random().toString(36).slice(2, 10);

    function getOpts(index) {
        return {
            intensity: document.querySelector('input[name="intensity"]:checked').value,
            format: els.format.value,
            quality: Number(els.quality.value) / 100,
            rename: els.rename.checked,
            index
        };
    }

    /* ---------- ajustes ---------- */
    function syncSettings() {
        els.qualityField.classList.toggle('is-disabled', els.format.value === 'image/png');
        els.qualityOut.textContent = els.quality.value;
    }
    const HINTS = {
        low: 'Suave: una pasadita con esponja. Casi no se nota.',
        medium: 'Media: escoba y trapeador, balance ideal.',
        high: '"Fuerte": hidrolavadora. La que mejor rompe la huella de IA.'
    };
    const hintEl = document.getElementById('intensity-hint');
    function syncHint() {
        const v = document.querySelector('input[name="intensity"]:checked').value;
        hintEl.textContent = HINTS[v];
        hintEl.className = 'hint is-' + v;
    }
    document.querySelectorAll('input[name="intensity"]').forEach(r => r.addEventListener('change', () => { syncHint(); resetResults(); }));
    syncHint();
    els.format.addEventListener('change', () => { syncSettings(); resetResults(); });
    els.quality.addEventListener('input', syncSettings);
    els.quality.addEventListener('change', resetResults);
    els.rename.addEventListener('change', resetResults);
    syncSettings();

    function resetResults() {
        if (busy) return;
        let changed = false;
        for (const it of items) {
            if (it.status === 'done' || it.status === 'error') {
                if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
                it.result = null; it.resultUrl = null; it.status = 'pending'; it.error = null;
                changed = true;
            }
        }
        if (changed) render();
    }

    /* ---------- carga de archivos ---------- */
    async function addFiles(fileList) {
        if (busy) return;
        const files = [...fileList].filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif|bmp)$/i.test(f.name));
        if (!files.length) return;
        for (const file of files) {
            const bytes = new Uint8Array(await file.arrayBuffer());
            const scan = CleanerEngine.scan(bytes, file.name);
            items.push({ id: uid(), file, url: URL.createObjectURL(file), scan, status: 'pending' });
        }
        render();
    }

    els.input.addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
    els.drop.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.input.click(); } });
    ['dragenter', 'dragover'].forEach(ev => els.drop.addEventListener(ev, e => { e.preventDefault(); els.drop.classList.add('is-dragover'); }));
    ['dragleave', 'drop'].forEach(ev => els.drop.addEventListener(ev, e => { e.preventDefault(); els.drop.classList.remove('is-dragover'); }));
    els.drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', e => { e.preventDefault(); if (!els.drop.contains(e.target)) addFiles(e.dataTransfer.files); });
    window.addEventListener('paste', e => {
        const files = [...(e.clipboardData?.files || [])];
        if (files.length) addFiles(files);
    });

    /* ---------- render de la cola ---------- */
    function chipsBefore(scan) {
        const c = [];
        if (scan.aiHints.length) c.push(`<span class="chip chip-danger"><i class="fa-solid fa-robot"></i> Marcas de IA: ${scan.aiHints.length}</span>`);
        if (scan.gps) c.push('<span class="chip chip-danger"><i class="fa-solid fa-location-dot"></i> GPS</span>');
        const types = [...new Set(scan.metaBlocks.map(b => b.type))];
        types.slice(0, 5).forEach(t => c.push(`<span class="chip">${esc(t)}</span>`));
        if (types.length > 5) c.push(`<span class="chip chip-muted">+${types.length - 5}</span>`);
        if (scan.filenameHint) c.push('<span class="chip chip-danger"><i class="fa-solid fa-file-signature"></i> Nombre delator</span>');
        if (!c.length) c.push('<span class="chip chip-muted">Sin metadatos visibles</span>');
        return c.join('');
    }

    function chipsAfter(it) {
        const a = it.result.after;
        const c = [];
        const noFields = !Object.keys(a.fields).length && !a.gps;
        const remaining = a.metaBlocks.filter(b => b.type !== 'ICC' && !(b.type === 'EXIF' && noFields && b.size < 64));
        if (!remaining.length) c.push('<span class="chip chip-ok"><i class="fa-solid fa-circle-check"></i> 0 metadatos</span>');
        if (!a.aiHints.length) c.push('<span class="chip chip-ok"><i class="fa-solid fa-shield-halved"></i> Sin marcas de IA</span>');
        c.push('<span class="chip chip-ok"><i class="fa-solid fa-microscope"></i> Forense</span>');
        return c.join('');
    }

    function detailsHtml(scan) {
        const rows = [];
        for (const [k, v] of Object.entries(scan.fields)) rows.push(`<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`);
        scan.aiHints.forEach(h => rows.push(`<li><strong>IA:</strong> ${esc(h)}</li>`));
        scan.metaBlocks.forEach(b => rows.push(`<li>${esc(b.type)} — ${fmtSize(b.size)}</li>`));
        if (!rows.length) return '';
        return `<details class="item-details"><summary>ver lo que trae escondido (${rows.length})</summary><ul>${rows.join('')}</ul></details>`;
    }

    function progressHtml(it) {
        const i = it.step ?? 0;
        const pct = Math.round(((i + 1) / STEPS.length) * 100);
        const dots = STEPS[i].id === 'done' ? ' ✨' : '…';
        return `<div class="item-progress"><span class="item-progress-label">${esc(STEPS[i].label(it.ctx || {}))}${dots}</span>
            <div class="mini-bar"><span style="width:${pct}%"></span></div></div>`;
    }

    function itemHtml(it) {
        const s = it.scan;
        const done = it.status === 'done';
        const working = it.status === 'working';
        let status = '';
        if (it.status === 'pending') status = '<span class="status"><i class="fa-regular fa-clock"></i> En cola</span>';
        if (working) status = '<span class="status"><i class="fa-solid fa-soap"></i> Lavando…</span>';
        if (it.status === 'error') status = `<span class="status err"><i class="fa-solid fa-triangle-exclamation"></i> ${esc(it.error || 'Error')}</span>`;
        if (done) status = '<span class="status ok"><i class="fa-solid fa-check"></i> Limpiecita</span>';

        const meta = done
            ? `${esc(it.result.name)} · ${it.result.width}×${it.result.height} · ${fmtSize(it.file.size)} → ${fmtSize(it.result.blob.size)}`
            : `${s.format.toUpperCase()} · ${fmtSize(it.file.size)}${s.metaBytes ? ' · ' + fmtSize(s.metaBytes) + ' de metadatos' : ''}`;

        const actions = done
            ? `<a class="btn btn-primary btn-sm wobbly" href="${it.resultUrl}" download="${esc(it.result.name)}"><span class="btn-ico">${Doodles.icon('download')}</span> Descargar</a>
               <button class="btn btn-ghost btn-sm wobbly" data-action="compare" data-id="${it.id}" type="button"><span class="btn-ico">${Doodles.icon('compare')}</span> Comparar</button>`
            : '';

        const cls = done ? 'is-done' : working ? 'is-working' : it.status === 'error' ? 'is-error' : '';
        return `<li class="queue-item wobbly ${cls}" data-item="${it.id}">
            <img class="thumb" src="${done ? it.resultUrl : it.url}" alt="Miniatura de ${esc(it.file.name)}" loading="lazy">
            <div class="item-info">
                <p class="item-name" title="${esc(it.file.name)}">${esc(it.file.name)}</p>
                <p class="item-meta">${meta}</p>
                <div class="chips">${done ? chipsAfter(it) : chipsBefore(s)}</div>
            </div>
            <div class="item-actions">
                ${status}
                ${actions}
                <button class="icon-btn" data-action="remove" data-id="${it.id}" type="button" aria-label="Quitar" title="Quitar" ${busy ? 'disabled' : ''}><i class="fa-solid fa-xmark"></i></button>
            </div>
            ${working ? progressHtml(it) : done ? '' : detailsHtml(s)}
        </li>`;
    }

    function render() {
        els.list.innerHTML = items.map(itemHtml).join('');
        const has = items.length > 0;
        els.toolbar.hidden = !has;
        els.drop.classList.toggle('is-compact', has);
        const done = items.filter(i => i.status === 'done').length;
        els.summary.innerHTML = `<strong>${items.length}</strong> ${items.length === 1 ? 'imagen' : 'imágenes'} · <strong>${done}</strong> limpias`;
        els.zip.disabled = busy || done === 0;
        els.clean.disabled = busy || !items.some(i => i.status !== 'done');
        els.clear.disabled = busy;
        const mode = busy ? 'busy' : 'idle';
        if (els.clean.dataset.mode !== mode) {
            els.clean.dataset.mode = mode;
            els.clean.innerHTML = busy
                ? `<span class="btn-ico">${Doodles.icon('soap')}</span> Lavando…`
                : `<span class="btn-ico">${Doodles.icon('broom')}</span> Limpiar todo`;
        }
    }

    // Actualiza solo la barra del elemento en curso (sin re-renderizar toda la lista)
    function updateItemProgress(it) {
        const li = els.list.querySelector(`[data-item="${it.id}"]`);
        if (!li) return render();
        const old = li.querySelector('.item-progress, .item-details');
        const tmp = document.createElement('div');
        tmp.innerHTML = progressHtml(it);
        if (old) old.replaceWith(tmp.firstElementChild); else li.appendChild(tmp.firstElementChild);
        li.className = 'queue-item wobbly is-working';
        const st = li.querySelector('.status');
        if (st) st.outerHTML = '<span class="status"><i class="fa-solid fa-soap"></i> Lavando…</span>';
    }

    /* ---------- modal de proceso ---------- */
    function buildStepList(ctx) {
        els.pSteps.innerHTML = STEPS.map((s, i) =>
            `<li data-step="${i}"><span class="dot"></span><span>${esc(s.label(ctx))}</span></li>`).join('');
    }

    function showStep(it, index) {
        const step = STEPS[index];
        it.step = index;
        els.pStage.innerHTML = Doodles.scenes[step.id]();
        if (step.id === 'lens') {
            const t = els.pStage.querySelector('.aperture-readout');
            if (t) t.textContent = it.ctx.aperture;
        }
        els.pLabel.textContent = step.label(it.ctx) + (step.id === 'done' ? ' ✨' : '…');
        els.pFill.style.width = Math.round(((index + 1) / STEPS.length) * 100) + '%';
        els.pSteps.querySelectorAll('li').forEach((li, i) => {
            li.classList.toggle('is-done', i < index || step.id === 'done');
            li.classList.toggle('is-active', i === index && step.id !== 'done');
            li.querySelector('.dot').innerHTML = (i < index || step.id === 'done') ? '<i class="fa-solid fa-check"></i>' : '';
        });
        updateItemProgress(it);
    }

    // Controla el ritmo: cada paso dura al menos su "min" para que se disfrute la animación
    function makeStager(it) {
        let current = -1;
        let shownAt = 0;
        const go = async (id) => {
            const target = STEP_INDEX[id];
            if (target === undefined || target <= current) return;
            while (current < target) {
                if (current >= 0) {
                    const wait = STEPS[current].min - (performance.now() - shownAt);
                    if (wait > 0) await sleep(wait);
                }
                current++;
                showStep(it, current);
                shownAt = performance.now();
                await sleep(60); // deja pintar la nueva escena antes de seguir calculando
            }
        };
        return go;
    }

    /* ---------- procesamiento ---------- */
    async function cleanAll() {
        if (busy) return;
        const queue = items.filter(i => i.status !== 'done');
        if (!queue.length) return;
        busy = true;
        render();
        els.pDialog.showModal();

        let n = 0;
        for (const it of queue) {
            n++;
            it.status = 'working';
            it.step = 0;
            it.ctx = { aperture: inventAperture() };
            render();
            els.pCount.textContent = `${n} de ${queue.length}`;
            els.pFile.textContent = it.file.name;
            buildStepList(it.ctx);
            const stage = makeStager(it);
            try {
                const opts = getOpts(items.indexOf(it));
                opts.onStage = stage;
                const result = await CleanerEngine.clean(it.file, opts);
                await stage('done');
                await sleep(STEPS[STEP_INDEX.done].min);
                it.result = result;
                it.resultUrl = URL.createObjectURL(result.blob);
                it.status = 'done';
            } catch (err) {
                console.error(err);
                it.status = 'error';
                it.error = err.message || 'Error';
            }
            render();
        }
        busy = false;
        els.pDialog.close();
        render();
        const first = els.list.querySelector('.queue-item.is-done');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // No se puede cerrar el modal con Esc mientras trabaja
    els.pDialog.addEventListener('cancel', e => { if (busy) e.preventDefault(); });

    async function downloadZip() {
        const done = items.filter(i => i.status === 'done');
        if (!done.length) return;
        const original = els.zip.innerHTML;
        els.zip.disabled = true;
        els.zip.innerHTML = `<span class="btn-ico">${Doodles.icon('soap')}</span> Empacando…`;
        try {
            const zip = new JSZip();
            const used = new Map();
            for (const it of done) {
                let name = it.result.name;
                const count = used.get(name) || 0;
                used.set(name, count + 1);
                if (count) name = name.replace(/(\.[^.]+)$/, `_${count + 1}$1`);
                zip.file(name, it.result.blob, { date: new Date(), binary: true });
            }
            const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `CLEANER_${done.length}_imagenes.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        } catch (err) {
            alert('No se pudo crear el ZIP: ' + err.message);
        } finally {
            els.zip.innerHTML = original;
            els.zip.disabled = false;
        }
    }

    function removeItem(id) {
        if (busy) return;
        const idx = items.findIndex(i => i.id === id);
        if (idx < 0) return;
        const [it] = items.splice(idx, 1);
        URL.revokeObjectURL(it.url);
        if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
        render();
    }

    function clearAll() {
        if (busy) return;
        items.forEach(it => { URL.revokeObjectURL(it.url); if (it.resultUrl) URL.revokeObjectURL(it.resultUrl); });
        items = [];
        render();
    }

    /* ---------- comparador ---------- */
    function setCompare(v) {
        els.cWrap.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
        els.cHandle.style.left = v + '%';
    }
    function openCompare(id) {
        const it = items.find(i => i.id === id);
        if (!it || !it.resultUrl) return;
        els.cTitle.textContent = `${it.file.name} → ${it.result.name}`;
        els.cBefore.src = it.url;
        els.cAfter.src = it.resultUrl;
        els.cRange.value = 50; setCompare(50);
        els.dialog.showModal();
    }
    els.cRange.addEventListener('input', e => setCompare(e.target.value));
    els.cClose.addEventListener('click', () => els.dialog.close());
    els.dialog.addEventListener('click', e => { if (e.target === els.dialog) els.dialog.close(); });
    const stageEl = $('#compare-stage');
    const dragCompare = e => {
        const rect = stageEl.getBoundingClientRect();
        const v = Math.max(0, Math.min(100, (e.clientX - rect.left) / rect.width * 100));
        els.cRange.value = v; setCompare(v);
    };
    stageEl.addEventListener('pointerdown', e => { dragCompare(e); stageEl.setPointerCapture(e.pointerId); });
    stageEl.addEventListener('pointermove', e => { if (e.buttons) dragCompare(e); });

    /* ---------- eventos ---------- */
    els.clean.addEventListener('click', cleanAll);
    els.zip.addEventListener('click', downloadZip);
    els.clear.addEventListener('click', clearAll);
    els.list.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        if (btn.dataset.action === 'remove') removeItem(btn.dataset.id);
        if (btn.dataset.action === 'compare') openCompare(btn.dataset.id);
    });

    render();

    // Vista previa de escenas para pruebas: ?preview=c2pa|exif|rebuild|lens|bayer|sensor|pack|done
    const pv = new URLSearchParams(location.search).get('preview');
    if (pv && STEP_INDEX[pv] !== undefined) {
        const fake = { id: 'preview', ctx: { aperture: inventAperture() } };
        els.pCount.textContent = '1 de 1';
        els.pFile.textContent = 'vista-previa.jpg';
        buildStepList(fake.ctx);
        els.pDialog.showModal();
        showStep(fake, STEP_INDEX[pv]);
    }
})();
