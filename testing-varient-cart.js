class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.settings = {
            cardBgColor: '#ffffff',
            cardHoverBgColor: '#f8f9fa',
            headingColor: '#1a1a1a',
            textColor: '#666666',
            fontFamily: 'Arial',
            headingSize: 18,
            textSize: 14,
            priceColor: '#2c3e50',
            comparePriceColor: '#999999',
            priceSize: 24,
            primaryAccent: '#3498db',
            secondaryAccent: '#2ecc71',
            ribbonBgColor: '#e74c3c',
            ribbonTextColor: '#ffffff',
            borderColor: '#e0e0e0',
            borderWidth: 1,
            cornerRadius: 12,
            cardPadding: 20,
            cardGap: 24,
            buttonText: 'View Product',
            buttonBgColor: '#3498db',
            buttonTextColor: '#ffffff',
            buttonHoverBgColor: '#2980b9',
            buttonStyle: 'filled',
            buttonSize: 'medium',
            imageHeight: 280,
            imageZoom: true,
            imageBorderRadius: 8,
            cardShadow: 'medium',
            hoverEffect: 'lift',
            columnsDesktop: 3,
            columnsTablet: 2,
            columnsMobile: 1,
            loadMoreText: 'Load More Products',
            loadMoreBgColor: '#ffffff',
            loadMoreTextColor: '#3498db',
            loadMoreBorderColor: '#3498db'
        };
        this.isRendered = false;
        this.pendingProductsData = null;
        this.variantData = {};
        this.selectedChoices = {};
        this.activeModalProductId = null;
    }

    connectedCallback() {
        this.render();
        this.isRendered = true;
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
        if (newValue && newValue !== oldValue) {
            if (name === 'products-data') {
                try {
                    const data = JSON.parse(newValue);
                    if (!this.isRendered) {
                        this.pendingProductsData = data;
                        return;
                    }
                    this.products = data.products || [];
                    this.hasMore = data.hasMore || false;
                    this.renderProducts();
                } catch (e) {}
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    if (this.isRendered) this.updateStyles();
                } catch (e) {}
            } else if (name === 'variant-data') {
                try {
                    const data = JSON.parse(newValue);
                    this.handleVariantData(data);
                } catch (e) {}
            } else if (name === 'cart-status') {
                try {
                    const data = JSON.parse(newValue);
                    this.handleCartStatus(data);
                } catch (e) {}
            }
        }
    }

    handleVariantData(data) {
        const productId = data.productId;
        if (!productId) return;
        this.variantData[productId] = data;
        this.selectedChoices[productId] = {};
        if (!data.hasOptions || data.options.length === 0) {
            this.dispatchEvent(new CustomEvent('add-to-cart', {
                bubbles: true, composed: true,
                detail: { productId: productId, variantId: null, quantity: 1, selectedChoices: null }
            }));
            return;
        }
        this.activeModalProductId = productId;
        this.showVariantModal(productId);
    }

    handleCartStatus(data) {
        const productId = data.productId;
        const btn = this.querySelector(`[data-cart-btn="${productId}"]`);
        if (data.status === 'loading') {
            if (btn) { btn.textContent = 'Adding...'; btn.disabled = true; }
        } else if (data.status === 'success') {
            if (btn) { btn.textContent = 'Added ✓'; btn.disabled = false; }
            this.closeVariantModal();
            setTimeout(() => { if (btn) btn.textContent = 'Add to Cart'; }, 2000);
        } else if (data.status === 'error') {
            if (btn) { btn.textContent = 'Add to Cart'; btn.disabled = false; }
            const modal = this.querySelector('.variant-modal');
            if (modal) {
                const errEl = modal.querySelector('.modal-error');
                if (errEl) errEl.textContent = data.message || 'Error adding to cart';
            }
        }
    }

    showVariantModal(productId) {
        this.closeVariantModal();
        const data = this.variantData[productId];
        if (!data) return;
        const product = this.products.find(p => p.id === productId);

        const overlay = document.createElement('div');
        overlay.className = 'variant-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeVariantModal();
        });

        let optionsHtml = '';
        data.options.forEach(opt => {
            if (opt.type === 'color') {
                const swatches = opt.choices.map(c =>
                    `<div class="color-swatch" data-option-id="${opt.id}" data-choice-id="${c.id}" data-choice-value="${c.value}" title="${c.description}" style="background:${c.color || c.value};"></div>`
                ).join('');
                optionsHtml += `<div class="option-group"><label class="option-label">${opt.name}</label><div class="color-swatches">${swatches}</div></div>`;
            } else {
                const items = opt.choices.map(c =>
                    `<div class="choice-btn" data-option-id="${opt.id}" data-choice-id="${c.id}" data-choice-value="${c.value}">${c.description || c.value}</div>`
                ).join('');
                optionsHtml += `<div class="option-group"><label class="option-label">${opt.name}</label><div class="choice-buttons">${items}</div></div>`;
            }
        });

        overlay.innerHTML = `
            <div class="variant-modal">
                <button class="modal-close">&times;</button>
                <div class="modal-product-info">
                    ${product ? `<img src="${product.imageUrl}" class="modal-product-img" alt="${product.name}">` : ''}
                    <div>
                        <div class="modal-product-name">${product ? product.name : ''}</div>
                        <div class="modal-product-price">${product ? product.price : ''}</div>
                    </div>
                </div>
                <div class="modal-options">${optionsHtml}</div>
                <div class="modal-error"></div>
                <div class="modal-actions">
                    <div class="quantity-selector">
                        <button class="qty-btn qty-minus">-</button>
                        <span class="qty-value">1</span>
                        <button class="qty-btn qty-plus">+</button>
                    </div>
                    <button class="modal-add-btn" disabled>Select Options</button>
                </div>
            </div>
        `;

        this.appendChild(overlay);
        this.setupModalEvents(overlay, productId, data);
    }

    setupModalEvents(overlay, productId, data) {
        let quantity = 1;
        const qtyValue = overlay.querySelector('.qty-value');
        const addBtn = overlay.querySelector('.modal-add-btn');
        const closeBtn = overlay.querySelector('.modal-close');

        closeBtn.addEventListener('click', () => this.closeVariantModal());

        overlay.querySelector('.qty-minus').addEventListener('click', () => {
            if (quantity > 1) { quantity--; qtyValue.textContent = quantity; }
        });
        overlay.querySelector('.qty-plus').addEventListener('click', () => {
            if (quantity < 99) { quantity++; qtyValue.textContent = quantity; }
        });

        overlay.querySelectorAll('.color-swatch, .choice-btn').forEach(el => {
            el.addEventListener('click', () => {
                const optId = el.dataset.optionId;
                const choiceId = el.dataset.choiceId;
                const choiceValue = el.dataset.choiceValue;
                this.selectedChoices[productId] = this.selectedChoices[productId] || {};
                this.selectedChoices[productId][optId] = { id: choiceId, value: choiceValue };

                el.parentElement.querySelectorAll('.color-swatch, .choice-btn').forEach(s => s.classList.remove('selected'));
                el.classList.add('selected');

                const allSelected = data.options.every(opt => this.selectedChoices[productId][opt.id]);
                if (allSelected) {
                    addBtn.disabled = false;
                    addBtn.textContent = 'Add to Cart';
                    const matchedVariant = this.findMatchingVariant(productId, data);
                    if (matchedVariant && matchedVariant.price) {
                        const priceEl = overlay.querySelector('.modal-product-price');
                        if (priceEl) priceEl.textContent = matchedVariant.price;
                    }
                }
                overlay.querySelector('.modal-error').textContent = '';
            });
        });

        addBtn.addEventListener('click', () => {
            if (addBtn.disabled) return;
            const matchedVariant = this.findMatchingVariant(productId, data);
            const choicesObj = {};
            Object.keys(this.selectedChoices[productId] || {}).forEach(optId => {
                const opt = data.options.find(o => o.id === optId);
                if (opt) choicesObj[opt.name || optId] = this.selectedChoices[productId][optId].value;
            });

            this.dispatchEvent(new CustomEvent('add-to-cart', {
                bubbles: true, composed: true,
                detail: {
                    productId: productId,
                    variantId: matchedVariant ? matchedVariant.id : null,
                    quantity: quantity,
                    selectedChoices: choicesObj
                }
            }));
        });
    }

    findMatchingVariant(productId, data) {
        const selected = this.selectedChoices[productId] || {};
        return data.variants.find(v => {
            return data.options.every(opt => {
                const sel = selected[opt.id];
                if (!sel) return false;
                return v.choices[opt.id] === sel.id || v.choices[opt.id] === sel.value;
            });
        });
    }

    closeVariantModal() {
        const overlay = this.querySelector('.variant-overlay');
        if (overlay) overlay.remove();
        this.activeModalProductId = null;
    }

    getShadowCSS() {
        const shadows = {
            none: 'none',
            small: '0 1px 3px rgba(0, 0, 0, 0.08)',
            medium: '0 4px 12px rgba(0, 0, 0, 0.12)',
            large: '0 8px 24px rgba(0, 0, 0, 0.16)'
        };
        return shadows[this.settings.cardShadow] || shadows.medium;
    }

    getHoverEffectCSS() {
        const effects = {
            lift: 'transform: translateY(-8px); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);',
            glow: `box-shadow: 0 0 20px ${this.settings.primaryAccent}66;`,
            zoom: 'transform: scale(1.02);',
            none: ''
        };
        return effects[this.settings.hoverEffect] || effects.lift;
    }

    getButtonCSS() {
        const sizes = {
            small: 'padding: 10px 20px; font-size: 12px;',
            medium: 'padding: 14px 28px; font-size: 14px;',
            large: 'padding: 18px 36px; font-size: 16px;'
        };
        const styles = {
            filled: `background: var(--button-bg); color: var(--button-text); border: none;`,
            outlined: `background: transparent; color: var(--button-bg); border: 2px solid var(--button-bg);`,
            text: `background: transparent; color: var(--button-bg); border: none;`
        };
        return sizes[this.settings.buttonSize] + styles[this.settings.buttonStyle];
    }

    render() {
        this.innerHTML = `
            <style>
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
                .product-price-section { margin: auto 0 16px 0; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px; }
                .product-price { font-size: var(--price-size); font-weight: 800; color: var(--price-color); display: inline-block; }
                .product-compare-price { font-size: calc(var(--price-size) * 0.65); color: var(--compare-price-color); text-decoration: line-through; display: inline-block; }
                .card-buttons { display: flex; gap: 8px; }
                .card-buttons a, .card-buttons button { flex: 1; display: block; margin: 0; border-radius: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.3s ease; text-decoration: none; text-align: center; ${this.getButtonCSS()} font-family: var(--font-family); }
                .card-buttons a:hover, .card-buttons button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
                .btn-view-product { background: var(--button-bg) !important; color: var(--button-text) !important; border: none !important; }
                .btn-view-product:hover { background: var(--button-hover-bg) !important; }
                .btn-add-cart { background: var(--primary-accent) !important; color: #fff !important; border: none !important; }
                .btn-add-cart:hover { opacity: 0.9; }
                .load-more-container { text-align: center; padding: 30px 0; }
                .load-more-button { padding: 16px 48px; border: 3px solid var(--load-more-border); background: var(--load-more-bg); color: var(--load-more-text); border-radius: 50px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1.2px; font-family: var(--font-family); }
                .load-more-button:hover { background: var(--load-more-text); color: var(--load-more-bg); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); }
                .empty-state { text-align: center; padding: 80px 20px; color: var(--text-color); font-size: 18px; font-family: var(--font-family); }

                .variant-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .variant-modal { background: #fff; border-radius: 16px; padding: 28px; max-width: 440px; width: 100%; max-height: 85vh; overflow-y: auto; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3); font-family: var(--font-family); }
                .modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; font-size: 28px; cursor: pointer; color: #999; line-height: 1; padding: 0; }
                .modal-close:hover { color: #333; }
                .modal-product-info { display: flex; gap: 14px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
                .modal-product-img { width: 70px; height: 70px; object-fit: cover; border-radius: 8px; }
                .modal-product-name { font-weight: 700; font-size: 16px; color: #1a1a1a; margin-bottom: 4px; }
                .modal-product-price { font-weight: 800; font-size: 18px; color: var(--price-color, #2c3e50); }
                .option-group { margin-bottom: 18px; }
                .option-label { display: block; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 8px; }
                .color-swatches { display: flex; flex-wrap: wrap; gap: 8px; }
                .color-swatch { width: 36px; height: 36px; border-radius: 50%; cursor: pointer; border: 3px solid transparent; transition: all 0.2s ease; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1); }
                .color-swatch:hover { transform: scale(1.15); }
                .color-swatch.selected { border-color: var(--primary-accent, #3498db); box-shadow: 0 0 0 2px var(--primary-accent, #3498db); }
                .choice-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
                .choice-btn { padding: 8px 18px; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; color: #444; transition: all 0.2s ease; background: #fff; }
                .choice-btn:hover { border-color: #aaa; }
                .choice-btn.selected { border-color: var(--primary-accent, #3498db); background: var(--primary-accent, #3498db); color: #fff; }
                .modal-error { color: #e74c3c; font-size: 13px; min-height: 18px; margin-bottom: 8px; }
                .modal-actions { display: flex; gap: 12px; align-items: center; margin-top: 10px; }
                .quantity-selector { display: flex; align-items: center; gap: 0; border: 2px solid #ddd; border-radius: 8px; overflow: hidden; }
                .qty-btn { width: 36px; height: 36px; border: none; background: #f5f5f5; cursor: pointer; font-size: 18px; font-weight: 700; color: #333; transition: background 0.2s; }
                .qty-btn:hover { background: #e0e0e0; }
                .qty-value { width: 40px; text-align: center; font-weight: 700; font-size: 15px; border: none; background: #fff; }
                .modal-add-btn { flex: 1; padding: 12px 20px; border: none; border-radius: 8px; background: var(--primary-accent, #3498db); color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s ease; }
                .modal-add-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
                .modal-add-btn:disabled { background: #ccc; cursor: not-allowed; }

                @media (max-width: 1024px) {
                    .products-grid { grid-template-columns: repeat(var(--columns-tablet), 1fr); }
                }
                @media (max-width: 768px) {
                    .products-grid { grid-template-columns: repeat(var(--columns-mobile), 1fr); }
                    .product-name { font-size: calc(var(--heading-size) * 0.9); }
                    .product-description { font-size: calc(var(--text-size) * 0.9); }
                    .card-buttons { flex-direction: column; }
                }
            </style>
            <div class="gallery-container">
                <div class="products-grid"></div>
                <div class="load-more-container"></div>
            </div>
        `;
    }

    renderProducts() {
        const grid = this.querySelector('.products-grid');
        const loadMoreContainer = this.querySelector('.load-more-container');
        if (!grid || !loadMoreContainer) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No products found. Please select a category.</div>';
            loadMoreContainer.innerHTML = '';
            return;
        }

        grid.innerHTML = this.products.map(product => this.renderProductCard(product)).join('');

        grid.querySelectorAll('.btn-add-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.productId;
                btn.textContent = 'Loading...';
                btn.disabled = true;
                this.dispatchEvent(new CustomEvent('request-variants', {
                    bubbles: true, composed: true,
                    detail: { productId: productId }
                }));
            });
        });

        if (this.hasMore) {
            loadMoreContainer.innerHTML = `<button class="load-more-button" id="loadMoreBtn">${this.settings.loadMoreText}</button>`;
            const loadMoreBtn = this.querySelector('#loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
                });
            }
        } else {
            loadMoreContainer.innerHTML = '';
        }
        this.updateStyles();
    }

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        return `
            <div class="product-card">
                ${product.ribbon ? `<div class="product-ribbon">${product.ribbon}</div>` : ''}
                <div class="product-image-container">
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400'">
                </div>
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-price-section">
                        <span class="product-price">${product.price}</span>
                        ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : ''}
                    </div>
                    <div class="card-buttons">
                        <a href="${product.productUrl}" class="btn-view-product">${this.settings.buttonText}</a>
                        <button class="btn-add-cart" data-product-id="${product.id}" data-cart-btn="${product.id}">Add to Cart</button>
                    </div>
                </div>
            </div>
        `;
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
        if (!container) return;
        container.style.setProperty('--card-bg', this.settings.cardBgColor);
        container.style.setProperty('--card-hover-bg', this.settings.cardHoverBgColor);
        container.style.setProperty('--heading-color', this.settings.headingColor);
        container.style.setProperty('--text-color', this.settings.textColor);
        container.style.setProperty('--font-family', this.settings.fontFamily);
        container.style.setProperty('--heading-size', `${this.settings.headingSize}px`);
        container.style.setProperty('--text-size', `${this.settings.textSize}px`);
        container.style.setProperty('--price-color', this.settings.priceColor);
        container.style.setProperty('--compare-price-color', this.settings.comparePriceColor);
        container.style.setProperty('--price-size', `${this.settings.priceSize}px`);
        container.style.setProperty('--border-color', this.settings.borderColor);
        container.style.setProperty('--border-width', `${this.settings.borderWidth}px`);
        container.style.setProperty('--corner-radius', `${this.settings.cornerRadius}px`);
        container.style.setProperty('--card-padding', `${this.settings.cardPadding}px`);
        container.style.setProperty('--card-gap', `${this.settings.cardGap}px`);
        container.style.setProperty('--button-bg', this.settings.buttonBgColor);
        container.style.setProperty('--button-text', this.settings.buttonTextColor);
        container.style.setProperty('--button-hover-bg', this.settings.buttonHoverBgColor);
        container.style.setProperty('--image-height', `${this.settings.imageHeight}px`);
        container.style.setProperty('--image-border-radius', `${this.settings.imageBorderRadius}px`);
        container.style.setProperty('--card-shadow', this.getShadowCSS());
        container.style.setProperty('--columns-desktop', this.settings.columnsDesktop);
        container.style.setProperty('--columns-tablet', this.settings.columnsTablet);
        container.style.setProperty('--columns-mobile', this.settings.columnsMobile);
        container.style.setProperty('--ribbon-bg', this.settings.ribbonBgColor);
        container.style.setProperty('--ribbon-text', this.settings.ribbonTextColor);
        container.style.setProperty('--load-more-bg', this.settings.loadMoreBgColor);
        container.style.setProperty('--load-more-text', this.settings.loadMoreTextColor);
        container.style.setProperty('--load-more-border', this.settings.loadMoreBorderColor);
        container.style.setProperty('--primary-accent', this.settings.primaryAccent);
    }
}

customElements.define('product-gallery', ProductGalleryElement);
