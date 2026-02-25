class ProductGalleryElement extends HTMLElement {
    constructor() {
        super();
        this.products = [];
        this.hasMore = false;
        this.settings = {
            cardBgColor: '#ffffff', cardHoverBgColor: '#f8f9fa',
            headingColor: '#1a1a1a', textColor: '#666666',
            fontFamily: 'Arial', headingSize: 18, textSize: 14,
            priceColor: '#2c3e50', comparePriceColor: '#999999', priceSize: 24,
            primaryAccent: '#3498db', secondaryAccent: '#2ecc71',
            ribbonBgColor: '#e74c3c', ribbonTextColor: '#ffffff',
            borderColor: '#e0e0e0', borderWidth: 1, cornerRadius: 12,
            cardPadding: 20, cardGap: 24,
            buttonText: 'View Product', buttonBgColor: '#3498db',
            buttonTextColor: '#ffffff', buttonHoverBgColor: '#2980b9',
            buttonStyle: 'filled', buttonSize: 'medium',
            imageHeight: 280, imageZoom: true, imageBorderRadius: 8,
            cardShadow: 'medium', hoverEffect: 'lift',
            columnsDesktop: 3, columnsTablet: 2, columnsMobile: 1,
            loadMoreText: 'Load More Products', loadMoreBgColor: '#ffffff',
            loadMoreTextColor: '#3498db', loadMoreBorderColor: '#3498db'
        };
        this.isRendered = false;
        this.pendingProductsData = null;
        this.variantCache = {};
        this.selectedChoices = {};
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
        if (!newValue || newValue === oldValue) return;
        try {
            const data = JSON.parse(newValue);
            if (name === 'products-data') {
                if (!this.isRendered) { this.pendingProductsData = data; return; }
                this.products = data.products || [];
                this.hasMore = data.hasMore || false;
                this.renderProducts();
            } else if (name === 'settings') {
                Object.assign(this.settings, data);
                if (this.isRendered) this.updateStyles();
            } else if (name === 'variant-data') {
                this.onVariantDataReceived(data);
            } else if (name === 'cart-status') {
                this.onCartStatus(data);
            }
        } catch (e) { /* parse error */ }
    }

    // ========== VARIANT DATA RECEIVED ==========
    onVariantDataReceived(data) {
        const pid = data.productId;
        if (!pid) return;
        this.variantCache[pid] = data;
        this.selectedChoices[pid] = {};

        // Reset add-to-cart button
        const btn = this.querySelector('[data-cart-btn="' + pid + '"]');
        if (btn) { btn.textContent = 'Add to Cart'; btn.disabled = false; }

        if (!data.hasOptions || !data.options || data.options.length === 0) {
            // No options - add directly with default variant
            this.dispatchEvent(new CustomEvent('add-to-cart', {
                bubbles: true, composed: true,
                detail: {
                    productId: pid,
                    variantId: data.defaultVariantId || null,
                    quantity: 1,
                    selectedChoices: null,
                    manageVariants: data.manageVariants || false,
                    catalogVersion: data.version || 'V1_CATALOG'
                }
            }));
            return;
        }

        this.showVariantModal(pid);
    }

    // ========== CART STATUS ==========
    onCartStatus(data) {
        const pid = data.productId;
        const btn = this.querySelector('[data-cart-btn="' + pid + '"]');
        const modalBtn = this.querySelector('.modal-add-btn');

        if (data.status === 'loading') {
            if (btn) { btn.textContent = 'Adding...'; btn.disabled = true; }
            if (modalBtn) { modalBtn.textContent = 'Adding...'; modalBtn.disabled = true; }
        } else if (data.status === 'success') {
            if (btn) { btn.textContent = 'Added ✓'; btn.disabled = false; }
            if (modalBtn) { modalBtn.textContent = 'Added ✓'; }
            this.closeVariantModal();
            setTimeout(() => {
                if (btn) btn.textContent = 'Add to Cart';
            }, 2500);
        } else if (data.status === 'error') {
            if (btn) { btn.textContent = 'Add to Cart'; btn.disabled = false; }
            if (modalBtn) { modalBtn.textContent = 'Add to Cart'; modalBtn.disabled = false; }
            const errEl = this.querySelector('.modal-error');
            if (errEl) errEl.textContent = data.message || 'Error adding to cart';
        }
    }

    // ========== VARIANT MODAL ==========
    showVariantModal(pid) {
        this.closeVariantModal();
        const data = this.variantCache[pid];
        if (!data) return;
        const product = this.products.find(p => p.id === pid);

        let optionsHtml = '';
        data.options.forEach(function(opt) {
            if (opt.type === 'color') {
                const swatches = opt.choices.map(function(c) {
                    return '<div class="color-swatch" data-opt="' + opt.id + '" data-cid="' + c.id + '" data-cval="' + c.value + '" title="' + (c.description || c.value) + '" style="background:' + (c.color || c.value) + ';"></div>';
                }).join('');
                optionsHtml += '<div class="option-group"><label class="option-label">' + opt.name + '</label><div class="color-swatches">' + swatches + '</div></div>';
            } else {
                const btns = opt.choices.map(function(c) {
                    return '<div class="choice-btn" data-opt="' + opt.id + '" data-cid="' + c.id + '" data-cval="' + c.value + '">' + (c.description || c.value) + '</div>';
                }).join('');
                optionsHtml += '<div class="option-group"><label class="option-label">' + opt.name + '</label><div class="choice-buttons">' + btns + '</div></div>';
            }
        });

        var overlay = document.createElement('div');
        overlay.className = 'variant-overlay';
        overlay.innerHTML =
            '<div class="variant-modal">' +
                '<button class="modal-close">&times;</button>' +
                '<div class="modal-product-info">' +
                    (product ? '<img src="' + product.imageUrl + '" class="modal-product-img" alt="' + product.name + '">' : '') +
                    '<div>' +
                        '<div class="modal-product-name">' + (product ? product.name : '') + '</div>' +
                        '<div class="modal-product-price">' + (product ? product.price : '') + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-options">' + optionsHtml + '</div>' +
                '<div class="modal-error"></div>' +
                '<div class="modal-actions">' +
                    '<div class="quantity-selector">' +
                        '<button class="qty-btn qty-minus">-</button>' +
                        '<span class="qty-value">1</span>' +
                        '<button class="qty-btn qty-plus">+</button>' +
                    '</div>' +
                    '<button class="modal-add-btn" disabled>Select Options</button>' +
                '</div>' +
            '</div>';

        this.appendChild(overlay);

        var self = this;
        var quantity = 1;
        var qtyValue = overlay.querySelector('.qty-value');
        var addBtn = overlay.querySelector('.modal-add-btn');

        overlay.addEventListener('click', function(e) { if (e.target === overlay) self.closeVariantModal(); });
        overlay.querySelector('.modal-close').addEventListener('click', function() { self.closeVariantModal(); });

        overlay.querySelector('.qty-minus').addEventListener('click', function() {
            if (quantity > 1) { quantity--; qtyValue.textContent = quantity; }
        });
        overlay.querySelector('.qty-plus').addEventListener('click', function() {
            if (quantity < 99) { quantity++; qtyValue.textContent = quantity; }
        });

        var allClickables = overlay.querySelectorAll('.color-swatch, .choice-btn');
        for (var i = 0; i < allClickables.length; i++) {
            allClickables[i].addEventListener('click', function() {
                var optId = this.getAttribute('data-opt');
                var choiceId = this.getAttribute('data-cid');
                var choiceValue = this.getAttribute('data-cval');

                self.selectedChoices[pid] = self.selectedChoices[pid] || {};
                self.selectedChoices[pid][optId] = { id: choiceId, value: choiceValue };

                var siblings = this.parentElement.querySelectorAll('.color-swatch, .choice-btn');
                for (var j = 0; j < siblings.length; j++) siblings[j].classList.remove('selected');
                this.classList.add('selected');

                var allSelected = data.options.every(function(opt) {
                    return self.selectedChoices[pid] && self.selectedChoices[pid][opt.id];
                });

                if (allSelected) {
                    addBtn.disabled = false;
                    addBtn.textContent = 'Add to Cart';
                    var matched = self.findMatchingVariant(pid, data);
                    if (matched && matched.price) {
                        var priceEl = overlay.querySelector('.modal-product-price');
                        if (priceEl) priceEl.textContent = matched.price;
                    }
                }
                overlay.querySelector('.modal-error').textContent = '';
            });
        }

        addBtn.addEventListener('click', function() {
            if (addBtn.disabled) return;
            var matched = self.findMatchingVariant(pid, data);
            var choicesObj = {};
            var selectedKeys = Object.keys(self.selectedChoices[pid] || {});
            for (var k = 0; k < selectedKeys.length; k++) {
                var optId = selectedKeys[k];
                var opt = null;
                for (var m = 0; m < data.options.length; m++) {
                    if (data.options[m].id === optId) { opt = data.options[m]; break; }
                }
                if (opt) {
                    choicesObj[opt.name || optId] = self.selectedChoices[pid][optId].value;
                }
            }

            self.dispatchEvent(new CustomEvent('add-to-cart', {
                bubbles: true, composed: true,
                detail: {
                    productId: pid,
                    variantId: matched ? matched.id : null,
                    quantity: quantity,
                    selectedChoices: choicesObj,
                    manageVariants: data.manageVariants || false,
                    catalogVersion: data.version || 'V1_CATALOG'
                }
            }));
        });
    }

    findMatchingVariant(pid, data) {
        var selected = this.selectedChoices[pid] || {};
        for (var i = 0; i < data.variants.length; i++) {
            var v = data.variants[i];
            var match = true;
            for (var j = 0; j < data.options.length; j++) {
                var opt = data.options[j];
                var sel = selected[opt.id];
                if (!sel) { match = false; break; }
                var variantChoice = v.choices[opt.id];
                if (variantChoice !== sel.id && variantChoice !== sel.value) { match = false; break; }
            }
            if (match) return v;
        }
        return null;
    }

    closeVariantModal() {
        var overlay = this.querySelector('.variant-overlay');
        if (overlay) overlay.remove();
    }

    // ========== CSS HELPERS ==========
    getShadowCSS() {
        var shadows = { none: 'none', small: '0 1px 3px rgba(0,0,0,0.08)', medium: '0 4px 12px rgba(0,0,0,0.12)', large: '0 8px 24px rgba(0,0,0,0.16)' };
        return shadows[this.settings.cardShadow] || shadows.medium;
    }
    getHoverEffectCSS() {
        var effects = {
            lift: 'transform: translateY(-8px); box-shadow: 0 12px 28px rgba(0,0,0,0.18);',
            glow: 'box-shadow: 0 0 20px ' + this.settings.primaryAccent + '66;',
            zoom: 'transform: scale(1.02);', none: ''
        };
        return effects[this.settings.hoverEffect] || effects.lift;
    }
    getButtonCSS() {
        var sizes = { small: 'padding:10px 20px;font-size:12px;', medium: 'padding:14px 28px;font-size:14px;', large: 'padding:18px 36px;font-size:16px;' };
        var styles = {
            filled: 'background:var(--button-bg);color:var(--button-text);border:none;',
            outlined: 'background:transparent;color:var(--button-bg);border:2px solid var(--button-bg);',
            text: 'background:transparent;color:var(--button-bg);border:none;'
        };
        return (sizes[this.settings.buttonSize] || sizes.medium) + (styles[this.settings.buttonStyle] || styles.filled);
    }

    // ========== RENDER ==========
    render() {
        this.innerHTML = '<style>' +
            '*{box-sizing:border-box}:host{display:block;width:100%}' +
            '.gallery-container{padding:20px;max-width:1400px;margin:0 auto;font-family:var(--font-family)}' +
            '.products-grid{display:grid;grid-template-columns:repeat(var(--columns-desktop),1fr);gap:var(--card-gap);margin-bottom:40px}' +
            '.product-card{background:var(--card-bg);overflow:hidden;box-shadow:var(--card-shadow);transition:all .3s cubic-bezier(.4,0,.2,1);position:relative;display:flex;flex-direction:column;height:100%;border:var(--border-width) solid var(--border-color);border-radius:var(--corner-radius)}' +
            '.product-card:hover{background:var(--card-hover-bg);' + this.getHoverEffectCSS() + '}' +
            '.product-image-container{position:relative;width:100%;height:var(--image-height);overflow:hidden;background:#f5f5f5;flex-shrink:0;border-radius:var(--image-border-radius)}' +
            '.product-image{width:100%;height:100%;object-fit:cover;object-position:center;transition:transform .4s cubic-bezier(.4,0,.2,1)}' +
            '.product-card:hover .product-image{transform:' + (this.settings.imageZoom ? 'scale(1.1)' : 'scale(1)') + '}' +
            '.product-ribbon{position:absolute;top:12px;left:0;background:var(--ribbon-bg);color:var(--ribbon-text);padding:6px 16px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.8px;box-shadow:2px 2px 8px rgba(0,0,0,.2);z-index:10;border-radius:0 4px 4px 0}' +
            '.product-content{padding:var(--card-padding);flex:1;display:flex;flex-direction:column}' +
            '.product-name{font-size:var(--heading-size);font-weight:700;margin:0 0 12px;line-height:1.3;color:var(--heading-color);height:calc(var(--heading-size)*2.6);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}' +
            '.product-description{font-size:var(--text-size);line-height:1.6;color:var(--text-color);margin:0 0 16px;height:calc(var(--text-size)*3.2);overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}' +
            '.product-price-section{margin:auto 0 16px;padding-top:16px;border-top:1px solid var(--border-color);display:flex;align-items:center;gap:10px}' +
            '.product-price{font-size:var(--price-size);font-weight:800;color:var(--price-color)}' +
            '.product-compare-price{font-size:calc(var(--price-size)*.65);color:var(--compare-price-color);text-decoration:line-through}' +
            '.card-buttons{display:flex;gap:8px}' +
            '.card-buttons a,.card-buttons button{flex:1;display:block;margin:0;border-radius:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;cursor:pointer;transition:all .3s ease;text-decoration:none;text-align:center;font-family:var(--font-family);' + this.getButtonCSS() + '}' +
            '.card-buttons a:hover,.card-buttons button:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.15)}' +
            '.btn-view{background:var(--button-bg)!important;color:var(--button-text)!important;border:none!important}' +
            '.btn-view:hover{background:var(--button-hover-bg)!important}' +
            '.btn-cart{background:var(--primary-accent)!important;color:#fff!important;border:none!important}' +
            '.btn-cart:hover{opacity:.9}' +
            '.btn-cart:disabled{opacity:.6;cursor:wait}' +
            '.load-more-container{text-align:center;padding:30px 0}' +
            '.load-more-button{padding:16px 48px;border:3px solid var(--load-more-border);background:var(--load-more-bg);color:var(--load-more-text);border-radius:50px;font-size:15px;font-weight:700;cursor:pointer;transition:all .3s ease;text-transform:uppercase;letter-spacing:1.2px;font-family:var(--font-family)}' +
            '.load-more-button:hover{background:var(--load-more-text);color:var(--load-more-bg);transform:translateY(-3px);box-shadow:0 8px 20px rgba(0,0,0,.15)}' +
            '.empty-state{text-align:center;padding:80px 20px;color:var(--text-color);font-size:18px;font-family:var(--font-family)}' +

            '.variant-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px}' +
            '.variant-modal{background:#fff;border-radius:16px;padding:28px;max-width:440px;width:100%;max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:var(--font-family)}' +
            '.modal-close{position:absolute;top:12px;right:16px;background:none;border:none;font-size:28px;cursor:pointer;color:#999;line-height:1;padding:0}' +
            '.modal-close:hover{color:#333}' +
            '.modal-product-info{display:flex;gap:14px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #eee}' +
            '.modal-product-img{width:70px;height:70px;object-fit:cover;border-radius:8px}' +
            '.modal-product-name{font-weight:700;font-size:16px;color:#1a1a1a;margin-bottom:4px}' +
            '.modal-product-price{font-weight:800;font-size:18px;color:var(--price-color,#2c3e50)}' +
            '.option-group{margin-bottom:18px}' +
            '.option-label{display:block;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:#555;margin-bottom:8px}' +
            '.color-swatches{display:flex;flex-wrap:wrap;gap:8px}' +
            '.color-swatch{width:36px;height:36px;border-radius:50%;cursor:pointer;border:3px solid transparent;transition:all .2s ease;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}' +
            '.color-swatch:hover{transform:scale(1.15)}' +
            '.color-swatch.selected{border-color:var(--primary-accent,#3498db);box-shadow:0 0 0 2px var(--primary-accent,#3498db)}' +
            '.choice-buttons{display:flex;flex-wrap:wrap;gap:8px}' +
            '.choice-btn{padding:8px 18px;border:2px solid #ddd;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#444;transition:all .2s ease;background:#fff}' +
            '.choice-btn:hover{border-color:#aaa}' +
            '.choice-btn.selected{border-color:var(--primary-accent,#3498db);background:var(--primary-accent,#3498db);color:#fff}' +
            '.modal-error{color:#e74c3c;font-size:13px;min-height:18px;margin-bottom:8px}' +
            '.modal-actions{display:flex;gap:12px;align-items:center;margin-top:10px}' +
            '.quantity-selector{display:flex;align-items:center;border:2px solid #ddd;border-radius:8px;overflow:hidden}' +
            '.qty-btn{width:36px;height:36px;border:none;background:#f5f5f5;cursor:pointer;font-size:18px;font-weight:700;color:#333;transition:background .2s}' +
            '.qty-btn:hover{background:#e0e0e0}' +
            '.qty-value{width:40px;text-align:center;font-weight:700;font-size:15px}' +
            '.modal-add-btn{flex:1;padding:12px 20px;border:none;border-radius:8px;background:var(--primary-accent,#3498db);color:#fff;font-weight:700;font-size:14px;cursor:pointer;text-transform:uppercase;letter-spacing:.5px;transition:all .2s ease}' +
            '.modal-add-btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}' +
            '.modal-add-btn:disabled{background:#ccc;cursor:not-allowed}' +

            '@media(max-width:1024px){.products-grid{grid-template-columns:repeat(var(--columns-tablet),1fr)}}' +
            '@media(max-width:768px){.products-grid{grid-template-columns:repeat(var(--columns-mobile),1fr)}.product-name{font-size:calc(var(--heading-size)*.9)}.product-description{font-size:calc(var(--text-size)*.9)}.card-buttons{flex-direction:column}}' +
            '</style>' +
            '<div class="gallery-container"><div class="products-grid"></div><div class="load-more-container"></div></div>';
    }

    renderProducts() {
        var grid = this.querySelector('.products-grid');
        var loadMoreContainer = this.querySelector('.load-more-container');
        if (!grid || !loadMoreContainer) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty-state">No products found. Please select a category.</div>';
            loadMoreContainer.innerHTML = '';
            return;
        }

        grid.innerHTML = this.products.map(function(p) { return this.renderProductCard(p); }.bind(this)).join('');

        var self = this;
        var cartBtns = grid.querySelectorAll('.btn-cart');
        for (var i = 0; i < cartBtns.length; i++) {
            cartBtns[i].addEventListener('click', function(e) {
                e.preventDefault();
                var pid = this.getAttribute('data-product-id');
                this.textContent = 'Loading...';
                this.disabled = true;
                self.dispatchEvent(new CustomEvent('request-variants', {
                    bubbles: true, composed: true,
                    detail: { productId: pid }
                }));
            });
        }

        if (this.hasMore) {
            loadMoreContainer.innerHTML = '<button class="load-more-button">' + this.settings.loadMoreText + '</button>';
            loadMoreContainer.querySelector('.load-more-button').addEventListener('click', function() {
                self.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
            });
        } else {
            loadMoreContainer.innerHTML = '';
        }
        this.updateStyles();
    }

    renderProductCard(product) {
        var hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
        return '<div class="product-card">' +
            (product.ribbon ? '<div class="product-ribbon">' + product.ribbon + '</div>' : '') +
            '<div class="product-image-container">' +
                '<img src="' + product.imageUrl + '" alt="' + product.name + '" class="product-image" loading="lazy" onerror="this.src=\'https://via.placeholder.com/400\'">' +
            '</div>' +
            '<div class="product-content">' +
                '<h3 class="product-name">' + product.name + '</h3>' +
                '<p class="product-description">' + (product.description || '') + '</p>' +
                '<div class="product-price-section">' +
                    '<span class="product-price">' + product.price + '</span>' +
                    (hasComparePrice ? '<span class="product-compare-price">' + product.compareAtPrice + '</span>' : '') +
                '</div>' +
                '<div class="card-buttons">' +
                    '<a href="' + product.productUrl + '" class="btn-view">' + this.settings.buttonText + '</a>' +
                    '<button class="btn-cart" data-product-id="' + product.id + '" data-cart-btn="' + product.id + '">Add to Cart</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    updateStyles() {
        var c = this.querySelector('.gallery-container');
        if (!c) return;
        var s = this.settings;
        c.style.setProperty('--card-bg', s.cardBgColor);
        c.style.setProperty('--card-hover-bg', s.cardHoverBgColor);
        c.style.setProperty('--heading-color', s.headingColor);
        c.style.setProperty('--text-color', s.textColor);
        c.style.setProperty('--font-family', s.fontFamily);
        c.style.setProperty('--heading-size', s.headingSize + 'px');
        c.style.setProperty('--text-size', s.textSize + 'px');
        c.style.setProperty('--price-color', s.priceColor);
        c.style.setProperty('--compare-price-color', s.comparePriceColor);
        c.style.setProperty('--price-size', s.priceSize + 'px');
        c.style.setProperty('--border-color', s.borderColor);
        c.style.setProperty('--border-width', s.borderWidth + 'px');
        c.style.setProperty('--corner-radius', s.cornerRadius + 'px');
        c.style.setProperty('--card-padding', s.cardPadding + 'px');
        c.style.setProperty('--card-gap', s.cardGap + 'px');
        c.style.setProperty('--button-bg', s.buttonBgColor);
        c.style.setProperty('--button-text', s.buttonTextColor);
        c.style.setProperty('--button-hover-bg', s.buttonHoverBgColor);
        c.style.setProperty('--image-height', s.imageHeight + 'px');
        c.style.setProperty('--image-border-radius', s.imageBorderRadius + 'px');
        c.style.setProperty('--card-shadow', this.getShadowCSS());
        c.style.setProperty('--columns-desktop', s.columnsDesktop);
        c.style.setProperty('--columns-tablet', s.columnsTablet);
        c.style.setProperty('--columns-mobile', s.columnsMobile);
        c.style.setProperty('--ribbon-bg', s.ribbonBgColor);
        c.style.setProperty('--ribbon-text', s.ribbonTextColor);
        c.style.setProperty('--load-more-bg', s.loadMoreBgColor);
        c.style.setProperty('--load-more-text', s.loadMoreTextColor);
        c.style.setProperty('--load-more-border', s.loadMoreBorderColor);
        c.style.setProperty('--primary-accent', s.primaryAccent);
    }
}

customElements.define('product-gallery', ProductGalleryElement);
