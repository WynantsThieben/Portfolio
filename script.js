(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  root.lang = 'nl';

  /* ---------- category pages (in-page views) ---------- */
  const home = document.getElementById('home');
  const subpages = [...document.querySelectorAll('.subpage')];
  const srcOf = BEELDEN;
  const tileOf = key => (srcOf[key] || '').replace('img/', 'img/tiles/');

  const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  document.querySelectorAll('.sp-grid').forEach(grid => {
    const kind = grid.dataset.kind, list = PROJECTS[kind] || [];
    grid.innerHTML = list.map((p, i) => `
      <button class="tile" type="button" data-i="${i}" aria-haspopup="dialog">
        <span class="ph"><img src="${tileOf(p.thumb || p.img)}" alt="" loading="lazy" decoding="async"${p.thumbPos ? ` style="object-position:${p.thumbPos}"` : ''}></span>
        <span class="cap"><b>${esc(p.title)}</b><span class="mono">${esc(p.year)}</span></span>
      </button>`).join('');
  });

  function detailHTML(kind, i){
    const list = PROJECTS[kind], p = list[i];
    const rows = [['Software', p.software], ['Jaar', p.year], ['Uitleg', p.text]];
    const chips = v => `<div class="toolkit">${String(v).split(',').map(x => x.trim()).filter(Boolean).map(x => `<span class="tool">${esc(x)}</span>`).join('')}</div>`;
    const ar = v => { const [w,h] = String(v || '4:3').split(':').map(Number); return { css:`${w} / ${h}`, n:(w/h).toFixed(4) }; };
    const shape = rr => { const n = +ar(rr).n; return n > 1.05 ? 'land' : n < 0.95 ? 'port' : 'square'; };
    const gallery = (p.gallery || []).map(row => `
        <div class="g-row${row.length === 1 ? ' single' : ''}">${row.map(g => { const a = ar(g.ratio); return `
          <figure class="g-item" style="--ar:${a.css};--arn:${a.n}">
            <div class="g-img">${g.video
              ? `<video src="${g.video}" poster="${srcOf[g.img] || ''}" controls playsinline preload="metadata"></video>`
              : `<img src="${row.length > 1 ? tileOf(g.img) : srcOf[g.img] || ''}" alt="${esc(g.caption)}" loading="lazy" decoding="async">`}</div>
            <figcaption class="mono">${esc(g.caption)}</figcaption>
          </figure>`; }).join('')}
        </div>`).join('');
    const la = ar(p.ratio);
    return `<div class="d-story">
      <div class="d-main" data-shape="${shape(p.ratio)}">
        <div class="d-lead${p.videoSrc ? ' has-video' : ''}" style="--ar:${la.css};--arn:${la.n}">${p.videoSrc
          ? `<video src="${p.videoSrc}" poster="${srcOf[p.img] || ''}" controls playsinline preload="metadata"></video>`
          : `<img src="${srcOf[p.img] || ''}" alt="${esc(p.title)}">`}<button class="fs-btn" type="button" data-enlarge aria-pressed="false" aria-label="Beeld groter maken" title="Groter"><svg class="i-grow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/></svg><svg class="i-shrink" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4"/></svg></button></div>
        <div class="d-head">
          <h2>${esc(p.title)}</h2>
          <dl class="facts">${rows.map(([k,v]) => `<dt class="mono">${k}</dt><dd>${k === 'Software' ? chips(v) : esc(v)}</dd>`).join('')}</dl>
        </div>
      </div>
      ${gallery ? `<div class="d-gallery">${gallery}</div>` : ''}
    </div>
    <div class="d-nav">
      ${i > 0 ? '<button class="back mono" type="button" data-step="-1">← Volgende</button>' : ''}
      ${i < list.length - 1 ? '<button class="back mono" type="button" data-step="1">Vorige →</button>' : ''}
      <button class="back mono" type="button" data-close>Sluiten ✕</button>
    </div>`;
  }

  /* ---------- project window (modal) ---------- */
  const modal = document.createElement('div');
  modal.className = 'modal'; modal.hidden = true;
  modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true');
  modal.innerHTML = '<div class="m-backdrop" data-close></div><div class="m-panel" tabindex="-1"></div>';
  document.body.appendChild(modal);
  const panel = modal.querySelector('.m-panel');
  let mGrid = null, mI = 0, lastTile = null, closeTimer = 0;

  function openDetail(grid, i){
    const kind = grid.dataset.kind, list = PROJECTS[kind];
    if (i < 0 || i >= list.length) return;
    mGrid = grid; mI = i; modal.dataset.kind = kind;
    panel.innerHTML = detailHTML(kind, i);
    modal.setAttribute('aria-label', list[i].title);
    if (modal.hidden || !modal.classList.contains('open')){
      clearTimeout(closeTimer);
      lastTile = grid.querySelector(`.tile[data-i="${i}"]`);
      const se = document.scrollingElement || document.documentElement;
      // page shown at full height inside a frame: place the window next to the clicked tile instead of mid-page
      const fullHeight = se.scrollHeight <= innerHeight + 2;
      modal.classList.toggle('abs', fullHeight);
      if (fullHeight && lastTile) modal.style.top = Math.max(0, lastTile.getBoundingClientRect().top + scrollY - 40) + 'px';
      else modal.style.top = '';
      modal.hidden = false;
      root.classList.add('modal-lock');
      void modal.offsetHeight;
      modal.classList.add('open');
      panel.scrollTop = 0;
      panel.focus({ preventScroll:true });
      if (fullHeight) panel.scrollIntoView({ block:'nearest' });
    } else {
      panel.scrollTop = 0;
    }
  }
  function closeDetail(){
    if (modal.hidden) return;
    modal.classList.remove('open');
    root.classList.remove('modal-lock');
    closeTimer = setTimeout(() => { modal.hidden = true; panel.innerHTML = ''; }, 380);
    if (lastTile) lastTile.focus({ preventScroll:true });
  }
  modal.addEventListener('click', e => {
    const big = e.target.closest('[data-enlarge]');
    if (big) {
      const main = big.closest('.d-main');
      const on = !main.classList.contains('wide');
      main.classList.toggle('wide', on);
      big.setAttribute('aria-pressed', on);
      big.setAttribute('aria-label', on ? 'Beeld kleiner maken' : 'Beeld groter maken');
      big.title = on ? 'Kleiner' : 'Groter';
      return;
    }
    if (e.target.closest('[data-close]')) { closeDetail(); return; }
    const step = e.target.closest('[data-step]');
    if (step && mGrid) openDetail(mGrid, mI + (+step.dataset.step));
  });
  document.querySelectorAll('.sp-grid').forEach(grid => {
    grid.addEventListener('click', e => {
      const tile = e.target.closest('.tile');
      if (tile) openDetail(grid, +tile.dataset.i);
    });
  });
  addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeDetail();
    // the list runs newest → oldest: ← 'Volgende' goes to the newer project, 'Vorige' → to the older one
    if (e.key === 'ArrowLeft' && mGrid) openDetail(mGrid, mI - 1);
    if (e.key === 'ArrowRight' && mGrid) openDetail(mGrid, mI + 1);
  });

  const toTop = () => {
    try { window.scrollTo(0, 0); } catch(e) {}
    const nav = document.querySelector('.nav');
    if (nav && nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block:'start' });
  };
  /* smooth scroll for menu and hero buttons (plays regardless of the reduce-motion setting) */
  const easeIO = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  let scrollRun = 0;
  function smoothTo(el){
    const se = document.scrollingElement || document.documentElement;
    const navH = document.querySelector('.nav')?.getBoundingClientRect().height || 0;
    // page shown at full height inside a frame: let the outer scroller do it
    // Werk: stop with the three blocks centred in the screen (below the menu bar)
    const center = el.id === 'werk';
    const focus = center ? (el.querySelector('.cats') || el) : el;
    if (se.scrollHeight <= innerHeight + 2){ try { focus.scrollIntoView({ behavior:'smooth', block: center ? 'center' : 'start' }); } catch(e){ focus.scrollIntoView(); } return; }
    const from = se.scrollTop;
    const r = focus.getBoundingClientRect();
    let target = r.top + from - navH;
    if (center) target -= Math.max(0, (innerHeight - navH - r.height) / 2);
    const to = el.id === 'top' ? 0 : Math.max(0, Math.min(target, se.scrollHeight - innerHeight));
    const dist = to - from;
    if (Math.abs(dist) < 2) return;
    const dur = Math.min(1300, Math.max(650, Math.abs(dist) * 0.5));
    const t0 = performance.now(), id = ++scrollRun;
    const step = now => {
      if (id !== scrollRun) return;
      const t = Math.min(1, (now - t0) / dur);
      se.scrollTop = from + dist * easeIO(t);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  ['wheel','touchstart'].forEach(ev => addEventListener(ev, () => { scrollRun++; }, { passive:true }));

  let current = 'home';
  function show(name, scrollTarget){
    const page = subpages.find(p => p.dataset.page === name);
    const next = page ? name : 'home';
    if (next !== current){
      if (!modal.hidden){ modal.classList.remove('open'); modal.hidden = true; panel.innerHTML = ''; root.classList.remove('modal-lock'); }
      home.hidden = next !== 'home';
      subpages.forEach(p => p.hidden = p !== page);
      current = next;
      document.title = page ? page.querySelector('h1').textContent + ' · Thieben Wynants' : 'Thieben Wynants Portfolio';
    }
    if (scrollTarget){ toTop(); requestAnimationFrame(() => smoothTo(scrollTarget)); }
    else toTop();
    try { const h = next === 'home' ? '' : next; if (location.hash.slice(1) !== h) history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch(e) {}
  }
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go){ e.preventDefault(); show(go.dataset.go); return; }
    const a = e.target.closest('a[href^="#"]');
    if (a){
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el && home.contains(el)){
        e.preventDefault();
        if (current !== 'home') show('home', id === 'top' ? null : el);
        else smoothTo(el);
      }
    }
  });
  /* ---------- reveal on scroll ---------- */
  const REVEAL = [
    ['.hero-text > *', .14],
    ['.cats-sec .sec-head h2', 0], ['.cats .cat', .12],
    ['#over h2', 0], ['#over .about-text p', .1], ['#over .portrait', 0], ['#over .facts > *', .05],
    ['#contact h2', 0], ['#contact .facts > *', .05], ['#contact .copyright', .3],
    ['.sp-head > *', .08], ['.sp-grid .tile', .08], ['.sp-next', 0],
  ];
  if ('IntersectionObserver' in window){
    root.classList.add('rv');
    const cleanup = el => { el.removeAttribute('data-reveal'); el.classList.remove('in'); el.style.removeProperty('--d'); };
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; io.unobserve(el);
      el.classList.add('in');
      const d = parseFloat(el.style.getPropertyValue('--d')) || 0;
      setTimeout(() => cleanup(el), (d + 1) * 1000);
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    REVEAL.forEach(([sel, step]) => {
      const perParent = new Map();
      document.querySelectorAll(sel).forEach(el => {
        if (el.hasAttribute('data-reveal')) return;
        const n = perParent.get(el.parentNode) || 0;
        perParent.set(el.parentNode, n + 1);
        const cols = el.classList.contains('tile') ? 3 : 99;
        el.setAttribute('data-reveal', '');
        el.style.setProperty('--d', ((n % cols) * step).toFixed(2) + 's');
        io.observe(el);
      });
    });
  }

  const initial = location.hash.slice(1);
  if (subpages.some(p => p.dataset.page === initial)) show(initial);
})();
