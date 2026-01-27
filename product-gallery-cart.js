class ProductGalleryCartElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.version = 'V1_CATALOG';
        this.settings = {
            primaryBg: '#ffffff',
            secondaryBg: '#00d4ff',
            borderColor: '#e0e0e0',
            titleColor: '#333333',
            borderWidth: 1,
            cornerRadius: 16,
            buttonText: 'Load More Products'
        };
        this.isRendered = false;
        this.pendingProductsData = null;
        this.selections = {};
    }

    connectedCallback() {
        console.log('Custom element connected');
        this.render();
        this.isRendered = true;
        
        if (this.pendingProductsData) {
            console.log('Rendering pending products data');
            this.products = this.pendingProductsData.products || [];
            this.hasMore = this.pendingProductsData.hasMore || false;
            this.version = this.pendingProductsData.version || 'V1_CATALOG';
            this.pendingProductsData = null;
            this.renderProducts();
        }
    }

    static get observedAttributes() {
        return ['products-data', 'settings', 'cart-result'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (newValue && newValue !== oldValue) {
            if (name === 'products-data') {
                console.log('Products data attribute changed');
                try {
                    const data = JSON.parse(newValue);
                    console.log('Parsed products data:', data.products.length, 'products');
                    
                    if (!this.isRendered) {
                        console.log('Element not rendered yet, storing data');
                        this.pendingProductsData = data;
                        return;
                    }
                    
                    this.products = data.products || [];
                    this.hasMore = data.hasMore || false;
                    this.version = data.version || 'V1_CATALOG';
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
            } else if (name === 'cart-result') {
                try {
                    const result = JSON.parse(newValue);
                    this.showMessage(result.success, result.message);
                } catch (e) {
                    console.error('Error parsing cart result:', e);
                }
            }
        }
    }

    render() {
        this.innerHTML = `
            <style>
                * { box-sizing: border-box; }
                :host { display: block; width: 100%; }
                
                .gallery-container { padding: 20px; max-width: 1400px; margin: 0 auto; }
                .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; margin-bottom: 40px; }
                
                .product-card { background: var(--primary-bg); overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); transition: transform 0.3s ease, box-shadow 0.3s ease; display: flex; flex-direction: column; height: 100%; }
                .product-card:hover { transform: translateY(-8px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15); }
                
                .product-image-container { position: relative; width: 100%; height: 300px; overflow: hidden; background: #f8f8f8; flex-shrink: 0; }
                .product-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
                .product-card:hover .product-image { transform: scale(1.08); }
                .product-ribbon { position: absolute; top: 16px; left: 0; background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%); color: white; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2); z-index: 10; }
                
                .product-content { padding: 24px; flex: 1; display: flex; flex-direction: column; }
                .product-name { font-size: 18px; font-weight: 700; margin: 0 0 12px 0; line-height: 1.4; color: var(--title-color); height: 50px; overflow: hidden; }
                .product-description { font-size: 14px; line-height: 1.6; color: #666; margin: 0 0 16px 0; height: 44px; overflow: hidden; }
                
                .product-options { margin: 0 0 12px; }
                .option-group { margin-bottom: 12px; }
                .option-label { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; display: block; }
                .option-select { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background: white; cursor: pointer; }
                .option-select:focus { border-color: var(--secondary-bg); outline: none; }
                
                .quantity-control { display: flex; align-items: center; margin: 12px 0; gap: 10px; }
                .quantity-input { width: 70px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; text-align: center; }
                
                .product-price-section { margin: auto 0 20px 0; padding-top: 12px; border-top: 1px solid #eee; }
                .product-price { font-size: 24px; font-weight: 800; color: var(--secondary-bg); display: inline-block; }
                
                .product-buttons { display: flex; gap: 8px; }
                .add-to-cart-button { flex: 1; padding: 16px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.3s ease; background: var(--secondary-bg); color: white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
                .add-to-cart-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); filter: brightness(1.1); }
                .add-to-cart-button:disabled { opacity: 0.5; cursor: not-allowed; }
                .view-product-link { padding: 16px 20px; border: 2px solid var(--secondary-bg); border-radius: 8px; font-size: 14px; font-weight: 700; text-transform: uppercase; background: white; color: var(--secondary-bg); text-decoration: none; text-align: center; }
                
                .load-more-container { text-align: center; padding: 30px 0; }
                .load-more-button { padding: 18px 60px; border: 3px solid var(--secondary-bg); background: white; color: var(--secondary-bg); border-radius: 50px; font-size: 16px; font-weight: 700; cursor: pointer; text-transform: uppercase; }
                .load-more-button:hover { background: var(--secondary-bg); color: white; }
                
                .cart-message { position: fixed; top: 20px; right: 20px; padding: 16px 24px; border-radius: 8px; font-weight: 600; z-index: 9999; opacity: 0; transition: opacity 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .cart-message.show { opacity: 1; }
                .cart-message.success { background: #4caf50; color: white; }
                .cart-message.error { background: #f44336; color: white; }
                
                .empty-state { text-align: center; padding: 80px 20px; color: #999; font-size: 18px; }
            </style>
            
            <div class="gallery-container">
                <div class="products-grid"></div>
                <div class="load-more-container"></div>
            </div>
            <div class="cart-message" id="cartMessage"></div>
        `;
        
        console.log('DOM rendered');
    }

    renderProducts() {
        console.log('Rendering products, count:', this.products.length);
        
        const grid = this.querySelector('.products-grid');
        const loadMoreContainer = this.querySelector('.load-more-container');

        if (!grid || !loadMoreContainer) {
            console.error('Grid or container not found');
            return;
        }

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No products found</div>';
            loadMoreContainer.innerHTML = '';
            return;
        }

        grid.innerHTML = this.products.map((p, i) => this.renderProductCard(p, i)).join('');
        
        if (this.hasMore) {
            loadMoreContainer.innerHTML = `<button class="load-more-button">${this.settings.buttonText}</button>`;
            const btn = this.querySelector('.load-more-button');
            if (btn) {
                btn.addEventListener('click', () => {
                    this.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
                });
            }
        } else {
            loadMoreContainer.innerHTML = '';
        }

        this.attachEvents();
        this.updateStyles();
        console.log('Products rendered successfully');
    }

    renderProductCard(product, index) {
        const hasOptions = product.options && product.options.length > 0;
        
        let optionsHTML = '';
        if (hasOptions) {
            optionsHTML = '<div class="product-options">';
            product.options.forEach(opt => {
                optionsHTML += `
                    <div class="option-group">
                        <label class="option-label">${opt.name}</label>
                        <select class="option-select" data-index="${index}" data-option="${opt.id}">
                            <option value="">Select ${opt.name}</option>
                            ${opt.choices.map(ch => `<option value="${ch.id}">${ch.value}</option>`).join('')}
                        </select>
                    </div>
                `;
            });
            optionsHTML += `
                <div class="quantity-control">
                    <label>Quantity:</label>
                    <input type="number" class="quantity-input" value="1" min="1" data-index="${index}">
                </div>
            `;
            optionsHTML += '</div>';
        }
        
        return `
            <div class="product-card">
                ${product.ribbon ? `<div class="product-ribbon">${product.ribbon}</div>` : ''}
                <div class="product-image-container">
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/400'">
                </div>
                <div class="product-content">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    ${optionsHTML}
                    <div class="product-price-section">
                        <span class="product-price" data-index="${index}">${product.price}</span>
                    </div>
                    <div class="product-buttons">
                        <button class="add-to-cart-button" data-index="${index}">Add to Cart</button>
                        <a href="${product.productUrl}" class="view-product-link">View</a>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        this.querySelectorAll('.option-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const optId = e.target.dataset.option;
                
                if (!this.selections[idx]) this.selections[idx] = {};
                this.selections[idx][optId] = e.target.value;
                
                this.updatePrice(idx);
            });
        });

        this.querySelectorAll('.add-to-cart-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(e.target.dataset.index);
                this.addToCart(idx);
            });
        });
    }

    updatePrice(index) {
        const product = this.products[index];
        if (!product.variants || product.variants.length === 0) return;

        const selected = this.selections[index] || {};
        const variant = product.variants.find(v => {
            return Object.keys(selected).every(optId => v.choices[optId] === selected[optId]);
        });

        if (variant && variant.price) {
            const priceEl = this.querySelector(`.product-price[data-index="${index}"]`);
            if (priceEl) priceEl.textContent = variant.price;
        }
    }

    addToCart(index) {
        const product = this.products[index];
        const qtyInput = this.querySelector(`.quantity-input[data-index="${index}"]`);
        const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

        if (product.options && product.options.length > 0) {
            const selected = this.selections[index] || {};
            const allSelected = product.options.every(opt => selected[opt.id]);
            
            if (!allSelected) {
                this.showMessage(false, 'Please select all options');
                return;
            }
        }

        let variantId = null;
        let selectedOptions = {};

        if (product.variants && product.variants.length > 0) {
            const selected = this.selections[index] || {};
            const variant = product.variants.find(v => {
                return Object.keys(selected).every(optId => v.choices[optId] === selected[optId]);
            });

            if (variant) {
                variantId = variant.id;
            } else if (product.variants.length === 1) {
                variantId = product.variants[0].id;
            }
        }

        const cartData = {
            productId: product.id,
            variantId: variantId,
            quantity: quantity,
            manageVariants: product.manageVariants,
            selectedOptions: this.selections[index] || {}
        };

        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: cartData
        }));
    }

    showMessage(success, text) {
        const msg = this.querySelector('#cartMessage');
        msg.textContent = text;
        msg.className = `cart-message ${success ? 'success' : 'error'} show`;
        setTimeout(() => msg.classList.remove('show'), 3000);
    }

    updateStyles() {
        const container = this.querySelector('.gallery-container');
        if (!container) return;

        container.style.setProperty('--primary-bg', this.settings.primaryBg);
        container.style.setProperty('--secondary-bg', this.settings.secondaryBg);
        container.style.setProperty('--border-color', this.settings.borderColor);
        container.style.setProperty('--title-color', this.settings.titleColor);

        this.querySelectorAll('.product-card').forEach(card => {
            card.style.border = `${this.settings.borderWidth}px solid ${this.settings.borderColor}`;
            card.style.borderRadius = `${this.settings.cornerRadius}px`;
        });
    }
}

customElements.define('product-gallery-cart', ProductGalleryCartElement);
