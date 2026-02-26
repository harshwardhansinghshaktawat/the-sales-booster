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

    // ====================== VARIANT DATA ======================
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
        if (!data || !data.hasOptions || !data.options || data.options.length === 0) {
            container.innerHTML = '';
            this.updateCartButton(productId);
            return;
        }

        let html = '';
        for (let option of data.options) {
            html += option.type === 'color' 
                ? this.renderColorOption(productId, option) 
                : this.renderDropdownOption(productId, option);
        }
        container.innerHTML = html;
        this.updateCartButton(productId);
    }

    renderColorOption(productId, option) {
        const selections = this.productSelections[productId] || {};
        const selectedValue = selections[option.name] || null;
        let swatchesHTML = '';
        for (let choice of option.choices) {
            const isActive = selectedValue === choice.value ? ' active' : '';
            const isOOS = !choice.inStock ? ' out-of-stock' : '';
            const title = this.escapeAttr(choice.description || choice.value);
            const color = choice.color || '#ccc';
            swatchesHTML += `<button class="option-swatch${isActive}${isOOS}" data-product-id="${productId}" data-option-name="${this.escapeAttr(option.name)}" data-option-value="${this.escapeAttr(choice.value)}" title="${title}"><span class="swatch-inner" style="background-color: ${color};"></span></button>`;
        }
        const selectedLabel = selectedValue ? `: ${selectedValue}` : '';
        return `<div class="option-group"><span class="option-label">${this.escapeHtml(option.name)}<span class="selected-value">${selectedLabel}</span></span><div class="option-swatches">${swatchesHTML}</div></div>`;
    }

    renderDropdownOption(productId, option) {
        const selections = this.productSelections[productId] || {};
        const selectedValue = selections[option.name] || '';
        let optionsHTML = `<option value="">Select ${this.escapeHtml(option.name)}</option>`;
        for (let choice of option.choices) {
            const label = this.escapeHtml(choice.description || choice.value);
            const stockLabel = !choice.inStock ? ' (Out of Stock)' : '';
            const isSelected = selectedValue === choice.value ? ' selected' : '';
            optionsHTML += `<option value="${this.escapeAttr(choice.value)}"${isSelected}>${label}${stockLabel}</option>`;
        }
        return `<div class="option-group"><span class="option-label">${this.escapeHtml(option.name)}</span><select class="option-dropdown" data-product-id="${productId}" data-option-name="${this.escapeAttr(option.name)}">${optionsHTML}</select></div>`;
    }

    // ====================== EVENTS (same as your original) ======================
    handleClick(e) {
        if (e.target.closest('.option-swatch')) { this.handleSwatchClick(e.target.closest('.option-swatch')); return; }
        if (e.target.closest('.add-to-cart-button')) { this.handleAddToCartClick(e.target.closest('.add-to-cart-button')); return; }
        if (e.target.closest('.load-more-button')) this.dispatchEvent(new CustomEvent('load-more', {bubbles: true, composed: true}));
    }

    handleChange(e) {
        const dropdown = e.target.closest('.option-dropdown');
        if (dropdown) this.handleDropdownChange(dropdown);
    }

    handleSwatchClick(swatch) { /* your original */ 
        const productId = swatch.dataset.productId;
        const optionName = swatch.dataset.optionName;
        const optionValue = swatch.dataset.optionValue;
        if (!this.productSelections[productId]) this.productSelections[productId] = {};
        if (this.productSelections[productId][optionName] === optionValue) delete this.productSelections[productId][optionName];
        else this.productSelections[productId][optionName] = optionValue;
        this.updateProductCardState(productId);
    }

    handleDropdownChange(dropdown) { /* your original */ 
        const productId = dropdown.dataset.productId;
        const optionName = dropdown.dataset.optionName;
        const optionValue = dropdown.value;
        if (!this.productSelections[productId]) this.productSelections[productId] = {};
        if (optionValue === '') delete this.productSelections[productId][optionName];
        else this.productSelections[productId][optionName] = optionValue;
        this.updateProductCardState(productId);
    }

    handleAddToCartClick(button) { /* your original */ 
        if (button.classList.contains('disabled') || button.classList.contains('loading')) return;
        const productId = button.dataset.productId;
        const product = this.findProduct(productId);
        if (!product) return;
        const optionsData = this.productOptionsData[productId];
        const selections = this.productSelections[productId] || {};
        let variantId = null, selectedChoices = {}, manageVariants = false;
        if (optionsData && optionsData.hasOptions && optionsData.variants && optionsData.variants.length > 0) {
            manageVariants = optionsData.manageVariants;
            selectedChoices = {...selections};
            const matchedVariant = this.findMatchingVariant(productId);
            if (matchedVariant) variantId = matchedVariant.id;
        }
        this.dispatchEvent(new CustomEvent('add-to-cart', {bubbles: true, composed: true, detail: {productId, variantId, quantity: 1, selectedChoices, manageVariants}}));
    }

    // ====================== MATCHING & UPDATE (your original) ======================
    findMatchingVariant(productId) { /* your original code */ 
        const optionsData = this.productOptionsData[productId];
        if (!optionsData || !optionsData.variants || optionsData.variants.length === 0) return null;
        const selections = this.productSelections[productId] || {};
        const optionNames = optionsData.options.map(o => o.name);
        const allSelected = optionNames.every(name => selections[name] !== undefined);
        if (!allSelected) return null;
        return optionsData.variants.find(variant => optionNames.every(name => variant.choices[name] === selections[name])) || null;
    }

    allOptionsSelected(productId) { /* your original */ 
        const optionsData = this.productOptionsData[productId];
        if (!optionsData || !optionsData.options) return true;
        const selections = this.productSelections[productId] || {};
        return optionsData.options.every(o => selections[o.name] !== undefined);
    }

    updateProductCardState(productId) { /* your original full code */ 
        const card = this.querySelector(`[data-product-card="${productId}"]`);
        if (!card) return;
        const selections = this.productSelections[productId] || {};
        // swatches
        card.querySelectorAll('.option-swatch').forEach(s => {
            s.classList.toggle('active', selections[s.dataset.optionName] === s.dataset.optionValue);
        });
        // labels
        card.querySelectorAll('.option-label').forEach(labelEl => {
            const selectedValueEl = labelEl.querySelector('.selected-value');
            if (selectedValueEl) {
                const optName = labelEl.textContent.replace(selectedValueEl.textContent, '').trim();
                selectedValueEl.textContent = selections[optName] ? `: ${selections[optName]}` : '';
            }
        });
        // dropdowns
        card.querySelectorAll('.option-dropdown').forEach(dd => {
            if (selections[dd.dataset.optionName]) dd.value = selections[dd.dataset.optionName];
        });
        // price / image / button
        const matchedVariant = this.findMatchingVariant(productId);
        const product = this.findProduct(productId);
        const priceEl = card.querySelector('.product-price');
        const comparePriceEl = card.querySelector('.product-compare-price');
        const imgEl = card.querySelector('.product-image');
        if (matchedVariant) {
            if (priceEl && matchedVariant.price) priceEl.textContent = matchedVariant.price;
            if (comparePriceEl) {
                comparePriceEl.textContent = matchedVariant.compareAtPrice || '';
                comparePriceEl.style.display = matchedVariant.compareAtPrice ? 'inline-block' : 'none';
            }
            if (imgEl && matchedVariant.image) imgEl.src = matchedVariant.image;
        } else if (product) {
            if (priceEl) priceEl.textContent = product.price;
            if (comparePriceEl) {
                comparePriceEl.textContent = product.compareAtPrice || '';
                comparePriceEl.style.display = product.compareAtPrice ? 'inline-block' : 'none';
            }
        }
        this.updateCartButton(productId);
    }

    updateCartButton(productId) { /* your original */ 
        const card = this.querySelector(`[data-product-card="${productId}"]`);
        if (!card) return;
        const cartBtn = card.querySelector('.add-to-cart-button');
        if (!cartBtn) return;
        cartBtn.classList.remove('disabled', 'loading', 'success', 'error');
        const optionsData = this.productOptionsData[productId];
        if (!optionsData || !optionsData.hasOptions || !optionsData.options || optionsData.options.length === 0) {
            cartBtn.textContent = this.settings.cartButtonText;
            return;
        }
        if (!this.allOptionsSelected(productId)) {
            cartBtn.classList.add('disabled');
            cartBtn.textContent = 'Select Options';
            return;
        }
        const matchedVariant = this.findMatchingVariant(productId);
        if (!matchedVariant) { cartBtn.classList.add('disabled'); cartBtn.textContent = 'Unavailable'; return; }
        if (!matchedVariant.inStock) { cartBtn.classList.add('disabled'); cartBtn.textContent = 'Out of Stock'; return; }
        cartBtn.textContent = this.settings.cartButtonText;
    }

    handleCartStatus(status) { /* your original */ 
        const card = this.querySelector(`[data-product-card="${status.productId}"]`);
        if (!card) return;
        const cartBtn = card.querySelector('.add-to-cart-button');
        if (!cartBtn) return;
        cartBtn.classList.remove('loading', 'success', 'error');
        if (status.status === 'loading') { cartBtn.classList.add('loading'); cartBtn.textContent = 'Adding...'; }
        else if (status.status === 'success') { cartBtn.classList.add('success'); cartBtn.textContent = 'Added ✓'; }
        else if (status.status === 'error') { cartBtn.classList.add('error'); cartBtn.textContent = status.message || 'Error'; }
        else this.updateCartButton(status.productId);
    }

    findProduct(productId) {
        return this.products.find(p => p.id === productId) || null;
    }

    escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }
    escapeAttr(text) { if (!text) return ''; return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    // ====================== CSS HELPERS ======================
    getShadowCSS() { return {none:'none',small:'0 1px 3px rgba(0,0,0,0.08)',medium:'0 4px 12px rgba(0,0,0,0.12)',large:'0 8px 24px rgba(0,0,0,0.16)'}[this.settings.cardShadow] || '0 4px 12px rgba(0,0,0,0.12)'; }
    getHoverEffectCSS() { return {lift:'transform:translateY(-8px);box-shadow:0 12px 28px rgba(0,0,0,0.18);',glow:`box-shadow:0 0 20px ${this.settings.primaryAccent}66;`,zoom:'transform:scale(1.02);',none:''}[this.settings.hoverEffect] || 'transform:translateY(-8px);box-shadow:0 12px 28px rgba(0,0,0,0.18);'; }
    getButtonCSS() {
        const sizes = {small:'padding:10px 20px;font-size:12px;',medium:'padding:14px 28px;font-size:14px;',large:'padding:18px 36px;font-size:16px;'};
        const styles = {filled:'background:var(--button-bg);color:var(--button-text);border:none;',outlined:'background:transparent;color:var(--button-bg);border:2px solid var(--button-bg);',text:'background:transparent;color:var(--button-bg);border:none;'};
        return sizes[this.settings.buttonSize] + styles[this.settings.buttonStyle];
    }

    // ====================== FULL RENDER WITH YOUR ORIGINAL CSS ======================
    render() {
        this.innerHTML = `<style>
* { box-sizing: border-box; }
:host { display: block; width: 100%; }

.gallery-container { padding: 20px; max-width: 1400px; margin: 0 auto; font-family: var(--font-family); }
.products-grid { display: grid; grid-template-columns: repeat(var(--columns-desktop), 1fr); gap: var(--card-gap); margin-bottom: 40px; }
.product-card { background: var(--card-bg); overflow: hidden; box-shadow: var(--card-shadow); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; display: flex; flex-direction: column; height: 100%; border: var(--border-width) solid var(--border-color); border-radius: var(--corner-radius); }
.product-card:hover { background: var(--card-hover-bg); ${this.getHoverEffectCSS()} }
.product-image-container { position: relative; width: 100%; height: var(--image-height); overflow: hidden; background: #f5f5f5; flex-shrink: 0; border-radius: var(--image-border-radius); }
.product-image { width: 100%; height: 100%; object-fit: cover; object-position: center; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.product-card:hover .product-image { transform: ${this.settings.imageZoom ? 'scale(1.1)' : 'scale(1)'}; }
.product-ribbon { position: absolute; top: 12px; left: 0; background: var(--ribbon-bg); color: var(--ribbon-text); padding: 6px 16px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 2px 2px 8px rgba(0,0,0,0.2); z-index: 10; border-radius: 0 4px 4px 0; }
.product-content { padding: var(--card-padding); flex: 1; display: flex; flex-direction: column; }
.product-name { font-size: var(--heading-size); font-weight: 700; margin: 0 0 12px 0; line-height: 1.3; color: var(--heading-color); height: calc(var(--heading-size) * 2.6); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.product-description { font-size: var(--text-size); line-height: 1.6; color: var(--text-color); margin: 0 0 16px 0; height: calc(var(--text-size) * 3.2); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.product-price-section { margin: auto 0 0 0; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.product-price { font-size: var(--price-size); font-weight: 800; color: var(--price-color); display: inline-block; transition: all 0.2s ease; }
.product-compare-price { font-size: calc(var(--price-size) * 0.65); color: var(--compare-price-color); text-decoration: line-through; display: inline-block; }

.product-options { margin-bottom: 16px; min-height: 0; }
.product-options-loading { padding: 10px 0; color: var(--text-color); font-size: 12px; }
.option-group { margin-bottom: 12px; }
.option-group:last-child { margin-bottom: 0; }
.option-label { display: block; font-size: 12px; font-weight: 600; color: var(--heading-color); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.option-label .selected-value { font-weight: 400; color: var(--text-color); text-transform: none; letter-spacing: 0; }
.option-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.option-swatch { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; border: 2px solid #e0e0e0; position: relative; transition: all 0.2s ease; padding: 0; outline: none; background: none; }
.option-swatch .swatch-inner { width: 100%; height: 100%; border-radius: 50%; display: block; border: 2px solid transparent; }
.option-swatch:hover { border-color: var(--primary-accent); transform: scale(1.1); }
.option-swatch.active { border-color: var(--primary-accent); box-shadow: 0 0 0 2px var(--primary-accent); }
.option-swatch.out-of-stock { opacity: 0.4; cursor: not-allowed; }
.option-swatch.out-of-stock::after { content: ""; position: absolute; top: 50%; left: -2px; right: -2px; height: 2px; background: #cc0000; transform: rotate(-45deg); }
.option-dropdown { width: 100%; padding: 10px 14px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 14px; font-family: var(--font-family); color: var(--heading-color); background: #fff; cursor: pointer; transition: border-color 0.2s ease; outline: none; appearance: auto; }
.option-dropdown:focus { border-color: var(--primary-accent); }

.product-buttons { display: flex; flex-direction: column; gap: 8px; }
.product-button { display: block; width: 100%; margin: 0; border-radius: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.3s ease; text-decoration: none; text-align: center; ${this.getButtonCSS()} }
.product-button:hover { background: var(--button-hover-bg); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
.add-to-cart-button { display: block; width: 100%; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.3s ease; text-align: center; border: none; background: var(--cart-button-bg); color: var(--cart-button-text); font-family: var(--font-family); }
.add-to-cart-button:hover:not(.disabled):not(.loading) { background: var(--cart-button-hover-bg); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
.add-to-cart-button.disabled { opacity: 0.5; cursor: not-allowed; }
.add-to-cart-button.loading { opacity: 0.7; cursor: wait; }
.add-to-cart-button.success { background: #27ae60; color: #fff; }
.add-to-cart-button.error { background: #e74c3c; color: #fff; }

.load-more-container { text-align: center; padding: 30px 0; }
.load-more-button { padding: 16px 48px; border: 3px solid var(--load-more-border); background: var(--load-more-bg); color: var(--load-more-text); border-radius: 50px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1.2px; font-family: var(--font-family); }
.load-more-button:hover { background: var(--load-more-text); color: var(--load-more-bg); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
.empty-state { text-align: center; padding: 80px 20px; color: var(--text-color); font-size: 18px; font-family: var(--font-family); }

@media (max-width: 1024px) { .products-grid { grid-template-columns: repeat(var(--columns-tablet), 1fr); } }
@media (max-width: 768px) { 
    .products-grid { grid-template-columns: repeat(var(--columns-mobile), 1fr); } 
    .product-name { font-size: calc(var(--heading-size) * 0.9); } 
    .product-description { font-size: calc(var(--text-size) * 0.9); } 
    .option-swatch { width: 28px; height: 28px; } 
}
</style>
<div class="gallery-container">
    <div class="products-grid"></div>
    <div class="load-more-container"></div>
</div>`;
    }

    renderProducts() { /* your original */ 
        const grid = this.querySelector('.products-grid');
        const loadMoreContainer = this.querySelector('.load-more-container');
        if (!grid || !loadMoreContainer) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No products found. Please select a category.</div>';
            loadMoreContainer.innerHTML = '';
            return;
        }

        let cardsHTML = '';
        for (let product of this.products) {
            cardsHTML += this.renderProductCard(product);
        }
        grid.innerHTML = cardsHTML;

        if (this.hasMore) {
            loadMoreContainer.innerHTML = `<button class="load-more-button">${this.settings.loadMoreText}</button>`;
        } else {
            loadMoreContainer.innerHTML = '';
        }

        this.updateStyles();

        this.products.forEach(product => {
            if (product.hasOptions && !this.requestedVariants[product.id]) {
                this.requestedVariants[product.id] = true;
                this.dispatchEvent(new CustomEvent('request-variants', {bubbles: true, composed: true, detail: {productId: product.id}}));
            } else if (this.productOptionsData[product.id]) {
                this.renderProductOptions(product.id);
            }
        });
    }

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        const cartButtonText = product.hasOptions ? 'Loading options...' : this.settings.cartButtonText;
        let cartButtonClass = 'add-to-cart-button';
        if (product.hasOptions) cartButtonClass += ' disabled';
        else if (!product.inStock) cartButtonClass += ' disabled';

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
                    ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : '<span class="product-compare-price" style="display:none;"></span>'}
                </div>
                <div class="product-options">${product.hasOptions ? '<div class="product-options-loading">Loading options...</div>' : ''}</div>
                <div class="product-buttons">
                    <button class="${cartButtonClass}" data-product-id="${product.id}">${cartButtonText}</button>
                    <a href="${product.productUrl}" class="product-button">${this.settings.buttonText}</a>
                </div>
            </div>
        </div>`;
    }

    updateStyles() { /* your original */ 
        const container = this.querySelector('.gallery-container');
        if (!container) return;
        const s = this.settings;
        const props = {
            '--card-bg': s.cardBgColor, '--card-hover-bg': s.cardHoverBgColor,
            '--heading-color': s.headingColor, '--text-color': s.textColor, '--font-family': s.fontFamily,
            '--heading-size': s.headingSize + 'px', '--text-size': s.textSize + 'px',
            '--price-color': s.priceColor, '--compare-price-color': s.comparePriceColor, '--price-size': s.priceSize + 'px',
            '--border-color': s.borderColor, '--border-width': s.borderWidth + 'px', '--corner-radius': s.cornerRadius + 'px',
            '--card-padding': s.cardPadding + 'px', '--card-gap': s.cardGap + 'px',
            '--button-bg': s.buttonBgColor, '--button-text': s.buttonTextColor, '--button-hover-bg': s.buttonHoverBgColor,
            '--image-height': s.imageHeight + 'px', '--image-border-radius': s.imageBorderRadius + 'px',
            '--card-shadow': this.getShadowCSS(),
            '--columns-desktop': s.columnsDesktop, '--columns-tablet': s.columnsTablet, '--columns-mobile': s.columnsMobile,
            '--ribbon-bg': s.ribbonBgColor, '--ribbon-text': s.ribbonTextColor,
            '--load-more-bg': s.loadMoreBgColor, '--load-more-text': s.loadMoreTextColor, '--load-more-border': s.loadMoreBorderColor,
            '--primary-accent': s.primaryAccent,
            '--cart-button-bg': s.cartButtonBgColor || '#2ecc71',
            '--cart-button-text': s.cartButtonTextColor || '#ffffff',
            '--cart-button-hover-bg': s.cartButtonHoverBgColor || '#27ae60'
        };
        for (let key in props) container.style.setProperty(key, props[key]);
    }
}

customElements.define('product-gallery', ProductGalleryElement);
