class ProductGalleryCart extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.version = 'V1_CATALOG';
        this.selections = {};
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['products-data', 'settings', 'cart-result'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || newValue === oldValue) return;

        try {
            const data = JSON.parse(newValue);
            
            if (name === 'products-data') {
                this.products = data.products || [];
                this.hasMore = data.hasMore || false;
                this.version = data.version || 'V1_CATALOG';
                this.renderProducts();
            } else if (name === 'settings') {
                this.settings = data;
                this.updateStyles();
            } else if (name === 'cart-result') {
                this.showMessage(data.success, data.message);
            }
        } catch (e) {
            console.error('Parse error:', e);
        }
    }

    render() {
        this.innerHTML = `
            <style>
                :host { display: block; width: 100%; }
                * { box-sizing: border-box; }
                
                .container { padding: 20px; max-width: 1400px; margin: 0 auto; }
                .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; margin-bottom: 40px; }
                
                .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.3s; }
                .card:hover { transform: translateY(-8px); box-shadow: 0 12px 24px rgba(0,0,0,0.15); }
                
                .image-container { position: relative; height: 300px; background: #f8f8f8; overflow: hidden; }
                .image { width: 100%; height: 100%; object-fit: cover; }
                .ribbon { position: absolute; top: 16px; left: 0; background: #ff5252; color: white; padding: 8px 16px; font-weight: 700; font-size: 12px; text-transform: uppercase; }
                
                .content { padding: 24px; }
                .name { font-size: 18px; font-weight: 700; margin: 0 0 12px; height: 50px; overflow: hidden; }
                .description { font-size: 14px; color: #666; margin: 0 0 16px; height: 44px; overflow: hidden; }
                
                .options { margin: 0 0 12px; }
                .option-group { margin-bottom: 12px; }
                .option-label { font-size: 13px; font-weight: 600; display: block; margin-bottom: 6px; }
                .option-select { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
                .option-select:focus { border-color: #00d4ff; outline: none; }
                
                .quantity { margin: 12px 0; display: flex; align-items: center; gap: 10px; }
                .quantity-input { width: 70px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; text-align: center; }
                
                .price-section { margin: auto 0 20px; padding-top: 12px; border-top: 1px solid #eee; }
                .price { font-size: 24px; font-weight: 800; color: #00d4ff; }
                
                .buttons { display: flex; gap: 8px; }
                .btn-cart { flex: 1; padding: 16px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; text-transform: uppercase; cursor: pointer; background: #00d4ff; color: white; transition: all 0.3s; }
                .btn-cart:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); }
                .btn-cart:disabled { opacity: 0.5; cursor: not-allowed; }
                .btn-view { padding: 16px; border: 2px solid #00d4ff; border-radius: 8px; font-size: 14px; font-weight: 700; text-transform: uppercase; background: white; color: #00d4ff; text-decoration: none; text-align: center; }
                
                .load-more-container { text-align: center; padding: 30px 0; }
                .load-more { padding: 18px 60px; border: 3px solid #00d4ff; background: white; color: #00d4ff; border-radius: 50px; font-size: 16px; font-weight: 700; cursor: pointer; text-transform: uppercase; }
                .load-more:hover { background: #00d4ff; color: white; }
                
                .message { position: fixed; top: 20px; right: 20px; padding: 16px 24px; border-radius: 8px; font-weight: 600; z-index: 9999; opacity: 0; transition: opacity 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .message.show { opacity: 1; }
                .message.success { background: #4caf50; color: white; }
                .message.error { background: #f44336; color: white; }
                
                .empty { text-align: center; padding: 80px 20px; color: #999; font-size: 18px; }
            </style>
            
            <div class="container">
                <div class="grid"></div>
                <div class="load-more-container"></div>
            </div>
            <div class="message" id="msg"></div>
        `;
    }

    renderProducts() {
        const grid = this.querySelector('.grid');
        const loadMore = this.querySelector('.load-more-container');

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty">No products found</div>';
            loadMore.innerHTML = '';
            return;
        }

        grid.innerHTML = this.products.map((p, i) => `
            <div class="card">
                ${p.ribbon ? `<div class="ribbon">${p.ribbon}</div>` : ''}
                
                <div class="image-container">
                    <img src="${p.imageUrl}" alt="${p.name}" class="image" onerror="this.src='https://via.placeholder.com/400'">
                </div>
                
                <div class="content">
                    <h3 class="name">${p.name}</h3>
                    <p class="description">${p.description}</p>
                    
                    ${this.renderOptions(p, i)}
                    
                    <div class="price-section">
                        <div class="price" data-index="${i}">${p.price}</div>
                    </div>
                    
                    <div class="buttons">
                        <button class="btn-cart" data-index="${i}">Add to Cart</button>
                        <a href="${p.productUrl}" class="btn-view">View</a>
                    </div>
                </div>
            </div>
        `).join('');

        loadMore.innerHTML = this.hasMore ? 
            `<button class="load-more">Load More</button>` : '';

        this.attachEvents();
    }

    renderOptions(product, index) {
        if (!product.options || product.options.length === 0) return '';

        let html = '<div class="options">';
        
        product.options.forEach(opt => {
            html += `
                <div class="option-group">
                    <label class="option-label">${opt.name}</label>
                    <select class="option-select" data-index="${index}" data-option="${opt.id}">
                        <option value="">Select ${opt.name}</option>
                        ${opt.choices.map(ch => `<option value="${ch.id}">${ch.value}</option>`).join('')}
                    </select>
                </div>
            `;
        });

        html += `
            <div class="quantity">
                <label>Quantity:</label>
                <input type="number" class="quantity-input" value="1" min="1" data-index="${index}">
            </div>
        `;
        
        html += '</div>';
        return html;
    }

    attachEvents() {
        // Option selects
        this.querySelectorAll('.option-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index);
                const optId = e.target.dataset.option;
                
                if (!this.selections[idx]) this.selections[idx] = {};
                this.selections[idx][optId] = e.target.value;
                
                this.updatePrice(idx);
            });
        });

        // Add to cart buttons
        this.querySelectorAll('.btn-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const idx = parseInt(e.target.dataset.index);
                this.addToCart(idx);
            });
        });

        // Load more
        const loadBtn = this.querySelector('.load-more');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
            });
        }
    }

    updatePrice(index) {
        const product = this.products[index];
        if (!product.variants || product.variants.length === 0) return;

        const selected = this.selections[index] || {};
        
        // Find matching variant
        const variant = product.variants.find(v => {
            return Object.keys(selected).every(optId => 
                v.choices[optId] === selected[optId]
            );
        });

        if (variant && variant.price) {
            const priceEl = this.querySelector(`.price[data-index="${index}"]`);
            if (priceEl) priceEl.textContent = variant.price;
        }
    }

    addToCart(index) {
        const product = this.products[index];
        const qtyInput = this.querySelector(`.quantity-input[data-index="${index}"]`);
        const quantity = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

        // Check if all options selected
        if (product.options && product.options.length > 0) {
            const selected = this.selections[index] || {};
            const allSelected = product.options.every(opt => selected[opt.id]);
            
            if (!allSelected) {
                this.showMessage(false, 'Please select all options');
                return;
            }
        }

        // Find variant
        let variantId = null;
        let selectedOptions = {};

        if (product.variants && product.variants.length > 0) {
            const selected = this.selections[index] || {};
            const variant = product.variants.find(v => {
                return Object.keys(selected).every(optId => 
                    v.choices[optId] === selected[optId]
                );
            });

            if (variant) {
                variantId = variant.id;
            } else if (product.variants.length === 1) {
                variantId = product.variants[0].id;
            } else {
                this.showMessage(false, 'Variant not found');
                return;
            }
        }

        // Build cart data
        const cartData = {
            productId: product.id,
            variantId: variantId,
            quantity: quantity
        };

        if (this.version === 'V1_CATALOG') {
            cartData.manageVariants = product.manageVariants || false;
            if (!cartData.manageVariants) {
                cartData.selectedOptions = this.selections[index] || {};
            }
        }

        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true,
            composed: true,
            detail: cartData
        }));
    }

    showMessage(success, text) {
        const msg = this.querySelector('#msg');
        msg.textContent = text;
        msg.className = `message ${success ? 'success' : 'error'} show`;
        setTimeout(() => msg.classList.remove('show'), 3000);
    }

    updateStyles() {
        if (!this.settings) return;
        const cards = this.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.border = `${this.settings.borderWidth}px solid ${this.settings.borderColor}`;
            card.style.borderRadius = `${this.settings.cornerRadius}px`;
        });
    }
}

customElements.define('product-gallery-cart', ProductGalleryCart);
