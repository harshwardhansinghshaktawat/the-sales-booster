class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;

        this.productSelections = {};
        this.productOptionsData = {};
        this.requestedVariants = {};

        this.settings = {
            cardBgColor: '#ffffff', cardHoverBgColor: '#f8f9fa',
            headingColor: '#1a1a1a', textColor: '#666666', fontFamily: 'Arial',
            headingSize: 18, textSize: 14,
            priceColor: '#2c3e50', comparePriceColor: '#999999', priceSize: 24,
            primaryAccent: '#3498db', secondaryAccent: '#2ecc71',
            ribbonBgColor: '#e74c3c', ribbonTextColor: '#ffffff',
            borderColor: '#e0e0e0', borderWidth: 1, cornerRadius: 12,
            cardPadding: 20, cardGap: 24,
            buttonText: 'View Product', buttonBgColor: '#3498db',
            buttonTextColor: '#ffffff', buttonHoverBgColor: '#2980b9',
            buttonStyle: 'filled', buttonSize: 'medium',
            cartButtonText: 'Add to Cart', cartButtonBgColor: '#2ecc71',
            cartButtonTextColor: '#ffffff', cartButtonHoverBgColor: '#27ae60',
            imageHeight: 280, imageZoom: true, imageBorderRadius: 8,
            cardShadow: 'medium', hoverEffect: 'lift',
            columnsDesktop: 3, columnsTablet: 2, columnsMobile: 1,
            loadMoreText: 'Load More Products',
            loadMoreBgColor: '#ffffff', loadMoreTextColor: '#3498db',
            loadMoreBorderColor: '#3498db'
        };

        this.isRendered = false;
        this.pendingProductsData = null;
    }

    connectedCallback() {
        this.render();
        this.isRendered = true;
        this.addEventListener('click', this.handleClick.bind(this));
        this.addEventListener('change', this.handleChange.bind(this));

        if (this.pendingProductsData) {
            this.products = this.pendingProductsData.products || [];
            this.hasMore = this.pendingProductsData.hasMore || false;
            this.pendingProductsData = null;
            this.renderProducts();
        }
    }

    static get observedAttributes() {
        return ['products-data', 'settings', 'variant-data', 'cart-status'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || newValue === oldValue) return;
        try {
            if (name === 'products-data') {
                const data = JSON.parse(newValue);
                if (!this.isRendered) { this.pendingProductsData = data; return; }
                this.products = data.products || [];
                this.hasMore = data.hasMore || false;
                this.renderProducts();
            } else if (name === 'settings') {
                Object.assign(this.settings, JSON.parse(newValue));
                if (this.isRendered) this.updateStyles();
            } else if (name === 'variant-data') {
                this.handleVariantData(JSON.parse(newValue));
            } else if (name === 'cart-status') {
                this.handleCartStatus(JSON.parse(newValue));
            }
        } catch (e) {}
    }

    // ====================== VARIANT HANDLING ======================
    handleVariantData(data) {
        const pid = data.productId;
        if (!pid) return;
        this.productOptionsData[pid] = {
            hasOptions: data.hasOptions,
            options: data.options || [],
            variants: data.variants || [],
            manageVariants: data.manageVariants || false
        };
        this.renderProductOptions(pid);
    }

    renderProductOptions(productId) {
        const card = this.querySelector(`[data-product-card="${productId}"]`);
        if (!card) return;
        const container = card.querySelector('.product-options');
        if (!container) return;

        const data = this.productOptionsData[productId];
        if (!data || !data.hasOptions || !data.options.length) {
            container.innerHTML = '';
            this.updateCartButton(productId);
            return;
        }

        let html = '';
        for (let opt of data.options) {
            html += opt.type === 'color' 
                ? this.renderColorOption(productId, opt) 
                : this.renderDropdownOption(productId, opt);
        }
        container.innerHTML = html;
        this.updateCartButton(productId);
    }

    renderColorOption(productId, option) {
        const selections = this.productSelections[productId] || {};
        const selected = selections[option.name] || null;
        let sw = '';
        for (let c of option.choices) {
            const active = selected === c.value ? ' active' : '';
            const oos = !c.inStock ? ' out-of-stock' : '';
            sw += `<button class="option-swatch${active}${oos}" 
                data-product-id="${productId}" 
                data-option-name="${this.escapeAttr(option.name)}" 
                data-option-value="${this.escapeAttr(c.value)}"
                title="${this.escapeAttr(c.description || c.value)}">
                <span class="swatch-inner" style="background-color:${c.color || '#ccc'}"></span>
            </button>`;
        }
        const label = selected ? `: ${selected}` : '';
        return `<div class="option-group">
            <span class="option-label">${this.escapeHtml(option.name)}<span class="selected-value">${label}</span></span>
            <div class="option-swatches">${sw}</div>
        </div>`;
    }

    renderDropdownOption(productId, option) {
        const selections = this.productSelections[productId] || {};
        const selected = selections[option.name] || '';
        let opts = `<option value="">Select ${this.escapeHtml(option.name)}</option>`;
        for (let c of option.choices) {
            const sel = selected === c.value ? ' selected' : '';
            const stock = !c.inStock ? ' (Out of Stock)' : '';
            opts += `<option value="${this.escapeAttr(c.value)}"${sel}>${this.escapeHtml(c.description || c.value)}${stock}</option>`;
        }
        return `<div class="option-group">
            <span class="option-label">${this.escapeHtml(option.name)}</span>
            <select class="option-dropdown" data-product-id="${productId}" data-option-name="${this.escapeAttr(option.name)}">${opts}</select>
        </div>`;
    }

    // ====================== EVENTS (unchanged) ======================
    handleClick(e) {
        const swatch = e.target.closest('.option-swatch');
        if (swatch) { this.handleSwatchClick(swatch); return; }
        const cartBtn = e.target.closest('.add-to-cart-button');
        if (cartBtn) { this.handleAddToCartClick(cartBtn); return; }
        const loadBtn = e.target.closest('.load-more-button');
        if (loadBtn) this.dispatchEvent(new CustomEvent('load-more', {bubbles:true, composed:true}));
    }

    handleChange(e) {
        const dd = e.target.closest('.option-dropdown');
        if (dd) this.handleDropdownChange(dd);
    }

    handleSwatchClick(swatch) {
        const pid = swatch.dataset.productId;
        const name = swatch.dataset.optionName;
        const val = swatch.dataset.optionValue;
        if (!this.productSelections[pid]) this.productSelections[pid] = {};
        if (this.productSelections[pid][name] === val) delete this.productSelections[pid][name];
        else this.productSelections[pid][name] = val;
        this.updateProductCardState(pid);
    }

    handleDropdownChange(dd) {
        const pid = dd.dataset.productId;
        const name = dd.dataset.optionName;
        const val = dd.value;
        if (!this.productSelections[pid]) this.productSelections[pid] = {};
        if (val === '') delete this.productSelections[pid][name];
        else this.productSelections[pid][name] = val;
        this.updateProductCardState(pid);
    }

    handleAddToCartClick(btn) {
        if (btn.classList.contains('disabled') || btn.classList.contains('loading')) return;
        const pid = btn.dataset.productId;
        const product = this.findProduct(pid);
        if (!product) return;

        const data = this.productOptionsData[pid];
        const sel = this.productSelections[pid] || {};
        let variantId = null, choices = {}, manage = false;

        if (data && data.hasOptions && data.variants.length) {
            manage = data.manageVariants;
            choices = {...sel};
            const match = this.findMatchingVariant(pid);
            if (match) variantId = match.id;
        }

        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true, composed: true,
            detail: { productId: pid, variantId, quantity: 1, selectedChoices: choices, manageVariants: manage }
        }));
    }

    // ====================== MATCHING & STATE ======================
    findMatchingVariant(pid) {
        const data = this.productOptionsData[pid];
        if (!data || !data.variants.length) return null;
        const sel = this.productSelections[pid] || {};
        const names = data.options.map(o => o.name);
        if (!names.every(n => sel[n] !== undefined)) return null;
        return data.variants.find(v => names.every(n => v.choices[n] === sel[n])) || null;
    }

    allOptionsSelected(pid) {
        const data = this.productOptionsData[pid];
        if (!data || !data.options.length) return true;
        const sel = this.productSelections[pid] || {};
        return data.options.every(o => sel[o.name] !== undefined);
    }

    updateProductCardState(pid) { /* your original full code */ 
        const card = this.querySelector(`[data-product-card="${pid}"]`);
        if (!card) return;
        const sel = this.productSelections[pid] || {};

        // swatches
        card.querySelectorAll('.option-swatch').forEach(s => {
            s.classList.toggle('active', sel[s.dataset.optionName] === s.dataset.optionValue);
        });

        // labels
        card.querySelectorAll('.option-label').forEach(l => {
            const sv = l.querySelector('.selected-value');
            if (sv) {
                const name = l.textContent.replace(sv.textContent,'').trim();
                sv.textContent = sel[name] ? `: ${sel[name]}` : '';
            }
        });

        // dropdowns
        card.querySelectorAll('.option-dropdown').forEach(d => {
            if (sel[d.dataset.optionName]) d.value = sel[d.dataset.optionName];
        });

        const match = this.findMatchingVariant(pid);
        const prod = this.findProduct(pid);
        const priceEl = card.querySelector('.product-price');
        const compEl = card.querySelector('.product-compare-price');
        const imgEl = card.querySelector('.product-image');

        if (match) {
            if (priceEl && match.price) priceEl.textContent = match.price;
            if (compEl) {
                compEl.textContent = match.compareAtPrice || '';
                compEl.style.display = match.compareAtPrice ? 'inline-block' : 'none';
            }
            if (imgEl && match.image) imgEl.src = match.image;
        } else if (prod) {
            if (priceEl) priceEl.textContent = prod.price;
            if (compEl) {
                compEl.textContent = prod.compareAtPrice || '';
                compEl.style.display = prod.compareAtPrice ? 'inline-block' : 'none';
            }
        }
        this.updateCartButton(pid);
    }

    updateCartButton(pid) { /* your original */ 
        const card = this.querySelector(`[data-product-card="${pid}"]`);
        if (!card) return;
        const btn = card.querySelector('.add-to-cart-button');
        if (!btn) return;
        btn.classList.remove('disabled','loading','success','error');

        const data = this.productOptionsData[pid];
        if (!data || !data.hasOptions || !data.options.length) {
            btn.textContent = this.settings.cartButtonText;
            return;
        }
        if (!this.allOptionsSelected(pid)) {
            btn.classList.add('disabled');
            btn.textContent = 'Select Options';
            return;
        }
        const match = this.findMatchingVariant(pid);
        if (!match) { btn.classList.add('disabled'); btn.textContent = 'Unavailable'; return; }
        if (!match.inStock) { btn.classList.add('disabled'); btn.textContent = 'Out of Stock'; return; }
        btn.textContent = this.settings.cartButtonText;
    }

    handleCartStatus(status) { /* your original */ 
        const card = this.querySelector(`[data-product-card="${status.productId}"]`);
        if (!card) return;
        const btn = card.querySelector('.add-to-cart-button');
        if (!btn) return;
        btn.classList.remove('loading','success','error');
        if (status.status === 'loading') { btn.classList.add('loading'); btn.textContent = 'Adding...'; }
        else if (status.status === 'success') { btn.classList.add('success'); btn.textContent = 'Added ✓'; }
        else if (status.status === 'error') { btn.classList.add('error'); btn.textContent = status.message || 'Error'; }
        else this.updateCartButton(status.productId);
    }

    findProduct(pid) {
        return this.products.find(p => p.id === pid) || null;
    }

    escapeHtml(t) { if(!t) return ''; const d=document.createElement('div'); d.textContent=t; return d.innerHTML; }
    escapeAttr(t) { if(!t) return ''; return t.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // ====================== STYLES ======================
    getShadowCSS() { return {none:'none',small:'0 1px 3px rgba(0,0,0,0.08)',medium:'0 4px 12px rgba(0,0,0,0.12)',large:'0 8px 24px rgba(0,0,0,0.16)'}[this.settings.cardShadow] || '0 4px 12px rgba(0,0,0,0.12)'; }
    getHoverEffectCSS() { return {lift:'transform:translateY(-8px);box-shadow:0 12px 28px rgba(0,0,0,0.18);',glow:`box-shadow:0 0 20px ${this.settings.primaryAccent}66;`,zoom:'transform:scale(1.02);',none:''}[this.settings.hoverEffect] || 'transform:translateY(-8px);box-shadow:0 12px 28px rgba(0,0,0,0.18);'; }
    getButtonCSS() {
        const sizes = {small:'padding:10px 20px;font-size:12px;',medium:'padding:14px 28px;font-size:14px;',large:'padding:18px 36px;font-size:16px;'};
        const styles = {filled:'background:var(--button-bg);color:var(--button-text);border:none;',outlined:'background:transparent;color:var(--button-bg);border:2px solid var(--button-bg);',text:'background:transparent;color:var(--button-bg);border:none;'};
        return sizes[this.settings.buttonSize] + styles[this.settings.buttonStyle];
    }

    render() {
        this.innerHTML = `<style>
* { box-sizing: border-box; }
:host { display: block; width: 100%; }

.gallery-container { padding: 20px; max-width: 1400px; margin: 0 auto; font-family: var(--font-family); }
.products-grid { display: grid; grid-template-columns: repeat(var(--columns-desktop), 1fr); gap: var(--card-gap); margin-bottom: 40px; }
.product-card { background: var(--card-bg); overflow: hidden; box-shadow: var(--card-shadow); transition: all 0.3s cubic-bezier(0.4,0,0.2,1); position: relative; display: flex; flex-direction: column; height: 100%; border: var(--border-width) solid var(--border-color); border-radius: var(--corner-radius); }
.product-card:hover { background: var(--card-hover-bg); ${this.getHoverEffectCSS()} }
.product-image-container { position: relative; width: 100%; height: var(--image-height); overflow: hidden; background: #f5f5f5; flex-shrink: 0; border-radius: var(--image-border-radius); }
.product-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s cubic-bezier(0.4,0,0.2,1); }
.product-card:hover .product-image { transform: ${this.settings.imageZoom ? 'scale(1.1)' : 'scale(1)'}; }
.product-ribbon { position: absolute; top: 12px; left: 0; background: var(--ribbon-bg); color: var(--ribbon-text); padding: 6px 16px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 2px 2px 8px rgba(0,0,0,0.2); z-index: 10; border-radius: 0 4px 4px 0; }
.product-content { padding: var(--card-padding); flex: 1; display: flex; flex-direction: column; }
.product-name { font-size: var(--heading-size); font-weight: 700; margin: 0 0 12px 0; line-height: 1.3; color: var(--heading-color); height: calc(var(--heading-size) * 2.6); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.product-description { font-size: var(--text-size); line-height: 1.6; color: var(--text-color); margin: 0 0 16px 0; height: calc(var(--text-size) * 3.2); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.product-price-section { margin: auto 0 0 0; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.product-price { font-size: var(--price-size); font-weight: 800; color: var(--price-color); }
.product-compare-price { font-size: calc(var(--price-size)*0.65); color: var(--compare-price-color); text-decoration: line-through; }

.product-options { margin-bottom: 16px; min-height: 40px; }
.option-group { margin-bottom: 12px; }
.option-label { display: block; font-size: 12px; font-weight: 600; color: var(--heading-color); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.option-label .selected-value { font-weight: 400; color: var(--text-color); text-transform: none; }
.option-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.option-swatch { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid #e0e0e0; padding: 0; background: none; transition: all 0.2s; }
.option-swatch .swatch-inner { width: 100%; height: 100%; border-radius: 50%; display: block; border: 2px solid transparent; }
.option-swatch:hover { border-color: var(--primary-accent); transform: scale(1.1); }
.option-swatch.active { border-color: var(--primary-accent); box-shadow: 0 0 0 2px var(--primary-accent); }
.option-swatch.out-of-stock { opacity: 0.4; cursor: not-allowed; }
.option-swatch.out-of-stock::after { content:""; position:absolute; top:50%; left:-2px; right:-2px; height:2px; background:#cc0000; transform:rotate(-45deg); }
.option-dropdown { width: 100%; padding: 10px 14px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 14px; background: #fff; cursor: pointer; }
.option-dropdown:focus { border-color: var(--primary-accent); }

.product-buttons { display: flex; flex-direction: column; gap: 8px; }
.product-button, .add-to-cart-button { width: 100%; border-radius: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.3s; text-align: center; }
.product-button { ${this.getButtonCSS()} }
.add-to-cart-button { padding: 14px 28px; border: none; background: var(--cart-button-bg); color: var(--cart-button-text); font-family: var(--font-family); }
.add-to-cart-button:hover:not(.disabled):not(.loading) { background: var(--cart-button-hover-bg); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
.add-to-cart-button.disabled { opacity: 0.5; cursor: not-allowed; }
.add-to-cart-button.loading { opacity: 0.7; cursor: wait; }
.add-to-cart-button.success { background: #27ae60; }
.add-to-cart-button.error { background: #e74c3c; }

.load-more-container { text-align: center; padding: 30px 0; }
.load-more-button { padding: 16px 48px; border: 3px solid var(--load-more-border); background: var(--load-more-bg); color: var(--load-more-text); border-radius: 50px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s; text-transform: uppercase; }
.load-more-button:hover { background: var(--load-more-text); color: var(--load-more-bg); transform: translateY(-3px); }

.empty-state { text-align: center; padding: 80px 20px; color: var(--text-color); font-size: 18px; }

@media (max-width: 1024px) { .products-grid { grid-template-columns: repeat(var(--columns-tablet), 1fr); } }
@media (max-width: 768px) { 
    .products-grid { grid-template-columns: repeat(var(--columns-mobile), 1fr); }
    .option-swatch { width: 28px; height: 28px; }
}
</style>

<div class="gallery-container">
    <div class="products-grid"></div>
    <div class="load-more-container"></div>
</div>`;
    }

    // ====================== RENDER PRODUCTS ======================
    renderProducts() {
        const grid = this.querySelector('.products-grid');
        const load = this.querySelector('.load-more-container');
        if (!grid) return;

        if (!this.products.length) {
            grid.innerHTML = '<div class="empty-state">No products found. Please select a category.</div>';
            load.innerHTML = '';
            return;
        }

        grid.innerHTML = this.products.map(p => this.renderProductCard(p)).join('');
        
        load.innerHTML = this.hasMore 
            ? `<button class="load-more-button">${this.settings.loadMoreText}</button>` 
            : '';

        this.updateStyles();

        // Request variants
        this.products.forEach(p => {
            if (p.hasOptions && !this.requestedVariants[p.id]) {
                this.requestedVariants[p.id] = true;
                this.dispatchEvent(new CustomEvent('request-variants', {bubbles:true, composed:true, detail:{productId: p.id}}));
            } else if (this.productOptionsData[p.id]) {
                this.renderProductOptions(p.id);
            }
        });
    }

    renderProductCard(product) {
        const hasCompare = product.compareAtPrice && product.compareAtPrice !== product.price;
        const btnText = product.hasOptions ? 'Loading options...' : this.settings.cartButtonText;
        let btnClass = 'add-to-cart-button';
        if (product.hasOptions) btnClass += ' disabled';

        return `<div class="product-card" data-product-card="${product.id}">
            ${product.ribbon ? `<div class="product-ribbon">${this.escapeHtml(product.ribbon)}</div>` : ''}
            <div class="product-image-container">
                <img src="${product.imageUrl}" alt="${this.escapeAttr(product.name)}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400'">
            </div>
            <div class="product-content">
                <h3 class="product-name">${this.escapeHtml(product.name)}</h3>
                <p class="product-description">${this.escapeHtml(product.description || '')}</p>
                <div class="product-price-section">
                    <span class="product-price">${product.price}</span>
                    ${hasCompare ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : '<span class="product-compare-price" style="display:none;"></span>'}
                </div>
                <div class="product-options">${product.hasOptions ? '<div style="color:#888;font-size:13px;">Loading options...</div>' : ''}</div>
                <div class="product-buttons">
                    <button class="${btnClass}" data-product-id="${product.id}">${btnText}</button>
                    <a href="${product.productUrl}" class="product-button">${this.settings.buttonText}</a>
                </div>
            </div>
        </div>`;
    }

    updateStyles() {
        const cont = this.querySelector('.gallery-container');
        if (!cont) return;
        const s = this.settings;
        const props = {
            '--card-bg': s.cardBgColor, '--card-hover-bg': s.cardHoverBgColor,
            '--heading-color': s.headingColor, '--text-color': s.textColor,
            '--font-family': s.fontFamily,
            '--heading-size': s.headingSize + 'px', '--text-size': s.textSize + 'px',
            '--price-color': s.priceColor, '--compare-price-color': s.comparePriceColor,
            '--price-size': s.priceSize + 'px',
            '--border-color': s.borderColor, '--border-width': s.borderWidth + 'px',
            '--corner-radius': s.cornerRadius + 'px',
            '--card-padding': s.cardPadding + 'px', '--card-gap': s.cardGap + 'px',
            '--button-bg': s.buttonBgColor, '--button-text': s.buttonTextColor,
            '--button-hover-bg': s.buttonHoverBgColor,
            '--image-height': s.imageHeight + 'px', '--image-border-radius': s.imageBorderRadius + 'px',
            '--card-shadow': this.getShadowCSS(),
            '--columns-desktop': s.columnsDesktop,
            '--columns-tablet': s.columnsTablet,
            '--columns-mobile': s.columnsMobile,
            '--ribbon-bg': s.ribbonBgColor, '--ribbon-text': s.ribbonTextColor,
            '--load-more-bg': s.loadMoreBgColor, '--load-more-text': s.loadMoreTextColor,
            '--load-more-border': s.loadMoreBorderColor,
            '--primary-accent': s.primaryAccent,
            '--cart-button-bg': s.cartButtonBgColor,
            '--cart-button-text': s.cartButtonTextColor,
            '--cart-button-hover-bg': s.cartButtonHoverBgColor
        };
        for (let key in props) cont.style.setProperty(key, props[key]);
    }
}

customElements.define('product-gallery', ProductGalleryElement);
