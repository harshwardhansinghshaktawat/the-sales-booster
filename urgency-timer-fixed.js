class UrgencyTimerElement extends HTMLElement {
    constructor() {
        super();
        this.products         = [];
        this.currentIndex     = 0;
        this.rotationInterval = null;
        this.timerIntervals   = new Map();
        this.settings = {
            color1: '#ff4757', color2: '#ffffff', color3: '#0a0a0a',
            color4: '#ffa502', color5: '#ff6348', color6: '#ff3838',
            color7: '#1e90ff', color8: '#1a1a1a',
            borderWidth: 0, cornerRadius: 0,
            mainText:    '🔥 HOT DEAL ENDING SOON',
            urgencyText: 'Limited Time Offer',
            ctaText:     'Claim This Deal',
            timerDuration:     24,
            autoRotate:        true,
            rotationSpeed:     8,
            titleFontFamily:   'Archivo Black',
            titleFontSize:     20,
            urgencyFontFamily: 'Poppins',
            urgencyFontSize:   13,
            priceFontFamily:   'Montserrat',
            priceFontSize:     28,
            timerFontFamily:   'Orbitron',
            timerFontSize:     24,
            ctaFontFamily:     'Poppins',
            ctaFontSize:       15,
            titleTag:          'H2'
        };
        this.isRendered          = false;
        this.pendingProductsData = null;
    }

    connectedCallback() {
        this.render();
        this.isRendered = true;
        if (this.pendingProductsData) {
            this.products            = this.pendingProductsData || [];
            this.pendingProductsData = null;
            this.renderProducts();
        }
    }

    static get observedAttributes() { return ['products-data', 'settings']; }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || newValue === oldValue) return;
        if (name === 'products-data') {
            try {
                const data = JSON.parse(newValue);
                if (!this.isRendered) { this.pendingProductsData = data; return; }
                this.products = data || []; this.currentIndex = 0;
                this.renderProducts();
            } catch(e) { console.error('products-data', e); }
        } else if (name === 'settings') {
            try {
                const s = JSON.parse(newValue);
                const oldAR = this.settings.autoRotate;
                const oldRS = this.settings.rotationSpeed;
                Object.assign(this.settings, s);
                if (this.isRendered) {
                    this.updateStyles();
                    this.syncTexts();
                    if (oldAR !== this.settings.autoRotate || oldRS !== this.settings.rotationSpeed)
                        this.setupRotation();
                }
            } catch(e) { console.error('settings', e); }
        }
    }

    disconnectedCallback() {
        if (this.rotationInterval) clearInterval(this.rotationInterval);
        this.timerIntervals.forEach(iv => clearInterval(iv));
        this.timerIntervals.clear();
    }

    calcDiscount(price, compare) {
        if (!compare || compare === price) return null;
        const p = parseFloat(price.replace(/[^0-9.]/g,'')),
              c = parseFloat(compare.replace(/[^0-9.]/g,''));
        if (isNaN(p)||isNaN(c)||c<=p) return null;
        const d = Math.round(((c-p)/c)*100);
        return d > 0 ? d : null;
    }

    // ── SHELL — rendered once ─────────────────────────────────────────────────
    render() {
        this.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Poppins:wght@400;600;700;800&family=Montserrat:wght@700;800;900&family=Orbitron:wght@600;700;900&family=Bebas+Neue&family=Righteous&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:host{display:block;width:100%;}

/* ── KEYFRAMES ─────────────────────────────────────────────────────────── */
@keyframes hdr-scroll {
  0%  {background-position:0% 50%;}
  100%{background-position:300% 50%;}
}
@keyframes digit-tick {
  0%,100%{transform:translateY(0);    opacity:1;}
  45%    {transform:translateY(-4px); opacity:.7;}
  55%    {transform:translateY(4px);  opacity:.7;}
}
@keyframes colon-blink {
  0%,49%  {opacity:1;}
  50%,100%{opacity:0;}
}
@keyframes badge-spin {
  0%,100%{transform:scale(1)   rotate(-8deg);}
  50%    {transform:scale(1.1) rotate(-8deg);}
}
@keyframes cta-sheen {
  0%  {background-position:-200% center;}
  100%{background-position: 200% center;}
}
@keyframes card-in {
  from{opacity:0;transform:translateY(16px);}
  to  {opacity:1;transform:translateY(0);}
}

/* ── ROOT WRAP ─────────────────────────────────────────────────────────── */
.aut-root {
    width:100%;
    --c1:var(--color1,#ff4757);
    --c2:var(--color2,#ffffff);
    --c3:var(--color3,#0a0a0a);
    --c4:var(--color4,#ffa502);
    --c5:var(--color5,#ff6348);
    --c6:var(--color6,#ff3838);
    --c7:var(--color7,#1e90ff);
    --c8:var(--color8,#1a1a1a);
    font-family:'Poppins',sans-serif;
}

/* ── GRID STACK (same layout pattern as limited-stock widget) ───────────── */
.aut-carousel {
    display:grid;
    grid-template-columns:1fr;
    grid-template-rows:1fr;
    width:100%;
    overflow:hidden;
}

/* ── CARD ──────────────────────────────────────────────────────────────── */
.aut-card {
    grid-column:1; grid-row:1;
    width:100%; min-width:0;
    background:var(--c3);
    border-radius:var(--radius,0px);
    overflow:hidden;
    border:var(--card-border,none);
    visibility:hidden; opacity:0;
    transition:opacity .35s ease, visibility .35s ease;
    pointer-events:none;
    box-shadow:0 24px 80px rgba(0,0,0,.6);
}
.aut-card.active{
    visibility:visible; opacity:1; pointer-events:auto;
    animation:card-in .4s ease both;
}

/* ── SCROLLING MARQUEE HEADER ──────────────────────────────────────────── */
.aut-hdr {
    background:linear-gradient(90deg,var(--c1),var(--c6),var(--c5),var(--c1));
    background-size:300% 100%;
    animation:hdr-scroll 3s linear infinite;
    padding:11px 20px;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
    position:relative;
}
.aut-hdr-text {
    font-family:var(--uf,'Poppins');
    font-size:var(--us,13px);
    font-weight:800;
    color:var(--c2);
    text-transform:uppercase;
    letter-spacing:3px;
    text-shadow:0 1px 6px rgba(0,0,0,.3);
    text-align:center;
    position:relative;
    z-index:1;
}

/* ── FULL-BLEED IMAGE + VEIL ────────────────────────────────────────────── */
.aut-img-wrap {
    position:relative;
    width:100%;
    height:320px;
    overflow:hidden;
    flex-shrink:0;
}
.aut-img {
    display:block;
    width:100%; height:100%;
    object-fit:cover;
    object-position:center;
    transition:transform .6s ease;
}
.aut-card.active:hover .aut-img{transform:scale(1.05);}

/* dark gradient veil bleeding from bottom into content */
.aut-img-wrap::after {
    content:'';
    position:absolute;
    bottom:0;left:0;right:0;
    height:60%;
    background:linear-gradient(to bottom,transparent 0%,var(--c3) 100%);
    pointer-events:none;
}

/* discount badge: isolated circle in top-right */
.aut-badge {
    position:absolute;
    top:16px; right:16px;
    z-index:10;
    width:72px; height:72px;
    border-radius:50%;
    background:linear-gradient(135deg,var(--c4) 0%,var(--c5) 100%);
    border:3px solid rgba(255,255,255,.9);
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    color:var(--c2);
    box-shadow:0 8px 24px rgba(0,0,0,.5);
    animation:badge-spin 2.5s ease-in-out infinite;
}
.aut-badge-pct{
    font-family:var(--tf,'Orbitron');
    font-size:21px; font-weight:900; line-height:1;
}
.aut-badge-off{
    font-family:var(--uf,'Poppins');
    font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase;
}

/* ── CONTENT SECTION ────────────────────────────────────────────────────── */
.aut-body {
    padding:20px 24px 0;
    position:relative; z-index:2;
}

/* urgency chip — sits above the title */
.aut-chip {
    display:inline-flex;
    align-items:center;
    gap:7px;
    padding:4px 12px 4px 8px;
    border-radius:100px;
    border:1px solid var(--c1);
    background:rgba(255,255,255,.04);
    margin-bottom:10px;
}
.aut-chip-dot {
    width:6px; height:6px;
    border-radius:50%;
    background:var(--c1);
    box-shadow:0 0 8px var(--c1);
    animation:colon-blink 1.2s ease-in-out infinite;
    flex-shrink:0;
}
.aut-chip-text {
    font-family:var(--uf,'Poppins');
    font-size:calc(var(--us,13px) - 1px);
    font-weight:700;
    color:var(--c1);
    text-transform:uppercase;
    letter-spacing:1.5px;
}

/* product title */
.aut-title {
    font-family:var(--ttf,'Archivo Black');
    font-size:var(--ts,20px);
    font-weight:900;
    color:var(--c2);
    text-transform:uppercase;
    letter-spacing:.4px;
    line-height:1.15;
    display:-webkit-box;
    -webkit-line-clamp:2;
    -webkit-box-orient:vertical;
    overflow:hidden;
    margin-bottom:14px;
}

/* price row */
.aut-prices {
    display:flex;
    align-items:baseline;
    gap:10px;
    flex-wrap:wrap;
    padding:14px 0;
    border-top:1px solid rgba(255,255,255,.08);
    border-bottom:1px solid rgba(255,255,255,.08);
    margin-bottom:0;
}
.aut-price {
    font-family:var(--pf,'Montserrat');
    font-size:var(--ps,28px);
    font-weight:900;
    color:var(--c4);
    /* warm glow effect */
    text-shadow:0 0 20px color-mix(in srgb,var(--c4) 50%,transparent);
}
.aut-compare {
    font-family:var(--pf,'Montserrat');
    font-size:calc(var(--ps,28px) * .52);
    color:rgba(255,255,255,.35);
    text-decoration:line-through;
}

/* ── COUNTDOWN SECTION ──────────────────────────────────────────────────── */
.aut-countdown {
    padding:18px 24px 0;
}

/* "expires in" label */
.aut-exp-label {
    display:flex;
    align-items:center;
    gap:8px;
    font-family:var(--uf,'Poppins');
    font-size:10px;
    font-weight:700;
    color:rgba(255,255,255,.4);
    text-transform:uppercase;
    letter-spacing:2.5px;
    margin-bottom:14px;
}
.aut-exp-label::after {
    content:'';
    flex:1;
    height:1px;
    background:linear-gradient(to right,rgba(255,255,255,.15),transparent);
}

/* digit row — three blocks */
.aut-digits {
    display:grid;
    grid-template-columns:1fr 24px 1fr 24px 1fr;
    align-items:center;
    gap:0;
    margin-bottom:20px;
}
.aut-dblock {
    display:flex;
    flex-direction:column;
    align-items:center;
    /* each block: subtle panel */
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.09);
    border-radius:8px;
    padding:16px 8px 12px;
    position:relative;
    overflow:hidden;
}
/* accent bar top of each digit block in color1 */
.aut-dblock::before {
    content:'';
    position:absolute;
    top:0;left:0;right:0;height:3px;
    background:linear-gradient(to right,var(--c1),var(--c6));
}
.aut-dval {
    font-family:var(--tf,'Orbitron');
    font-size:var(--tfs,24px);
    font-weight:900;
    color:var(--c2);
    line-height:1;
    letter-spacing:2px;
    animation:digit-tick 1s ease-in-out infinite;
}
.aut-dlbl {
    font-family:var(--uf,'Poppins');
    font-size:9px;
    font-weight:600;
    color:rgba(255,255,255,.4);
    text-transform:uppercase;
    letter-spacing:1.5px;
    margin-top:6px;
}
/* separator colons */
.aut-colon {
    font-family:var(--tf,'Orbitron');
    font-size:calc(var(--tfs,24px) * .85);
    font-weight:900;
    color:var(--c4);
    text-align:center;
    animation:colon-blink 1s step-end infinite;
    margin-bottom:14px; /* optical align */
    user-select:none;
}

/* ── CTA ─────────────────────────────────────────────────────────────────── */
.aut-cta {
    display:block;
    width:100%;
    padding:18px 24px;
    background:linear-gradient(110deg,var(--c1) 0%,var(--c6) 100%);
    /* sheen overlay via pseudo */
    background-image:
        linear-gradient(110deg, transparent 40%, rgba(255,255,255,.15) 50%, transparent 60%),
        linear-gradient(110deg, var(--c1) 0%, var(--c6) 100%);
    background-size:300% 100%, 100% 100%;
    background-position:-200% center, 0 0;
    animation:cta-sheen 3s linear infinite;
    color:var(--c2);
    font-family:var(--cf,'Poppins');
    font-size:var(--cfs,15px);
    font-weight:800;
    text-transform:uppercase;
    letter-spacing:3px;
    border:none;
    cursor:pointer;
    text-decoration:none;
    text-align:center;
    transition:filter .2s ease, transform .2s ease;
    border-radius:0 0 var(--radius,0px) var(--radius,0px);
    margin-top:0;
}
.aut-cta:hover{filter:brightness(1.18); transform:translateY(-2px);}

/* ── NAV ─────────────────────────────────────────────────────────────────── */
.aut-nav {
    display:flex;
    justify-content:center;
    align-items:center;
    gap:16px;
    padding:14px 0 2px;
}
.aut-arr {
    width:34px; height:34px;
    border-radius:50%;
    border:1px solid rgba(255,255,255,.2);
    background:rgba(255,255,255,.05);
    color:var(--c2);
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;
    font-size:18px;font-weight:700;
    transition:border-color .2s,background .2s,transform .2s;
    flex-shrink:0; user-select:none;
}
.aut-arr:hover{border-color:var(--c1);background:var(--c1);transform:scale(1.1);}
.aut-dots{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;}
.aut-dot {
    width:7px;height:7px;border-radius:50%;
    background:rgba(255,255,255,.2);
    cursor:pointer;
    transition:background .25s,transform .25s;
    flex-shrink:0;
}
.aut-dot:hover{background:rgba(255,255,255,.5);transform:scale(1.2);}
.aut-dot.active{background:var(--c1);transform:scale(1.4);box-shadow:0 0 8px var(--c1);}

/* ── EMPTY STATE ─────────────────────────────────────────────────────────── */
.aut-empty{
    text-align:center;padding:80px 24px;
    color:rgba(255,255,255,.3);
    font-family:'Poppins',sans-serif;font-size:16px;
}
.aut-empty::before{content:'⏰';display:block;font-size:60px;margin-bottom:16px;opacity:.5;}

/* ── RESPONSIVE ──────────────────────────────────────────────────────────── */
@media(max-width:768px){
    .aut-img-wrap{height:260px;}
    .aut-body{padding:16px 18px 0;}
    .aut-countdown{padding:16px 18px 0;}
    .aut-dval{letter-spacing:1px;}
}
@media(max-width:480px){
    .aut-img-wrap{height:220px;}
    .aut-body{padding:14px 14px 0;}
    .aut-countdown{padding:14px 14px 0;}
    .aut-dblock{padding:12px 6px 8px;}
    .aut-arr{width:30px;height:30px;font-size:16px;}
    .aut-badge{width:58px;height:58px;}
    .aut-badge-pct{font-size:18px;}
}
</style>

<div class="aut-root">
    <div class="aut-carousel"></div>
    <div class="aut-nav" style="display:none;">
        <div class="aut-arr aut-prev">&#8249;</div>
        <div class="aut-dots"></div>
        <div class="aut-arr aut-next">&#8250;</div>
    </div>
</div>`;
    }

    // ── sync texts on settings change (no re-render needed) ───────────────────
    syncTexts() {
        this.querySelectorAll('.aut-hdr-text').forEach(el => {
            el.textContent = this.settings.mainText || '🔥 HOT DEAL ENDING SOON';
        });
        this.querySelectorAll('.aut-chip-text').forEach(el => {
            el.textContent = this.settings.urgencyText || 'Limited Time Offer';
        });
        this.querySelectorAll('.aut-cta').forEach(el => {
            el.textContent = this.settings.ctaText || 'Claim This Deal';
        });
    }

    renderProducts() {
        const carousel = this.querySelector('.aut-carousel');
        const nav      = this.querySelector('.aut-nav');
        if (!carousel) return;

        if (this.products.length === 0) {
            carousel.innerHTML = '<div class="aut-empty">No products selected</div>';
            if (nav) nav.style.display = 'none';
            return;
        }

        // render ALL cards into the grid at once
        carousel.innerHTML = this.products.map(p => this.buildCard(p)).join('');

        if (nav) nav.style.display = this.products.length > 1 ? 'flex' : 'none';

        this.showCard(this.currentIndex);
        this.renderDots();
        this.setupNavigation();
        this.setupRotation();
        this.updateStyles();

        if (this.products[this.currentIndex]) {
            this.startCountdown(this.products[this.currentIndex].id);
        }
    }

    showCard(index) {
        this.querySelectorAll('.aut-card').forEach((c, i) =>
            c.classList.toggle('active', i === index));
        this.currentIndex = index;
    }

    buildCard(product) {
        const hasCompare  = product.compareAtPrice && product.compareAtPrice !== product.price;
        const price       = product.price || 'Price N/A';
        const discount    = hasCompare ? this.calcDiscount(product.price, product.compareAtPrice) : null;
        const tag         = this.settings.titleTag || 'H2';
        const pid         = product.id;

        return `
<div class="aut-card">

  <div class="aut-hdr">
    <span class="aut-hdr-text">${this.settings.mainText}</span>
  </div>

  <div class="aut-img-wrap">
    ${discount ? `
    <div class="aut-badge">
      <div class="aut-badge-pct">${discount}%</div>
      <div class="aut-badge-off">OFF</div>
    </div>` : ''}
    <img src="${product.imageUrl}"
         alt="${product.name}"
         class="aut-img"
         onerror="this.src='https://via.placeholder.com/600x320'">
  </div>

  <div class="aut-body">
    <div class="aut-chip">
      <span class="aut-chip-dot"></span>
      <span class="aut-chip-text">${this.settings.urgencyText}</span>
    </div>
    <${tag} class="aut-title">${product.name}</${tag}>
    <div class="aut-prices">
      <span class="aut-price">${price}</span>
      ${hasCompare ? `<span class="aut-compare">${product.compareAtPrice}</span>` : ''}
    </div>
  </div>

  <div class="aut-countdown">
    <div class="aut-exp-label">Offer expires in</div>
    <div class="aut-digits">
      <div class="aut-dblock">
        <div class="aut-dval" data-unit="hours"   data-product="${pid}">00</div>
        <div class="aut-dlbl">Hours</div>
      </div>
      <div class="aut-colon">:</div>
      <div class="aut-dblock">
        <div class="aut-dval" data-unit="minutes" data-product="${pid}">00</div>
        <div class="aut-dlbl">Mins</div>
      </div>
      <div class="aut-colon">:</div>
      <div class="aut-dblock">
        <div class="aut-dval" data-unit="seconds" data-product="${pid}">00</div>
        <div class="aut-dlbl">Secs</div>
      </div>
    </div>
    <a href="${product.productUrl}" class="aut-cta">${this.settings.ctaText}</a>
  </div>

</div>`;
    }

    renderDots() {
        const dc = this.querySelector('.aut-dots');
        if (!dc || this.products.length <= 1) { if (dc) dc.innerHTML=''; return; }
        dc.innerHTML = this.products.map((_,i) =>
            `<div class="aut-dot ${i===this.currentIndex?'active':''}" data-index="${i}"></div>`
        ).join('');
        dc.querySelectorAll('.aut-dot').forEach(d => {
            d.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index);
                this.showCard(idx); this.updateDots();
                this.startCountdown(this.products[idx].id); this.setupRotation();
            });
        });
    }

    updateDots() {
        this.querySelectorAll('.aut-dot').forEach((d,i) =>
            d.classList.toggle('active', i===this.currentIndex));
    }

    setupNavigation() {
        const prev = this.querySelector('.aut-prev');
        const next = this.querySelector('.aut-next');
        if (prev) prev.onclick = () => {
            const idx = (this.currentIndex - 1 + this.products.length) % this.products.length;
            this.showCard(idx); this.updateDots();
            this.startCountdown(this.products[idx].id); this.setupRotation();
        };
        if (next) next.onclick = () => {
            const idx = (this.currentIndex + 1) % this.products.length;
            this.showCard(idx); this.updateDots();
            this.startCountdown(this.products[idx].id); this.setupRotation();
        };
    }

    setupRotation() {
        if (this.rotationInterval) clearInterval(this.rotationInterval);
        if (!this.settings.autoRotate || this.products.length <= 1) return;
        const speed = (this.settings.rotationSpeed || 8) * 1000;
        this.rotationInterval = setInterval(() => {
            const idx = (this.currentIndex + 1) % this.products.length;
            this.showCard(idx); this.updateDots();
            this.startCountdown(this.products[idx].id);
        }, speed);
    }

    startCountdown(productId) {
        if (this.timerIntervals.has(productId))
            clearInterval(this.timerIntervals.get(productId));

        const endTime = new Date();
        endTime.setHours(endTime.getHours() + (Number(this.settings.timerDuration) || 24));

        const tick = () => {
            const dist = endTime.getTime() - Date.now();
            const h = this.querySelector(`[data-unit="hours"][data-product="${productId}"]`);
            const m = this.querySelector(`[data-unit="minutes"][data-product="${productId}"]`);
            const s = this.querySelector(`[data-unit="seconds"][data-product="${productId}"]`);
            if (dist < 0) {
                clearInterval(this.timerIntervals.get(productId));
                this.timerIntervals.delete(productId);
                [h,m,s].forEach(el => { if(el) el.textContent='00'; });
                return;
            }
            if (h) h.textContent = String(Math.floor(dist/3600000)).padStart(2,'0');
            if (m) m.textContent = String(Math.floor((dist%3600000)/60000)).padStart(2,'0');
            if (s) s.textContent = String(Math.floor((dist%60000)/1000)).padStart(2,'0');
        };
        tick();
        this.timerIntervals.set(productId, setInterval(tick, 1000));
    }

    updateStyles() {
        const root = this.querySelector('.aut-root');
        if (!root) return;
        const vars = {
            '--color1': this.settings.color1, '--color2': this.settings.color2,
            '--color3': this.settings.color3, '--color4': this.settings.color4,
            '--color5': this.settings.color5, '--color6': this.settings.color6,
            '--color7': this.settings.color7, '--color8': this.settings.color8,
            '--ttf': this.settings.titleFontFamily,
            '--uf':  this.settings.urgencyFontFamily,
            '--pf':  this.settings.priceFontFamily,
            '--tf':  this.settings.timerFontFamily,
            '--cf':  this.settings.ctaFontFamily,
            '--ts':  `${this.settings.titleFontSize}px`,
            '--us':  `${this.settings.urgencyFontSize}px`,
            '--ps':  `${this.settings.priceFontSize}px`,
            '--tfs': `${this.settings.timerFontSize}px`,
            '--cfs': `${this.settings.ctaFontSize}px`,
            '--radius': `${this.settings.cornerRadius}px`,
            '--card-border': this.settings.borderWidth > 0
                ? `${this.settings.borderWidth}px solid ${this.settings.color1}` : 'none',
        };
        Object.entries(vars).forEach(([k,v]) => root.style.setProperty(k,v));
    }
}

customElements.define('urgency-timer', UrgencyTimerElement);
