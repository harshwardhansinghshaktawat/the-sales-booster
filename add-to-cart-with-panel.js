class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.loadedImages = new Set();
        this.settings = this.getDefaultSettings();
        this.isRendered = false;
        this.pendingProductsData = null;
    }

    getDefaultSettings() {
        return {
            cardBgColor: '#ffffff',
            cardHoverBgColor: '#f8f9fa',
            borderColor: '#e0e0e0',
            cardShadow: 'medium',
            cornerRadius: 12,
            borderWidth: 1,
            cardPadding: 20,
            cardGap: 24,
            headingColor: '#1a1a1a',
            textColor: '#666666',
            fontFamily: 'Arial',
            headingSize: 18,
            textSize: 14,
            priceColor: '#2c3e50',
            comparePriceColor: '#999999',
            priceSize: 24,
            buttonText: 'View Product',
            buttonBgColor: '#3498db',
            buttonTextColor: '#ffffff',
            buttonHoverBgColor: '#2980b9',
            buttonStyle: 'filled',
            buttonSize: 'medium',
            buttonRadius: 8,
            imageHeight: 280,
            imageZoom: true,
            imageBorderRadius: 8,
            ribbonBgColor: '#e74c3c',
            ribbonTextColor: '#ffffff',
            primaryAccent: '#3498db',
            secondaryAccent: '#2ecc71',
            hoverEffect: 'lift',
            loadMoreText: 'Load More Products',
            loadMoreBgColor: '#ffffff',
            loadMoreTextColor: '#3498db',
            loadMoreBorderColor: '#3498db'
        };
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
        return ['products-data', 'settings'];
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
                } catch (e) {
                    console.error('Error parsing products data:', e);
                }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    if (this.isRendered) {
                        this.updateStyles();
                    }
                } catch (e) {
                    console.error('Error parsing settings:', e);
                }
            }
        }
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

    getButtonSizeCSS() {
        const sizes = {
            small: 'padding: 10px 20px; font-size: 12px;',
            medium: 'padding: 14px 28px; font-size: 14px;',
            large: 'padding: 18px 36px; font-size: 16px;'
        };
        return sizes[this.settings.buttonSize] || sizes.medium;
    }

    render() {
        console.log('🎨 Rendering Product Gallery');
        
        this.innerHTML = `
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                :host {
                    display: block;
                    width: 100%;
                }
                
                .gallery-container {
                    width: 100%;
                    padding: 20px;
                    max-width: 1600px;
                    margin: 0 auto;
                    font-family: var(--font-family);
                }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: var(--card-gap);
                    margin-bottom: 40px;
                }
                
                .product-card {
                    background: var(--card-bg);
                    border: var(--border-width) solid var(--border-color);
                    border-radius: var(--corner-radius);
                    overflow: hidden;
                    box-shadow: var(--card-shadow);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .product-card:hover {
                    background: var(--card-hover-bg);
                    ${this.getHoverEffectCSS()}
                }
                
                .image-container {
                    position: relative;
                    width: 100%;
                    height: var(--image-height);
                    overflow: hidden;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                    border-radius: var(--image-border-radius);
                }
                
                @keyframes shimmer {
                    0% { background-position: -100% 0; }
                    100% { background-position: 100% 0; }
                }
                
                .product-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    opacity: 0;
                    transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .product-image.loaded {
                    opacity: 1;
                }
                
                .product-card:hover .product-image {
                    transform: ${this.settings.imageZoom ? 'scale(1.08)' : 'scale(1)'};
                }
                
                .ribbon {
                    position: absolute;
                    top: 12px;
                    left: 0;
                    background: var(--ribbon-bg);
                    color: var(--ribbon-text);
                    padding: 6px 16px;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    z-index: 10;
                    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
                    border-radius: 0 4px 4px 0;
                }
                
                .sale-badge {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: var(--primary-accent);
                    color: white;
                    padding: 6px 12px;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    border-radius: 20px;
                    z-index: 10;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                }
                
                .product-content {
                    padding: var(--card-padding);
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .product-title {
                    font-size: var(--heading-size);
                    font-weight: 700;
                    color: var(--heading-color);
                    margin: 0 0 10px 0;
                    line-height: 1.3;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    min-height: calc(var(--heading-size) * 2.6);
                }
                
                .product-desc {
                    font-size: var(--text-size);
                    color: var(--text-color);
                    margin: 0 0 auto 0;
                    line-height: 1.5;
                    overflow: hidden;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }
                
                .price-section {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                    margin: 16px 0;
                    padding-top: 12px;
                    border-top: 1px solid var(--border-color);
                }
                
                .price {
                    font-size: var(--price-size);
                    font-weight: 800;
                    color: var(--price-color);
                }
                
                .price-sale {
                    font-size: calc(var(--price-size) * 0.7);
                    color: var(--compare-price-color);
                    text-decoration: line-through;
                    opacity: 0.7;
                }
                
                .product-button {
                    display: block;
                    width: 100%;
                    border-radius: var(--button-radius);
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    text-align: center;
                    ${this.getButtonCSS()}
                    ${this.getButtonSizeCSS()}
                }
                
                .product-button:hover {
                    background: var(--button-hover-bg);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
                }
                
                .load-more-container {
                    text-align: center;
                    padding: 40px 20px;
                }
                
                .load-more-btn {
                    padding: 18px 48px;
                    background: var(--load-more-bg);
                    color: var(--load-more-text);
                    border: 2px solid var(--load-more-border);
                    border-radius: var(--button-radius);
                    font-weight: 700;
                    font-size: 15px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: var(--font-family);
                }
                
                .load-more-btn:hover {
                    background: var(--load-more-text);
                    color: var(--load-more-bg);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    color: var(--text-color);
                    font-size: 18px;
                }
                
                @media (max-width: 1200px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    }
                }
                
                @media (max-width: 768px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    }
                    
                    .gallery-container {
                        padding: 12px;
                    }
                    
                    .product-title {
                        font-size: calc(var(--heading-size) * 0.9);
                    }
                    
                    .product-desc {
                        font-size: calc(var(--text-size) * 0.9);
                    }
                    
                    .price {
                        font-size: calc(var(--price-size) * 0.85);
                    }
                }
                
                @media (max-width: 480px) {
                    .products-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
            
            <div class="gallery-container">
                <div class="products-grid"></div>
                <div class="load-more-container"></div>
            </div>
        `;
    }

    getHoverEffectCSS() {
        const effects = {
            lift: 'transform: translateY(-8px); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);',
            glow: 'box-shadow: 0 0 24px var(--primary-accent);',
            zoom: 'transform: scale(1.02);',
            none: ''
        };
        return effects[this.settings.hoverEffect] || effects.lift;
    }

    getButtonCSS() {
        const styles = {
            filled: `
                background: var(--button-bg);
                color: var(--button-text);
                border: none;
            `,
            outlined: `
                background: transparent;
                color: var(--button-bg);
                border: 2px solid var(--button-bg);
            `,
            text: `
                background: transparent;
                color: var(--button-bg);
                border: none;
            `
        };
        return styles[this.settings.buttonStyle] || styles.filled;
    }

    renderProducts() {
        console.log('📦 Rendering', this.products.length, 'products');
        
        const grid = this.querySelector('.products-grid');
        const loadMoreContainer = this.querySelector('.load-more-container');

        if (!grid || !loadMoreContainer) return;

        if (this.products.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    No products found. Please select a category or check back later.
                </div>
            `;
            loadMoreContainer.innerHTML = '';
            return;
        }

        grid.innerHTML = this.products.map((product, index) => 
            this.renderProductCard(product, index)
        ).join('');

        this.setupLazyLoading();

        if (this.hasMore) {
            loadMoreContainer.innerHTML = `
                <button class="load-more-btn" id="loadMoreBtn">
                    ${this.settings.loadMoreText}
                </button>
            `;
            
            const loadMoreBtn = this.querySelector('#loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('load-more', {
                        bubbles: true,
                        composed: true
                    }));
                });
            }
        } else {
            loadMoreContainer.innerHTML = '';
        }

        this.updateStyles();
    }

    renderProductCard(product, index) {
        const hasComparePrice = product.compareAtPrice && 
                               product.compareAtPrice !== product.price;
        const isAboveFold = index < 6;
        
        return `
            <div class="product-card">
                ${product.ribbon ? `<div class="ribbon">${product.ribbon}</div>` : ''}
                ${hasComparePrice ? '<div class="sale-badge">SALE</div>' : ''}
                
                <div class="image-container">
                    <img 
                        ${isAboveFold ? 
                            `src="${product.imageUrl}" onload="this.classList.add('loaded')"` : 
                            `data-src="${product.imageUrl}"`
                        }
                        alt="${product.name}"
                        class="product-image ${isAboveFold ? '' : ''}"
                        loading="lazy"
                    >
                </div>
                
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    ${product.description ? `<p class="product-desc">${product.description}</p>` : ''}
                    
                    <div class="price-section">
                        <span class="price">${product.price}</span>
                        ${hasComparePrice ? `<span class="price-sale">${product.compareAtPrice}</span>` : ''}
                    </div>
                    
                    <a href="${product.productUrl}" class="product-button">${this.settings.buttonText}</a>
                </div>
            </div>
        `;
    }

    setupLazyLoading() {
        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.01
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src && !this.loadedImages.has(src)) {
                        img.src = src;
                        img.classList.add('loaded');
                        this.loadedImages.add(src);
                        observer.unobserve(img);
                    }
                }
            });
        }, options);

        this.querySelectorAll('img[data-src]').forEach(img => {
            observer.observe(img);
        });
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
        if (!container) return;

        const { settings } = this;
        
        container.style.setProperty('--card-gap', `${settings.cardGap}px`);
        container.style.setProperty('--card-bg', settings.cardBgColor);
        container.style.setProperty('--card-hover-bg', settings.cardHoverBgColor);
        container.style.setProperty('--border-color', settings.borderColor);
        container.style.setProperty('--card-shadow', this.getShadowCSS());
        container.style.setProperty('--corner-radius', `${settings.cornerRadius}px`);
        container.style.setProperty('--border-width', `${settings.borderWidth}px`);
        container.style.setProperty('--card-padding', `${settings.cardPadding}px`);
        container.style.setProperty('--heading-color', settings.headingColor);
        container.style.setProperty('--text-color', settings.textColor);
        container.style.setProperty('--font-family', settings.fontFamily);
        container.style.setProperty('--heading-size', `${settings.headingSize}px`);
        container.style.setProperty('--text-size', `${settings.textSize}px`);
        container.style.setProperty('--price-color', settings.priceColor);
        container.style.setProperty('--compare-price-color', settings.comparePriceColor);
        container.style.setProperty('--price-size', `${settings.priceSize}px`);
        container.style.setProperty('--button-bg', settings.buttonBgColor);
        container.style.setProperty('--button-text', settings.buttonTextColor);
        container.style.setProperty('--button-hover-bg', settings.buttonHoverBgColor);
        container.style.setProperty('--button-radius', `${settings.buttonRadius}px`);
        container.style.setProperty('--image-height', `${settings.imageHeight}px`);
        container.style.setProperty('--image-border-radius', `${settings.imageBorderRadius}px`);
        container.style.setProperty('--ribbon-bg', settings.ribbonBgColor);
        container.style.setProperty('--ribbon-text', settings.ribbonTextColor);
        container.style.setProperty('--primary-accent', settings.primaryAccent);
        container.style.setProperty('--secondary-accent', settings.secondaryAccent);
        container.style.setProperty('--load-more-bg', settings.loadMoreBgColor);
        container.style.setProperty('--load-more-text', settings.loadMoreTextColor);
        container.style.setProperty('--load-more-border', settings.loadMoreBorderColor);
    }
}

customElements.define('product-gallery', ProductGalleryElement);
console.log('✅ product-gallery custom element registered');
