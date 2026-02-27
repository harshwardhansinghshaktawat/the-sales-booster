class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.selectedOptions = {};
        this.quantities = {};
        this.errors = {};
        this.pendingProductsData = null;
        this.isRendered = false;
        this.settings = {
            cardBgColor: '#ffffff', cardHoverBgColor: '#f8f9fa', headingColor: '#1a1a1a', textColor: '#666666',
            fontFamily: 'Arial', headingSize: 18, textSize: 14, priceColor: '#2c3e50', comparePriceColor: '#999999',
            priceSize: 24, primaryAccent: '#3498db', secondaryAccent: '#2ecc71', ribbonBgColor: '#e74c3c',
            ribbonTextColor: '#ffffff', borderColor: '#e0e0e0', borderWidth: 1, cornerRadius: 12,
            cardPadding: 20, cardGap: 24, buttonText: 'Add to Cart', buttonBgColor: '#3498db',
            buttonTextColor: '#ffffff', buttonHoverBgColor: '#2980b9', buttonStyle: 'filled',
            buttonSize: 'medium', imageHeight: 280, imageZoom: true, imageBorderRadius: 8,
            cardShadow: 'medium', hoverEffect: 'lift', columnsDesktop: 3, columnsTablet: 2,
            columnsMobile: 1, loadMoreText: 'Load More Products', loadMoreBgColor: '#ffffff',
            loadMoreTextColor: '#3498db', loadMoreBorderColor: '#3498db'
        };
    }

    static get observedAttributes() {
        return ['products-data', 'settings', 'error-data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || newValue === oldValue) return;

        if (name === 'products-data') {
            try {
                const data = JSON.parse(newValue);
                console.log('📦 Custom Element: Received products-data →', data.products?.length || 0, 'products');

                if (!this.isRendered) {
                    this.pendingProductsData = data;
                    return;
                }

                this.products = data.products || [];
                this.hasMore = data.hasMore || false;

                this.products.forEach(p => {
                    this.selectedOptions[p.id] = {};
                    this.quantities[p.id] = 1;
                    this.errors[p.id] = '';
                });

                this.renderProducts();
            } catch (e) {
                console.error('❌ Custom Element: Failed to parse products-data', e);
            }
        } else if (name === 'settings') {
            try {
                const newSettings = JSON.parse(newValue);
                Object.assign(this.settings, newSettings);
                if (this.isRendered) this.updateStyles();
            } catch (e) {}
        } else if (name === 'error-data') {
            try {
                const err = JSON.parse(newValue);
                this.errors[err.productId] = err.message;
                this.updateErrorDisplay(err.productId);
            } catch (e) {}
        }
    }

    connectedCallback() {
        console.log('🔗 Custom Element: Connected to DOM');
        this.render();
        this.isRendered = true;

        if (this.pendingProductsData) {
            console.log('📦 Applying pending products data...');
            const data = this.pendingProductsData;
            this.products = data.products || [];
            this.hasMore = data.hasMore || false;

            this.products.forEach(p => {
                this.selectedOptions[p.id] = {};
                this.quantities[p.id] = 1;
                this.errors[p.id] = '';
            });

            this.pendingProductsData = null;
            this.renderProducts();
        } else if (this.products.length === 0) {
            this.renderProducts(); // show empty state
        }
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
                .product-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
                .product-card:hover .product-image { transform: ${this.settings.imageZoom ? 'scale(1.1)' : 'scale(1)'}; }
                .product-ribbon { position: absolute; top: 12px; left: 0; background: var(--ribbon-bg); color: var(--ribbon-text); padding: 6px 16px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 2px 2px 8px rgba(0,0,0,0.2); z-index: 10; border-radius: 0 4px 4px 0; }
                .product-content { padding: var(--card-padding); flex: 1; display: flex; flex-direction: column; }
                .product-name { font-size: var(--heading-size); font-weight: 700; margin: 0 0 12px 0; line-height: 1.3; color: var(--heading-color); height: calc(var(--heading-size) * 2.6); overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
                .options-section { margin: 12px 0 16px 0; flex: 1; }
                .option { margin-bottom: 14px; }
                .option label { display: block; font-weight: 600; font-size: 0.9em; margin-bottom: 6px; color: #555; }
                .swatches { display: flex; flex-wrap: wrap; gap: 8px; }
                .swatch { width: 36px; height: 36px; border-radius: 50%; border: 2px solid #ddd; cursor: pointer; transition: all 0.2s; }
                .swatch.selected { border-color: #000; box-shadow: 0 0 0 3px white, 0 0 0 5px #000; }
                select { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.95em; }
                .quantity-selector { display: flex; align-items: center; gap: 12px; margin: 12px 0; padding: 12px; background: #f8f8f8; border-radius: 6px; }
                .quantity-btn { width: 32px; height: 32px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-size: 1.2em; font-weight: bold; }
                .quantity-value { min-width: 40px; text-align: center; font-weight: 600; }
                .error-message { color: #d32f2f; font-size: 0.85em; padding: 8px; background: #ffebee; border-radius: 4px; margin: 8px 0; display: none; }
                .product-price-section { margin: auto 0 16px 0; padding-top: 16px; border-top: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px; }
                .product-price { font-size: var(--price-size); font-weight: 800; color: var(--price-color); }
                .product-compare-price { font-size: calc(var(--price-size) * 0.65); color: var(--compare-price-color); text-decoration: line-through; }
                .button-group { display: flex; gap: 10px; margin-top: auto; }
                .btn { flex: 1; padding: 14px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
                .btn-view { background: #f1f1f1; color: #333; }
                .btn-add { background: var(--primary-accent); color: white; }
                .btn-add:hover { background: #0056b3; transform: translateY(-2px); }
                .load-more-container { text-align: center; padding: 30px 0; }
                .load-more-button { padding: 16px 48px; border: 3px solid var(--load-more-border); background: var(--load-more-bg); color: var(--load-more-text); border-radius: 50px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.3s; }
                .load-more-button:hover { background: var(--load-more-text); color: var(--load-more-bg); }
                .empty-state, .loading-state { text-align: center; padding: 80px 20px; color: #777; font-size: 18px; }
                @media (max-width: 1024px) { .products-grid { grid-template-columns: repeat(var(--columns-tablet), 1fr); } }
                @media (max-width: 768px) { .products-grid { grid-template-columns: repeat(var(--columns-mobile), 1fr); } }
            </style>
            <div class="gallery-container">
                <div class="products-grid">
                    <div class="loading-state">Loading products...</div>
                </div>
                <div class="load-more-container"></div>
            </div>
        `;
        this.updateStyles();
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

    renderProducts() {
        const grid = this.querySelector('.products-grid');
        const loadMoreContainer = this.querySelector('.load-more-container');

        if (!grid) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No products found.<br>Please select a category in the widget settings.</div>';
            loadMoreContainer.innerHTML = '';
            return;
        }

        grid.innerHTML = this.products.map(product => this.renderProductCard(product)).join('');

        if (this.hasMore) {
            loadMoreContainer.innerHTML = `<button class="load-more-button">${this.settings.loadMoreText}</button>`;
            loadMoreContainer.querySelector('button').addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
            });
        } else {
            loadMoreContainer.innerHTML = '';
        }

        this.attachEventListeners();
        console.log('🎨 Custom Element: Rendered', this.products.length, 'product cards');
    }

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        let optionsHTML = '';
        if (product.productOptions && product.productOptions.length > 0) {
            optionsHTML = product.productOptions.map(opt => `
                <div class="option">
                    <label>${opt.name}</label>
                    ${opt.optionType === 'color' ? `
                        <div class="swatches" data-option="${opt.name}">
                            ${opt.choices.map(c => `
                                <button class="swatch" style="background-color: ${c.value || c.description};" data-value="${c.description}" title="${c.description}"></button>
                            `).join('')}
                        </div>
                    ` : `
                        <select data-option="${opt.name}">
                            <option value="">Choose ${opt.name}</option>
                            ${opt.choices.map(c => `<option value="${c.description}">${c.description}</option>`).join('')}
                        </select>
                    `}
                </div>
            `).join('');
        }

        return `
            <div class="product-card" data-product-id="${product.id}">
                ${product.ribbon ? `<div class="product-ribbon">${product.ribbon}</div>` : ''}
                <div class="product-image-container">
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://via.placeholder.com/400'">
                </div>
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="options-section">${optionsHTML}</div>
                    <div class="quantity-selector">
                        <label>Quantity</label>
                        <div style="display:flex;align-items:center;gap:8px;margin-left:auto;">
                            <button class="quantity-btn" data-action="decrease">-</button>
                            <span class="quantity-value">${this.quantities[product.id] || 1}</span>
                            <button class="quantity-btn" data-action="increase">+</button>
                        </div>
                    </div>
                    <div class="error-message"></div>
                    <div class="product-price-section">
                        <span class="product-price">${product.price}</span>
                        ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : ''}
                    </div>
                    <div class="button-group">
                        <button class="btn btn-view" data-action="view">View Product</button>
                        <button class="btn btn-add" data-action="add">${this.settings.buttonText}</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Swatches, selects, quantity, buttons (same reliable logic as before)
        this.querySelectorAll('.swatch').forEach(btn => {
            btn.addEventListener('click', e => {
                const card = e.target.closest('.product-card');
                const productId = card.dataset.productId;
                const option = e.target.parentElement.dataset.option;
                const value = e.target.dataset.value;
                this.selectedOptions[productId][option] = value;
                this.errors[productId] = '';
                this.updateErrorDisplay(productId);
                card.querySelectorAll(`.swatch[data-option="${option}"]`).forEach(s => s.classList.remove('selected'));
                e.target.classList.add('selected');
            });
        });

        this.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', e => {
                const card = e.target.closest('.product-card');
                const productId = card.dataset.productId;
                const option = e.target.dataset.option;
                const value = e.target.value;
                if (value) this.selectedOptions[productId][option] = value;
                else delete this.selectedOptions[productId][option];
                this.errors[productId] = '';
                this.updateErrorDisplay(productId);
            });
        });

        this.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const card = e.target.closest('.product-card');
                const productId = card.dataset.productId;
                let qty = this.quantities[productId] || 1;
                if (e.target.dataset.action === 'decrease' && qty > 1) qty--;
                if (e.target.dataset.action === 'increase' && qty < 99) qty++;
                this.quantities[productId] = qty;
                card.querySelector('.quantity-value').textContent = qty;
            });
        });

        this.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', e => {
                const card = e.target.closest('.product-card');
                const productId = card.dataset.productId;
                const product = this.products.find(p => p.id === productId);
                const action = e.target.dataset.action;

                if (action === 'view') {
                    this.dispatchEvent(new CustomEvent('viewProduct', { detail: { product }, bubbles: true, composed: true }));
                } else if (action === 'add') {
                    const choices = this.selectedOptions[productId] || {};
                    const quantity = this.quantities[productId] || 1;
                    this.dispatchEvent(new CustomEvent('addToCart', {
                        detail: { productId, choices, quantity },
                        bubbles: true,
                        composed: true
                    }));
                }
            });
        });
    }

    updateErrorDisplay(productId) {
        const card = this.querySelector(`[data-product-id="${productId}"]`);
        if (card) {
            const errEl = card.querySelector('.error-message');
            if (errEl) {
                errEl.textContent = this.errors[productId] || '';
                errEl.style.display = this.errors[productId] ? 'block' : 'none';
            }
        }
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
        container.style.setProperty('--primary-accent', this.settings.primaryAccent);
        container.style.setProperty('--ribbon-bg', this.settings.ribbonBgColor);
        container.style.setProperty('--ribbon-text', this.settings.ribbonTextColor);
        container.style.setProperty('--image-height', `${this.settings.imageHeight}px`);
        container.style.setProperty('--image-border-radius', `${this.settings.imageBorderRadius}px`);
        container.style.setProperty('--card-shadow', this.getShadowCSS());
        container.style.setProperty('--columns-desktop', this.settings.columnsDesktop);
        container.style.setProperty('--columns-tablet', this.settings.columnsTablet);
        container.style.setProperty('--columns-mobile', this.settings.columnsMobile);
        container.style.setProperty('--load-more-bg', this.settings.loadMoreBgColor);
        container.style.setProperty('--load-more-text', this.settings.loadMoreTextColor);
        container.style.setProperty('--load-more-border', this.settings.loadMoreBorderColor);
    }

    getShadowCSS() {
        const shadows = { none: 'none', small: '0 1px 3px rgba(0,0,0,0.08)', medium: '0 4px 12px rgba(0,0,0,0.12)', large: '0 8px 24px rgba(0,0,0,0.16)' };
        return shadows[this.settings.cardShadow] || shadows.medium;
    }
}

customElements.define('product-gallery', ProductGalleryElement);
