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
        // Variant modal state
        this.variantModal = null;
        this.currentProductId = null;
        this.currentOptions = [];
        this.currentVariants = [];
        this.currentManageVariants = false;
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
        return ['products-data', 'settings', 'cart-status', 'variant-data'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!newValue || newValue === oldValue) return;
        try {
            var data = JSON.parse(newValue);
            if (name === 'products-data') {
                if (!this.isRendered) { this.pendingProductsData = data; return; }
                this.products = data.products || [];
                this.hasMore = data.hasMore || false;
                this.renderProducts();
            } else if (name === 'settings') {
                var keys = Object.keys(data);
                for (var i = 0; i < keys.length; i++) this.settings[keys[i]] = data[keys[i]];
                if (this.isRendered) this.updateStyles();
            } else if (name === 'cart-status') {
                this.onCartStatus(data);
            } else if (name === 'variant-data') {
                this.onVariantData(data);
            }
        } catch (e) {
            console.error('CE: Parse error for ' + name + ':', e);
        }
    }

    // ===== VARIANT DATA RECEIVED =====
    onVariantData(data) {
        console.log("CE: variant-data received, hasOptions:", data.hasOptions, "options:", (data.options || []).length, "variants:", (data.variants || []).length);

        if (!data.hasOptions) {
            // No options - add to cart directly
            console.log("CE: No options, dispatching add-to-cart");
            this.dispatchEvent(new CustomEvent('add-to-cart', {
                bubbles: true, composed: true,
                detail: { productId: data.productId, quantity: 1 }
            }));
            return;
        }

        // Show variant selection modal
        this.currentProductId = data.productId;
        this.currentOptions = data.options || [];
        this.currentVariants = data.variants || [];
        this.currentManageVariants = data.manageVariants || false;
        this.selectedChoices = {};
        this.showVariantModal();
    }

    // ===== VARIANT MODAL =====
    showVariantModal() {
        console.log("CE: showVariantModal called");
        this.removeVariantModal();

        var product = this.findProduct(this.currentProductId);
        var productName = product ? product.name : 'Select Options';

        var overlay = document.createElement('div');
        overlay.className = 'vm-overlay';
        overlay.innerHTML = this.buildModalHTML(productName);

        // Close on overlay click
        var self = this;
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) self.removeVariantModal();
        });

        this.appendChild(overlay);
        this.variantModal = overlay;

        // Setup event handlers
        this.setupModalEvents();
        this.updateModalPrice();

        console.log("CE: Modal displayed");
    }

    buildModalHTML(productName) {
        var html = '<div class="vm-modal">';
        html += '<div class="vm-header"><h3>' + this.esc(productName) + '</h3><button class="vm-close">&times;</button></div>';
        html += '<div class="vm-body">';

        // Render each option
        for (var i = 0; i < this.currentOptions.length; i++) {
            var opt = this.currentOptions[i];
            html += '<div class="vm-option" data-option="' + this.esc(opt.name) + '">';
            html += '<label>' + this.esc(opt.name) + '</label>';

            if (opt.type === 'color') {
                html += '<div class="vm-swatches">';
                for (var j = 0; j < opt.choices.length; j++) {
                    var c = opt.choices[j];
                    html += '<button class="vm-swatch' + (c.inStock ? '' : ' out-of-stock') + '" data-option="' + this.esc(opt.name) + '" data-value="' + this.esc(c.value) + '" data-desc="' + this.esc(c.description) + '" style="background-color:' + c.color + '" title="' + this.esc(c.description) + (c.inStock ? '' : ' (Out of Stock)') + '"></button>';
                }
                html += '</div>';
                html += '<span class="vm-swatch-label"></span>';
            } else {
                html += '<div class="vm-choices">';
                for (var j = 0; j < opt.choices.length; j++) {
                    var c = opt.choices[j];
                    html += '<button class="vm-choice-btn' + (c.inStock ? '' : ' out-of-stock') + '" data-option="' + this.esc(opt.name) + '" data-value="' + this.esc(c.value) + '">' + this.esc(c.description) + (c.inStock ? '' : ' <small>(Out of Stock)</small>') + '</button>';
                }
                html += '</div>';
            }
            html += '</div>';
        }

        // Price display
        html += '<div class="vm-price-row"><span class="vm-price"></span><span class="vm-compare-price"></span></div>';

        // Quantity
        html += '<div class="vm-qty-row"><label>Quantity:</label><div class="vm-qty-control"><button class="vm-qty-btn vm-qty-minus">−</button><input type="number" class="vm-qty-input" value="1" min="1" max="99"><button class="vm-qty-btn vm-qty-plus">+</button></div></div>';

        // Add to cart button
        html += '<button class="vm-add-btn" disabled>Select all options</button>';
        html += '</div></div>';
        return html;
    }

    setupModalEvents() {
        var self = this;
        var modal = this.variantModal;
        if (!modal) return;

        // Close button
        var closeBtn = modal.querySelector('.vm-close');
        if (closeBtn) closeBtn.addEventListener('click', function() { self.removeVariantModal(); });

        // Color swatches
        var swatches = modal.querySelectorAll('.vm-swatch');
        for (var i = 0; i < swatches.length; i++) {
            swatches[i].addEventListener('click', function() {
                var optName = this.getAttribute('data-option');
                var val = this.getAttribute('data-value');
                var desc = this.getAttribute('data-desc');

                // Deselect siblings
                var siblings = modal.querySelectorAll('.vm-swatch[data-option="' + optName + '"]');
                for (var s = 0; s < siblings.length; s++) siblings[s].classList.remove('selected');
                this.classList.add('selected');

                // Update label
                var optGroup = this.closest('.vm-option');
                var label = optGroup ? optGroup.querySelector('.vm-swatch-label') : null;
                if (label) label.textContent = desc || val;

                self.selectedChoices[optName] = desc || val;
                self.onChoiceChanged();
            });
        }

        // Text choice buttons
        var choiceBtns = modal.querySelectorAll('.vm-choice-btn');
        for (var i = 0; i < choiceBtns.length; i++) {
            choiceBtns[i].addEventListener('click', function() {
                var optName = this.getAttribute('data-option');
                var val = this.getAttribute('data-value');

                var siblings = modal.querySelectorAll('.vm-choice-btn[data-option="' + optName + '"]');
                for (var s = 0; s < siblings.length; s++) siblings[s].classList.remove('selected');
                this.classList.add('selected');

                self.selectedChoices[optName] = val;
                self.onChoiceChanged();
            });
        }

        // Quantity controls
        var qtyMinus = modal.querySelector('.vm-qty-minus');
        var qtyPlus = modal.querySelector('.vm-qty-plus');
        var qtyInput = modal.querySelector('.vm-qty-input');

        if (qtyMinus) qtyMinus.addEventListener('click', function() {
            var v = parseInt(qtyInput.value) || 1;
            if (v > 1) qtyInput.value = v - 1;
        });
        if (qtyPlus) qtyPlus.addEventListener('click', function() {
            var v = parseInt(qtyInput.value) || 1;
            if (v < 99) qtyInput.value = v + 1;
        });

        // Add to cart button
        var addBtn = modal.querySelector('.vm-add-btn');
        if (addBtn) addBtn.addEventListener('click', function() {
            self.onModalAddToCart();
        });
    }

    onChoiceChanged() {
        console.log("CE: Choice changed:", JSON.stringify(this.selectedChoices));
        var allSelected = this.currentOptions.length === Object.keys(this.selectedChoices).length;
        var addBtn = this.variantModal ? this.variantModal.querySelector('.vm-add-btn') : null;

        if (addBtn) {
            addBtn.disabled = !allSelected;
            addBtn.textContent = allSelected ? 'Add to Cart' : 'Select all options';
        }

        this.updateModalPrice();
    }

    updateModalPrice() {
        if (!this.variantModal) return;

        var priceEl = this.variantModal.querySelector('.vm-price');
        var compareEl = this.variantModal.querySelector('.vm-compare-price');
        if (!priceEl || !compareEl) return;

        // Try to find matching variant
        var matched = this.findMatchingVariant();

        if (matched) {
            if (matched.formattedDiscountedPrice && matched.formattedDiscountedPrice !== matched.formattedPrice) {
                priceEl.textContent = matched.formattedDiscountedPrice;
                compareEl.textContent = matched.formattedPrice;
            } else {
                priceEl.textContent = matched.formattedPrice;
                compareEl.textContent = '';
            }
        } else {
            // Show product base price
            var product = this.findProduct(this.currentProductId);
            if (product) {
                priceEl.textContent = product.discountedPrice || product.price || '';
                compareEl.textContent = product.compareAtPrice || '';
            }
        }
    }

    findMatchingVariant() {
        if (this.currentVariants.length === 0) return null;
        var selKeys = Object.keys(this.selectedChoices);
        if (selKeys.length === 0) return null;

        for (var i = 0; i < this.currentVariants.length; i++) {
            var v = this.currentVariants[i];
            var vc = v.choices || {};
            var match = true;
            for (var k = 0; k < selKeys.length; k++) {
                var key = selKeys[k];
                // For color options, variant choices store description (e.g., "Orange")
                // while swatch data-value stores hex (e.g., "#FF8000")
                // selectedChoices stores description because we set it from data-desc
                if (vc[key] !== this.selectedChoices[key]) {
                    match = false;
                    break;
                }
            }
            if (match) return v;
        }
        return null;
    }

    onModalAddToCart() {
        var allSelected = this.currentOptions.length === Object.keys(this.selectedChoices).length;
        if (!allSelected) return;

        var matched = this.findMatchingVariant();
        var qtyInput = this.variantModal ? this.variantModal.querySelector('.vm-qty-input') : null;
        var quantity = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;

        console.log("CE: Add to cart - productId:", this.currentProductId);
        console.log("CE: selectedChoices:", JSON.stringify(this.selectedChoices));
        console.log("CE: matchedVariant:", matched ? matched.id : "none");
        console.log("CE: manageVariants:", this.currentManageVariants);

        var detail = {
            productId: this.currentProductId,
            quantity: quantity,
            selectedChoices: this.selectedChoices,
            manageVariants: this.currentManageVariants
        };

        if (matched && matched.id) {
            detail.variantId = matched.id;
        }

        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true, composed: true,
            detail: detail
        }));

        // Update button state in modal
        var addBtn = this.variantModal ? this.variantModal.querySelector('.vm-add-btn') : null;
        if (addBtn) {
            addBtn.textContent = 'Adding...';
            addBtn.disabled = true;
        }
    }

    removeVariantModal() {
        if (this.variantModal) {
            this.variantModal.remove();
            this.variantModal = null;
        }
        // Also reset the card button that triggered it
        if (this.currentProductId) {
            var btn = this.querySelector('[data-cart-btn="' + this.currentProductId + '"]');
            if (btn) { btn.textContent = 'Add to Cart'; btn.disabled = false; }
        }
    }

    // ===== CART STATUS =====
    onCartStatus(data) {
        var pid = data.productId;
        var cardBtn = this.querySelector('[data-cart-btn="' + pid + '"]');
        var modalBtn = this.variantModal ? this.variantModal.querySelector('.vm-add-btn') : null;

        if (data.status === 'loading') {
            if (cardBtn) { cardBtn.textContent = 'Adding...'; cardBtn.disabled = true; }
            if (modalBtn) { modalBtn.textContent = 'Adding...'; modalBtn.disabled = true; }
        } else if (data.status === 'success') {
            if (cardBtn) cardBtn.textContent = '✓ Added!';
            if (modalBtn) modalBtn.textContent = '✓ Added to Cart!';
            var self = this;
            setTimeout(function() {
                if (cardBtn) { cardBtn.textContent = 'Add to Cart'; cardBtn.disabled = false; }
                self.removeVariantModal();
            }, 1200);
        } else if (data.status === 'error') {
            if (cardBtn) { cardBtn.textContent = 'Add to Cart'; cardBtn.disabled = false; }
            if (modalBtn) { modalBtn.textContent = 'Error - Try Again'; modalBtn.disabled = false; }
            console.error("CE: Cart error:", data.message);
        }
    }

    // ===== HELPERS =====
    findProduct(pid) {
        for (var i = 0; i < this.products.length; i++) {
            if (this.products[i].id === pid) return this.products[i];
        }
        return null;
    }

    esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    getShadowCSS() {
        var m = { none: 'none', small: '0 1px 3px rgba(0,0,0,0.08)', medium: '0 4px 12px rgba(0,0,0,0.12)', large: '0 8px 24px rgba(0,0,0,0.16)' };
        return m[this.settings.cardShadow] || m.medium;
    }
    getHoverCSS() {
        var m = { lift: 'transform:translateY(-8px);box-shadow:0 12px 28px rgba(0,0,0,0.18);', glow: 'box-shadow:0 0 20px ' + this.settings.primaryAccent + '66;', zoom: 'transform:scale(1.02);', none: '' };
        return m[this.settings.hoverEffect] || m.lift;
    }
    getButtonSizeCSS() {
        var m = { small: 'padding:10px 20px;font-size:12px;', medium: 'padding:14px 28px;font-size:14px;', large: 'padding:18px 36px;font-size:16px;' };
        return m[this.settings.buttonSize] || m.medium;
    }

    // ===== RENDER =====
    render() {
        this.innerHTML =
            '<style>' +
            '*{box-sizing:border-box}' +
            '.gallery-wrap{padding:20px;max-width:1400px;margin:0 auto;font-family:var(--ff)}' +
            '.products-grid{display:grid;grid-template-columns:repeat(var(--cols-d),1fr);gap:var(--gap);margin-bottom:40px}' +
            '.product-card{background:var(--card-bg);overflow:hidden;box-shadow:var(--shadow);transition:all .3s ease;position:relative;display:flex;flex-direction:column;height:100%;border:var(--bw) solid var(--bc);border-radius:var(--br)}' +
            '.product-card:hover{background:var(--card-hover);' + this.getHoverCSS() + '}' +
            '.img-wrap{position:relative;width:100%;height:var(--img-h);overflow:hidden;background:#f5f5f5;flex-shrink:0;border-radius:var(--img-br)}' +
            '.img-wrap img{width:100%;height:100%;object-fit:cover;transition:transform .4s ease}' +
            '.product-card:hover .img-wrap img{transform:' + (this.settings.imageZoom ? 'scale(1.1)' : 'none') + '}' +
            '.ribbon{position:absolute;top:12px;left:0;background:var(--ribbon-bg);color:var(--ribbon-text);padding:6px 16px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.8px;z-index:10;border-radius:0 4px 4px 0}' +
            '.card-body{padding:var(--cp);flex:1;display:flex;flex-direction:column}' +
            '.card-body h3{font-size:var(--hs);font-weight:700;margin:0 0 12px;color:var(--hc);line-height:1.3;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}' +
            '.card-body p{font-size:var(--ts);color:var(--tc);margin:0 0 16px;line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}' +
            '.price-row{margin:auto 0 16px;padding-top:16px;border-top:1px solid var(--bc);display:flex;align-items:center;gap:10px}' +
            '.price{font-size:var(--ps);font-weight:800;color:var(--pc)}' +
            '.compare-price{font-size:calc(var(--ps) * 0.65);color:var(--cpc);text-decoration:line-through}' +
            '.btns{display:flex;gap:8px}' +
            '.btns a,.btns button{flex:1;display:block;border-radius:8px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;cursor:pointer;transition:all .2s;text-decoration:none;text-align:center;font-family:var(--ff);' + this.getButtonSizeCSS() + '}' +
            '.btn-view{background:var(--btn-bg);color:var(--btn-text);border:none}' +
            '.btn-view:hover{background:var(--btn-hover);transform:translateY(-2px)}' +
            '.btn-cart{background:var(--accent);color:#fff;border:none}' +
            '.btn-cart:hover{opacity:.9;transform:translateY(-2px)}' +
            '.btn-cart:disabled{opacity:.5;cursor:wait}' +
            '.load-more-wrap{text-align:center;padding:30px 0}' +
            '.load-more-btn{padding:16px 48px;border:3px solid var(--lm-border);background:var(--lm-bg);color:var(--lm-text);border-radius:50px;font-size:15px;font-weight:700;cursor:pointer;transition:all .3s;text-transform:uppercase;letter-spacing:1.2px;font-family:var(--ff)}' +
            '.load-more-btn:hover{background:var(--lm-text);color:var(--lm-bg);transform:translateY(-3px)}' +
            '.empty{text-align:center;padding:80px 20px;color:var(--tc);font-size:18px}' +
            '@media(max-width:1024px){.products-grid{grid-template-columns:repeat(var(--cols-t),1fr)}}' +
            '@media(max-width:768px){.products-grid{grid-template-columns:repeat(var(--cols-m),1fr)}.btns{flex-direction:column}}' +
            // Variant Modal Styles
            '.vm-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px}' +
            '.vm-modal{background:#fff;border-radius:16px;max-width:480px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3)}' +
            '.vm-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #eee}' +
            '.vm-header h3{margin:0;font-size:18px;font-weight:700;color:#1a1a1a;font-family:var(--ff)}' +
            '.vm-close{background:none;border:none;font-size:28px;cursor:pointer;color:#999;padding:0;line-height:1;transition:color .2s}' +
            '.vm-close:hover{color:#333}' +
            '.vm-body{padding:24px}' +
            '.vm-option{margin-bottom:20px}' +
            '.vm-option label{display:block;font-weight:600;font-size:14px;color:#333;margin-bottom:10px;font-family:var(--ff)}' +
            '.vm-swatches{display:flex;flex-wrap:wrap;gap:10px}' +
            '.vm-swatch{width:40px;height:40px;border-radius:50%;border:3px solid #ddd;cursor:pointer;transition:all .2s;position:relative}' +
            '.vm-swatch:hover{transform:scale(1.15)}' +
            '.vm-swatch.selected{border-color:#333;box-shadow:0 0 0 2px #fff,0 0 0 4px #333}' +
            '.vm-swatch.out-of-stock{opacity:.35;cursor:not-allowed}' +
            '.vm-swatch.out-of-stock::after{content:"";position:absolute;top:50%;left:0;right:0;height:2px;background:#c00;transform:rotate(-45deg)}' +
            '.vm-swatch-label{display:block;font-size:13px;color:#666;margin-top:6px;font-family:var(--ff)}' +
            '.vm-choices{display:flex;flex-wrap:wrap;gap:8px}' +
            '.vm-choice-btn{padding:10px 18px;border:2px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;font-size:14px;font-weight:500;transition:all .2s;font-family:var(--ff);color:#333}' +
            '.vm-choice-btn:hover{border-color:#999}' +
            '.vm-choice-btn.selected{border-color:var(--accent,#3498db);background:var(--accent,#3498db);color:#fff}' +
            '.vm-choice-btn.out-of-stock{opacity:.45;cursor:not-allowed;text-decoration:line-through}' +
            '.vm-price-row{padding:16px 0;border-top:1px solid #eee;margin-top:16px;display:flex;align-items:center;gap:12px}' +
            '.vm-price{font-size:24px;font-weight:800;color:#2c3e50;font-family:var(--ff)}' +
            '.vm-compare-price{font-size:16px;color:#999;text-decoration:line-through;font-family:var(--ff)}' +
            '.vm-qty-row{display:flex;align-items:center;gap:16px;margin-bottom:20px}' +
            '.vm-qty-row label{font-weight:600;font-size:14px;color:#333;font-family:var(--ff)}' +
            '.vm-qty-control{display:flex;align-items:center;border:2px solid #ddd;border-radius:8px;overflow:hidden}' +
            '.vm-qty-btn{width:40px;height:40px;border:none;background:#f8f9fa;cursor:pointer;font-size:18px;font-weight:700;color:#333;transition:background .2s}' +
            '.vm-qty-btn:hover{background:#e9ecef}' +
            '.vm-qty-input{width:50px;height:40px;border:none;border-left:2px solid #ddd;border-right:2px solid #ddd;text-align:center;font-size:16px;font-weight:600;font-family:var(--ff);-moz-appearance:textfield}' +
            '.vm-qty-input::-webkit-outer-spin-button,.vm-qty-input::-webkit-inner-spin-button{-webkit-appearance:none}' +
            '.vm-add-btn{width:100%;padding:16px;border:none;border-radius:10px;background:var(--accent,#3498db);color:#fff;font-size:16px;font-weight:700;cursor:pointer;transition:all .2s;text-transform:uppercase;letter-spacing:.5px;font-family:var(--ff)}' +
            '.vm-add-btn:hover:not(:disabled){opacity:.9;transform:translateY(-2px)}' +
            '.vm-add-btn:disabled{opacity:.5;cursor:not-allowed;background:#999}' +
            '</style>' +
            '<div class="gallery-wrap"><div class="products-grid"></div><div class="load-more-wrap"></div></div>';
    }

    renderProducts() {
        var grid = this.querySelector('.products-grid');
        var lmWrap = this.querySelector('.load-more-wrap');
        if (!grid || !lmWrap) return;

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty">No products found. Please select a category.</div>';
            lmWrap.innerHTML = '';
            return;
        }

        var html = '';
        for (var i = 0; i < this.products.length; i++) html += this.renderCard(this.products[i]);
        grid.innerHTML = html;

        var self = this;
        // Cart button handlers
        var cartBtns = grid.querySelectorAll('.btn-cart');
        for (var b = 0; b < cartBtns.length; b++) {
            cartBtns[b].addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var pid = this.getAttribute('data-product-id');
                var hasOpts = this.getAttribute('data-has-options') === 'true';

                this.textContent = 'Loading...';
                this.disabled = true;

                if (hasOpts) {
                    // Has options - request variant data to show modal
                    console.log("CE: Product has options, requesting variant data for:", pid);
                    self.dispatchEvent(new CustomEvent('request-variant-data', {
                        bubbles: true, composed: true,
                        detail: { productId: pid }
                    }));
                } else {
                    // No options - add directly
                    console.log("CE: Simple product, adding to cart:", pid);
                    self.dispatchEvent(new CustomEvent('add-to-cart', {
                        bubbles: true, composed: true,
                        detail: { productId: pid, quantity: 1 }
                    }));
                }
            });
        }

        // Load more
        if (this.hasMore) {
            lmWrap.innerHTML = '<button class="load-more-btn">' + this.settings.loadMoreText + '</button>';
            lmWrap.querySelector('.load-more-btn').addEventListener('click', function() {
                self.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
            });
        } else {
            lmWrap.innerHTML = '';
        }
        this.updateStyles();
    }

    renderCard(product) {
        var hasCP = product.compareAtPrice && product.compareAtPrice !== product.price;
        var displayPrice = product.discountedPrice || product.price || '';
        return '<div class="product-card">' +
            (product.ribbon ? '<div class="ribbon">' + this.esc(product.ribbon) + '</div>' : '') +
            '<div class="img-wrap"><img src="' + (product.imageUrl || 'https://via.placeholder.com/400') + '" alt="' + this.esc(product.name) + '" loading="lazy" onerror="this.src=\'https://via.placeholder.com/400\'"></div>' +
            '<div class="card-body">' +
            '<h3>' + this.esc(product.name) + '</h3>' +
            '<p>' + (product.description || '') + '</p>' +
            '<div class="price-row"><span class="price">' + displayPrice + '</span>' +
            (hasCP ? '<span class="compare-price">' + product.compareAtPrice + '</span>' : '') +
            '</div><div class="btns">' +
            '<a href="' + (product.productUrl || '#') + '" class="btn-view">' + this.settings.buttonText + '</a>' +
            '<button type="button" class="btn-cart" data-product-id="' + product.id + '" data-cart-btn="' + product.id + '" data-has-options="' + (product.hasOptions ? 'true' : 'false') + '">Add to Cart</button>' +
            '</div></div></div>';
    }

    updateStyles() {
        var w = this.querySelector('.gallery-wrap');
        if (!w) return;
        var s = this.settings;
        w.style.setProperty('--card-bg', s.cardBgColor);
        w.style.setProperty('--card-hover', s.cardHoverBgColor);
        w.style.setProperty('--hc', s.headingColor);
        w.style.setProperty('--tc', s.textColor);
        w.style.setProperty('--ff', s.fontFamily);
        w.style.setProperty('--hs', s.headingSize + 'px');
        w.style.setProperty('--ts', s.textSize + 'px');
        w.style.setProperty('--pc', s.priceColor);
        w.style.setProperty('--cpc', s.comparePriceColor);
        w.style.setProperty('--ps', s.priceSize + 'px');
        w.style.setProperty('--bc', s.borderColor);
        w.style.setProperty('--bw', s.borderWidth + 'px');
        w.style.setProperty('--br', s.cornerRadius + 'px');
        w.style.setProperty('--cp', s.cardPadding + 'px');
        w.style.setProperty('--gap', s.cardGap + 'px');
        w.style.setProperty('--btn-bg', s.buttonBgColor);
        w.style.setProperty('--btn-text', s.buttonTextColor);
        w.style.setProperty('--btn-hover', s.buttonHoverBgColor);
        w.style.setProperty('--img-h', s.imageHeight + 'px');
        w.style.setProperty('--img-br', s.imageBorderRadius + 'px');
        w.style.setProperty('--shadow', this.getShadowCSS());
        w.style.setProperty('--cols-d', s.columnsDesktop);
        w.style.setProperty('--cols-t', s.columnsTablet);
        w.style.setProperty('--cols-m', s.columnsMobile);
        w.style.setProperty('--ribbon-bg', s.ribbonBgColor);
        w.style.setProperty('--ribbon-text', s.ribbonTextColor);
        w.style.setProperty('--lm-bg', s.loadMoreBgColor);
        w.style.setProperty('--lm-text', s.loadMoreTextColor);
        w.style.setProperty('--lm-border', s.loadMoreBorderColor);
        w.style.setProperty('--accent', s.primaryAccent);
    }
}

customElements.define('product-gallery', ProductGalleryElement);
