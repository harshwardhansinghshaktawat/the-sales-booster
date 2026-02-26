class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.selectedOptions = {};
        this.products = [];
        this.settings = this.getDefaultSettings();
        this.isRendered = false;
    }

    getDefaultSettings() {
        return {
            cardBgColor: '#ffffff',
            cardHoverBgColor: '#f8f9fa',
            headingColor: '#1a1a1a',
            textColor: '#666666',
            fontFamily: 'Arial, sans-serif',
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
            cartButtonText: 'Add to Cart',
            cartButtonBgColor: '#2ecc71',
            cartButtonTextColor: '#ffffff',
            cartButtonHoverBgColor: '#27ae60',
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
    }

    connectedCallback() {
        this.isRendered = true;
        this.render();
    }

    static get observedAttributes() {
        return ['products-data', 'settings', 'cart-status'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (!newVal || newVal === oldVal) return;

        try {
            if (name === 'products-data' && newVal) {
                const data = JSON.parse(newVal);
                this.products = data.products || [];
                this.hasMore = data.hasMore || false;
                
                // Initialize selectedOptions for each product
                this.products.forEach(p => {
                    if (!this.selectedOptions[p.id]) {
                        this.selectedOptions[p.id] = {};
                    }
                });
                
                if (this.isRendered) {
                    this.render();
                }
            } 
            else if (name === 'settings' && newVal) {
                const newSettings = JSON.parse(newVal);
                Object.assign(this.settings, newSettings);
                if (this.isRendered) {
                    this.updateStyles();
                }
            }
            else if (name === 'cart-status' && newVal) {
                const status = JSON.parse(newVal);
                this.handleCartStatus(status);
            }
        } catch (e) {
            console.error('Attribute change error:', e);
        }
    }

    handleCartStatus(status) {
        const productId = status.productId;
        const card = this.querySelector(`[data-product-id="${productId}"]`);
        if (!card) return;

        const cartBtn = card.querySelector('.add-btn');
        if (!cartBtn) return;

        cartBtn.classList.remove('loading', 'success', 'error');

        if (status.status === 'loading') {
            cartBtn.classList.add('loading');
            cartBtn.innerHTML = '<span class="spinner"></span> Adding...';
        } else if (status.status === 'success') {
            cartBtn.classList.add('success');
            cartBtn.innerHTML = '✓ Added';
        } else if (status.status === 'error') {
            cartBtn.classList.add('error');
            cartBtn.textContent = status.message || 'Error';
        } else {
            // Reset
            cartBtn.classList.remove('loading', 'success', 'error');
            cartBtn.textContent = this.settings.cartButtonText;
        }
    }

    render() {
        if (!this.products.length) {
            this.innerHTML = `
                <style>${this.getStyles()}</style>
                <div class="gallery-container">
                    <div class="empty-state">No products found. Please select a category.</div>
                </div>
            `;
            return;
        }

        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="gallery-container">
                <div class="grid">
                    ${this.products.map(p => this.renderCard(p)).join('')}
                </div>
                ${this.hasMore ? `
                    <div class="load-more-container">
                        <button class="load-more-button">${this.settings.loadMoreText}</button>
                    </div>
                ` : ''}
            </div>
        `;

        this.attachEventListeners();
        this.updateStyles();
    }

    renderCard(p) {
        const hasComparePrice = p.compareAtPrice && p.compareAtPrice !== p.price;
        const productOptions = p.productOptions || p.options || [];
        const hasOptions = productOptions && productOptions.length > 0;

        return `
            <div class="card" data-product-id="${p.id}">
                ${p.ribbon ? `<div class="product-ribbon">${this.escapeHtml(p.ribbon)}</div>` : ''}
                
                <div class="image-container">
                    <img src="${p.imageUrl || p.media?.mainMedia?.image?.url || 'https://via.placeholder.com/400'}" 
                         alt="${this.escapeHtml(p.name)}"
                         onerror="this.src='https://via.placeholder.com/400'">
                </div>
                
                <div class="card-content">
                    <h3 class="product-name">${this.escapeHtml(p.name)}</h3>
                    <p class="product-description">${this.escapeHtml(p.description || '')}</p>
                    
                    <div class="price-section">
                        <span class="price">${p.price || p.priceData?.formatted?.price || 'N/A'}</span>
                        ${hasComparePrice ? `<span class="compare-price">${p.compareAtPrice}</span>` : ''}
                    </div>
                    
                    ${hasOptions ? this.renderOptions(p, productOptions) : ''}
                    
                    <div class="buttons">
                        <button class="add-btn" data-product-id="${p.id}">
                            ${this.settings.cartButtonText}
                        </button>
                        <a href="${p.productUrl || '#'}" class="view-btn">
                            ${this.settings.buttonText}
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    renderOptions(product, productOptions) {
        return `
            <div class="options">
                ${productOptions.map(opt => {
                    const optName = opt.name;
                    const isColor = opt.optionType === 'color' || opt.type === 'color';
                    const choices = opt.choices || [];

                    if (isColor) {
                        return `
                            <div class="option">
                                <label class="option-label">${this.escapeHtml(optName)}</label>
                                <div class="swatches">
                                    ${choices.map(c => {
                                        const color = c.value || c.color || '#ccc';
                                        const title = c.description || c.value || '';
                                        const isOOS = c.inStock === false;
                                        
                                        return `
                                            <button class="swatch ${isOOS ? 'out-of-stock' : ''}" 
                                                    style="background-color: ${color};" 
                                                    data-option="${this.escapeAttr(optName)}" 
                                                    data-value="${this.escapeAttr(c.value || c.description)}"
                                                    title="${this.escapeAttr(title)}"
                                                    ${isOOS ? 'disabled' : ''}>
                                            </button>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="option">
                                <label class="option-label">${this.escapeHtml(optName)}</label>
                                <select data-option="${this.escapeAttr(optName)}">
                                    <option value="">Select ${this.escapeHtml(optName)}</option>
                                    ${choices.map(c => {
                                        const value = c.description || c.value || '';
                                        const isOOS = c.inStock === false;
                                        const oosLabel = isOOS ? ' (Out of Stock)' : '';
                                        
                                        return `
                                            <option value="${this.escapeAttr(value)}" ${isOOS ? 'disabled' : ''}>
                                                ${this.escapeHtml(value)}${oosLabel}
                                            </option>
                                        `;
                                    }).join('')}
                                </select>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        `;
    }

    attachEventListeners() {
        // Swatches
        this.querySelectorAll('.swatch').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.disabled) return;
                
                const option = e.target.dataset.option;
                const value = e.target.dataset.value;
                const card = e.target.closest('.card');
                const productId = card.dataset.productId;
                
                // Update selection
                this.selectedOptions[productId][option] = value;
                
                // Update UI
                card.querySelectorAll(`.swatch[data-option="${option}"]`).forEach(s => {
                    s.classList.remove('selected');
                });
                e.target.classList.add('selected');
                
                console.log('Color selected:', { productId, option, value, all: this.selectedOptions[productId] });
            });
        });

        // Dropdowns
        this.querySelectorAll('select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const option = e.target.dataset.option;
                const value = e.target.value;
                const card = e.target.closest('.card');
                const productId = card.dataset.productId;
                
                if (value === '') {
                    delete this.selectedOptions[productId][option];
                } else {
                    this.selectedOptions[productId][option] = value;
                }
                
                console.log('Dropdown changed:', { productId, option, value, all: this.selectedOptions[productId] });
            });
        });

        // Add to Cart buttons
        this.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.card');
                const productId = card.dataset.productId;
                const choices = this.selectedOptions[productId] || {};
                
                console.log('Add to cart clicked:', { productId, choices });
                
                this.dispatchEvent(new CustomEvent('add-to-cart', {
                    bubbles: true,
                    composed: true,
                    detail: { productId, choices }
                }));
            });
        });

        // Load More button
        const loadMoreBtn = this.querySelector('.load-more-button');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('load-more', {
                    bubbles: true,
                    composed: true
                }));
            });
        }
    }

    getStyles() {
        return `
            * { box-sizing: border-box; margin: 0; padding: 0; }
            
            .gallery-container {
                padding: 20px;
                max-width: 1400px;
                margin: 0 auto;
                font-family: var(--font-family);
            }
            
            .grid {
                display: grid;
                grid-template-columns: repeat(var(--columns-desktop), 1fr);
                gap: var(--card-gap);
                margin-bottom: 40px;
            }
            
            .card {
                background: var(--card-bg);
                border: var(--border-width) solid var(--border-color);
                border-radius: var(--corner-radius);
                padding: var(--card-padding);
                box-shadow: var(--card-shadow);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .card:hover {
                background: var(--card-hover-bg);
                transform: var(--hover-transform);
            }
            
            .product-ribbon {
                position: absolute;
                top: 12px;
                left: 0;
                background: var(--ribbon-bg);
                color: var(--ribbon-text);
                padding: 6px 16px;
                font-weight: 700;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
                z-index: 10;
                border-radius: 0 4px 4px 0;
            }
            
            .image-container {
                width: 100%;
                height: var(--image-height);
                overflow: hidden;
                border-radius: var(--image-border-radius);
                margin-bottom: 16px;
                background: #f5f5f5;
            }
            
            .image-container img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.4s ease;
            }
            
            .card:hover .image-container img {
                transform: var(--image-zoom-transform);
            }
            
            .card-content {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .product-name {
                font-size: var(--heading-size);
                font-weight: 700;
                color: var(--heading-color);
                line-height: 1.3;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                height: calc(var(--heading-size) * 2.6);
            }
            
            .product-description {
                font-size: var(--text-size);
                color: var(--text-color);
                line-height: 1.6;
                overflow: hidden;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                height: calc(var(--text-size) * 3.2);
            }
            
            .price-section {
                display: flex;
                align-items: center;
                gap: 10px;
                padding-top: 12px;
                border-top: 1px solid var(--border-color);
            }
            
            .price {
                font-size: var(--price-size);
                font-weight: 800;
                color: var(--price-color);
            }
            
            .compare-price {
                font-size: calc(var(--price-size) * 0.65);
                color: var(--compare-price-color);
                text-decoration: line-through;
            }
            
            /* OPTIONS */
            .options {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .option {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .option-label {
                font-size: 12px;
                font-weight: 600;
                color: var(--heading-color);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .swatches {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .swatch {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 2px solid var(--border-color);
                cursor: pointer;
                transition: all 0.2s ease;
                padding: 0;
                position: relative;
            }
            
            .swatch:hover:not(:disabled) {
                border-color: var(--primary-accent);
                transform: scale(1.1);
            }
            
            .swatch.selected {
                border-color: var(--primary-accent);
                border-width: 3px;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
            }
            
            .swatch.selected::after {
                content: "✓";
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 16px;
                font-weight: bold;
                text-shadow: 0 0 3px rgba(0,0,0,0.8);
            }
            
            .swatch.out-of-stock {
                opacity: 0.4;
                cursor: not-allowed;
            }
            
            .swatch.out-of-stock::before {
                content: "";
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 2px;
                background: #cc0000;
                transform: rotate(-45deg);
            }
            
            select {
                width: 100%;
                padding: 12px 14px;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                font-size: 14px;
                font-family: var(--font-family);
                color: var(--heading-color);
                background: white;
                cursor: pointer;
                transition: border-color 0.2s ease;
            }
            
            select:focus {
                outline: none;
                border-color: var(--primary-accent);
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            }
            
            /* BUTTONS */
            .buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 8px;
            }
            
            .add-btn, .view-btn {
                width: 100%;
                padding: 14px 28px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                text-decoration: none;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            
            .add-btn {
                background: var(--cart-button-bg);
                color: var(--cart-button-text);
            }
            
            .add-btn:hover {
                background: var(--cart-button-hover-bg);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            }
            
            .add-btn.loading {
                opacity: 0.8;
                cursor: wait;
            }
            
            .add-btn.success {
                background: #27ae60;
            }
            
            .add-btn.error {
                background: #e74c3c;
            }
            
            .view-btn {
                background: var(--button-bg);
                color: var(--button-text);
            }
            
            .view-btn:hover {
                background: var(--button-hover-bg);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            }
            
            .spinner {
                display: inline-block;
                width: 14px;
                height: 14px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 0.6s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            /* LOAD MORE */
            .load-more-container {
                text-align: center;
                padding: 30px 0;
            }
            
            .load-more-button {
                padding: 16px 48px;
                border: 3px solid var(--load-more-border);
                background: var(--load-more-bg);
                color: var(--load-more-text);
                border-radius: 50px;
                font-size: 15px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1.2px;
                font-family: var(--font-family);
            }
            
            .load-more-button:hover {
                background: var(--load-more-text);
                color: var(--load-more-bg);
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.15);
            }
            
            .empty-state {
                text-align: center;
                padding: 80px 20px;
                color: var(--text-color);
                font-size: 18px;
            }
            
            /* RESPONSIVE */
            @media (max-width: 1024px) {
                .grid {
                    grid-template-columns: repeat(var(--columns-tablet), 1fr);
                }
            }
            
            @media (max-width: 768px) {
                .grid {
                    grid-template-columns: repeat(var(--columns-mobile), 1fr);
                }
                
                .swatch {
                    width: 36px;
                    height: 36px;
                }
            }
        `;
    }

    updateStyles() {
        const s = this.settings;
        const container = this.querySelector('.gallery-container');
        if (!container) return;

        const shadows = {
            none: 'none',
            small: '0 1px 3px rgba(0, 0, 0, 0.08)',
            medium: '0 4px 12px rgba(0, 0, 0, 0.12)',
            large: '0 8px 24px rgba(0, 0, 0, 0.16)'
        };

        const hoverTransforms = {
            lift: 'translateY(-8px)',
            zoom: 'scale(1.02)',
            glow: 'translateY(0)',
            none: 'translateY(0)'
        };

        container.style.setProperty('--font-family', s.fontFamily);
        container.style.setProperty('--card-bg', s.cardBgColor);
        container.style.setProperty('--card-hover-bg', s.cardHoverBgColor);
        container.style.setProperty('--heading-color', s.headingColor);
        container.style.setProperty('--text-color', s.textColor);
        container.style.setProperty('--heading-size', s.headingSize + 'px');
        container.style.setProperty('--text-size', s.textSize + 'px');
        container.style.setProperty('--price-color', s.priceColor);
        container.style.setProperty('--compare-price-color', s.comparePriceColor);
        container.style.setProperty('--price-size', s.priceSize + 'px');
        container.style.setProperty('--border-color', s.borderColor);
        container.style.setProperty('--border-width', s.borderWidth + 'px');
        container.style.setProperty('--corner-radius', s.cornerRadius + 'px');
        container.style.setProperty('--card-padding', s.cardPadding + 'px');
        container.style.setProperty('--card-gap', s.cardGap + 'px');
        container.style.setProperty('--button-bg', s.buttonBgColor);
        container.style.setProperty('--button-text', s.buttonTextColor);
        container.style.setProperty('--button-hover-bg', s.buttonHoverBgColor);
        container.style.setProperty('--cart-button-bg', s.cartButtonBgColor);
        container.style.setProperty('--cart-button-text', s.cartButtonTextColor);
        container.style.setProperty('--cart-button-hover-bg', s.cartButtonHoverBgColor);
        container.style.setProperty('--image-height', s.imageHeight + 'px');
        container.style.setProperty('--image-border-radius', s.imageBorderRadius + 'px');
        container.style.setProperty('--card-shadow', shadows[s.cardShadow] || shadows.medium);
        container.style.setProperty('--hover-transform', hoverTransforms[s.hoverEffect] || hoverTransforms.lift);
        container.style.setProperty('--image-zoom-transform', s.imageZoom ? 'scale(1.1)' : 'scale(1)');
        container.style.setProperty('--columns-desktop', s.columnsDesktop);
        container.style.setProperty('--columns-tablet', s.columnsTablet);
        container.style.setProperty('--columns-mobile', s.columnsMobile);
        container.style.setProperty('--ribbon-bg', s.ribbonBgColor);
        container.style.setProperty('--ribbon-text', s.ribbonTextColor);
        container.style.setProperty('--load-more-bg', s.loadMoreBgColor);
        container.style.setProperty('--load-more-text', s.loadMoreTextColor);
        container.style.setProperty('--load-more-border', s.loadMoreBorderColor);
        container.style.setProperty('--primary-accent', s.primaryAccent);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeAttr(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}

customElements.define('product-gallery', ProductGalleryElement);
