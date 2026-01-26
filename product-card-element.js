class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.settings = {
            primaryBg: '#ffffff',
            secondaryBg: '#00d4ff',
            borderColor: '#e0e0e0',
            titleColor: '#333333',
            borderWidth: 1,
            cornerRadius: 16,
            buttonText: 'Load More Products'
        };
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['products-data', 'settings'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'products-data') {
                try {
                    const data = JSON.parse(newValue);
                    this.products = data.products || [];
                    this.hasMore = data.hasMore || false;
                    console.log('Products received:', this.products.length);
                    this.renderProducts();
                } catch (e) {
                    console.error('Error parsing products data:', e);
                }
            } else if (name === 'settings') {
                try {
                    const newSettings = JSON.parse(newValue);
                    Object.assign(this.settings, newSettings);
                    this.updateStyles();
                } catch (e) {
                    console.error('Error parsing settings:', e);
                }
            }
        }
    }

    render() {
        this.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }
                
                .gallery-container {
                    padding: 20px;
                }
                
                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                    margin-bottom: 32px;
                }
                
                .product-card {
                    background: var(--primary-bg);
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                }
                
                .product-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
                }
                
                .product-image-container {
                    position: relative;
                    width: 100%;
                    padding-top: 100%;
                    overflow: hidden;
                    background: #f5f5f5;
                }
                
                .product-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }
                
                .product-card:hover .product-image {
                    transform: scale(1.05);
                }
                
                .product-ribbon {
                    position: absolute;
                    top: 12px;
                    right: -28px;
                    background: #ff6b6b;
                    color: white;
                    padding: 6px 32px;
                    font-weight: 700;
                    font-size: 11px;
                    text-transform: uppercase;
                    transform: rotate(45deg);
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    z-index: 10;
                }
                
                .product-content {
                    padding: 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                
                .product-name {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    line-height: 1.3;
                    color: var(--title-color);
                }
                
                .product-description {
                    font-size: 13px;
                    line-height: 1.5;
                    opacity: 0.7;
                    margin-bottom: 12px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    flex: 1;
                }
                
                .product-price-section {
                    margin-bottom: 16px;
                }
                
                .product-price {
                    font-size: 22px;
                    font-weight: 800;
                    color: var(--secondary-bg);
                }
                
                .product-compare-price {
                    font-size: 16px;
                    color: #999;
                    text-decoration: line-through;
                    margin-left: 8px;
                }
                
                .view-product-button {
                    width: 100%;
                    padding: 14px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: var(--secondary-bg);
                    color: white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    text-decoration: none;
                    display: inline-block;
                    text-align: center;
                }
                
                .view-product-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
                }
                
                .load-more-container {
                    text-align: center;
                    padding: 20px;
                }
                
                .load-more-button {
                    padding: 16px 48px;
                    border: 2px solid var(--secondary-bg);
                    background: white;
                    color: var(--secondary-bg);
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .load-more-button:hover {
                    background: var(--secondary-bg);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #999;
                    font-size: 16px;
                }
                
                @media (max-width: 768px) {
                    .products-grid {
                        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                        gap: 16px;
                    }
                    
                    .product-content {
                        padding: 16px;
                    }
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

        // Render product cards
        grid.innerHTML = this.products.map(product => this.renderProductCard(product)).join('');

        // Render load more button
        if (this.hasMore) {
            loadMoreContainer.innerHTML = `
                <button class="load-more-button" id="loadMoreBtn">
                    ${this.settings.buttonText}
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

    renderProductCard(product) {
        const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        
        return `
            <div class="product-card">
                ${product.ribbon ? `<div class="product-ribbon">${product.ribbon}</div>` : ''}
                
                <div class="product-image-container">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/400'}" 
                         alt="${product.name}" 
                         class="product-image">
                </div>
                
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    ${product.description ? `<p class="product-description">${product.description}</p>` : ''}
                    
                    <div class="product-price-section">
                        <span class="product-price">${product.price}</span>
                        ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : ''}
                    </div>
                    
                    <a href="${product.productUrl}" class="view-product-button">
                        View Product
                    </a>
                </div>
            </div>
        `;
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
        if (!container) return;

        container.style.setProperty('--primary-bg', this.settings.primaryBg);
        container.style.setProperty('--secondary-bg', this.settings.secondaryBg);
        container.style.setProperty('--border-color', this.settings.borderColor);
        container.style.setProperty('--title-color', this.settings.titleColor);

        // Apply border and corner radius to all cards
        this.querySelectorAll('.product-card').forEach(card => {
            card.style.border = `${this.settings.borderWidth}px solid ${this.settings.borderColor}`;
            card.style.borderRadius = `${this.settings.cornerRadius}px`;
        });
    }
}

customElements.define('product-gallery', ProductGalleryElement);
