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
        console.log("CE: constructor called");
    }

    connectedCallback() {
        console.log("CE: connectedCallback");
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
        console.log("CE: attributeChangedCallback name=" + name + " hasNewValue=" + !!newValue + " changed=" + (oldValue !== newValue));

        if (!newValue) {
            console.log("CE: newValue is empty/null for " + name);
            return;
        }
        if (newValue === oldValue) {
            console.log("CE: newValue === oldValue for " + name + ", skipping");
            return;
        }

        console.log("CE: " + name + " value length:", newValue.length);
        console.log("CE: " + name + " first 300 chars:", newValue.substring(0, 300));

        try {
            var data = JSON.parse(newValue);
            console.log("CE: " + name + " parsed successfully");

            if (name === 'products-data') {
                console.log("CE: products-data - products count:", (data.products || []).length);
                if (!this.isRendered) {
                    console.log("CE: Not rendered yet, storing as pending");
                    this.pendingProductsData = data;
                    return;
                }
                this.products = data.products || [];
                this.hasMore = data.hasMore || false;
                this.renderProducts();
            } else if (name === 'settings') {
                var keys = Object.keys(data);
                for (var i = 0; i < keys.length; i++) this.settings[keys[i]] = data[keys[i]];
                if (this.isRendered) this.updateStyles();
            } else if (name === 'variant-data') {
                console.log("CE: >>>>>> variant-data received! <<<<<<");
                console.log("CE: variant-data productId:", data.productId);
                console.log("CE: variant-data hasOptions:", data.hasOptions);
                console.log("CE: variant-data options:", JSON.stringify(data.options));
                console.log("CE: variant-data options count:", data.options ? data.options.length : 0);
                console.log("CE: variant-data variants count:", data.variants ? data.variants.length : 0);
                console.log("CE: variant-data manageVariants:", data.manageVariants);
                console.log("CE: variant-data error:", data.error);
                this.onVariantDataReceived(data);
            } else if (name === 'cart-status') {
                console.log("CE: cart-status:", data.status, "for", data.productId);
                this.onCartStatus(data);
            }
        } catch (e) {
            console.error("CE: JSON parse ERROR for " + name + ":", e.message);
            console.error("CE: Raw value:", newValue.substring(0, 200));
        }
    }

    onVariantDataReceived(data) {
        var pid = data.productId;
        console.log("CE: onVariantDataReceived for pid:", pid);

        if (!pid) {
            console.log("CE: ERROR - no productId in variant data!");
            return;
        }

        this.variantCache[pid] = data;
        this.selectedChoices[pid] = {};

        var btn = this.querySelector('[data-cart-btn="' + pid + '"]');
        console.log("CE: Found cart button for pid:", !!btn);
        if (btn) { btn.textContent = 'Add to Cart'; btn.disabled = false; }

        if (!data.hasOptions) {
            console.log("CE: hasOptions is false - adding directly to cart");
            var defaultVarId = (data.variants && data.variants.length > 0) ? data.variants[0].id : null;
            console.log("CE: defaultVarId:", defaultVarId);
            this.fireAddToCart(pid, defaultVarId, 1, null, data.manageVariants);
            return;
        }

        if (!data.options || data.options.length === 0) {
            console.log("CE: hasOptions is true but options array is empty! Adding directly.");
            var defaultVarId2 = (data.variants && data.variants.length > 0) ? data.variants[0].id : null;
            this.fireAddToCart(pid, defaultVarId2, 1, null, data.manageVariants);
            return;
        }

        console.log("CE: Product HAS options - showing variant modal");
        console.log("CE: Options to display:", data.options.length);
        for (var i = 0; i < data.options.length; i++) {
            console.log("CE: Option [" + i + "]:", data.options[i].name, "type:", data.options[i].type, "choices:", data.options[i].choices.length);
        }

        this.showVariantModal(pid);
    }

    onCartStatus(data) {
        var pid = data.productId;
        var cardBtn = this.querySelector('[data-cart-btn="' + pid + '"]');
        var modalBtn = this.querySelector('.modal-add-btn');
        var self = this;

        if (data.status === 'loading') {
            if (cardBtn) { cardBtn.textContent = 'Adding...'; cardBtn.disabled = true; }
            if (modalBtn) { modalBtn.textContent = 'Adding...'; modalBtn.disabled = true; }
        } else if (data.status === 'success') {
            if (cardBtn) cardBtn.textContent = '✓ Added!';
            if (modalBtn) modalBtn.textContent = '✓ Added!';
            setTimeout(function () {
                self.closeVariantModal();
                if (cardBtn) { cardBtn.textContent = 'Add to Cart'; cardBtn.disabled = false; }
            }, 1500);
        } else if (data.status === 'error') {
            if (cardBtn) { cardBtn.textContent = 'Add to Cart'; cardBtn.disabled = false; }
            if (modalBtn) { modalBtn.textContent = 'Add to Cart'; modalBtn.disabled = false; }
            var errEl = self.querySelector('.modal-error');
            if (errEl) errEl.textContent = data.message || 'Error';
        }
    }

    fireAddToCart(productId, variantId, quantity, selectedChoices, manageVariants) {
        console.log("CE: fireAddToCart - pid:", productId, "variantId:", variantId, "qty:", quantity);
        console.log("CE: fireAddToCart - selectedChoices:", JSON.stringify(selectedChoices));
        console.log("CE: fireAddToCart - manageVariants:", manageVariants);

        this.dispatchEvent(new CustomEvent('add-to-cart', {
            bubbles: true, composed: true,
            detail: {
                productId: productId,
                variantId: variantId || null,
                quantity: quantity || 1,
                selectedChoices: selectedChoices || null,
                manageVariants: manageVariants || false
            }
        }));
        console.log("CE: add-to-cart event dispatched");
    }

    showVariantModal(pid) {
        console.log("CE: showVariantModal called for pid:", pid);
        this.closeVariantModal();

        var data = this.variantCache[pid];
        if (!data) {
            console.log("CE: ERROR - no variant data in cache for pid:", pid);
            return;
        }

        var product = null;
        for (var p = 0; p < this.products.length; p++) {
            if (this.products[p].id === pid) { product = this.products[p]; break; }
        }
        console.log("CE: Found product for modal:", product ? product.name : "NOT FOUND");

        var optionsHtml = '';
        for (var oi = 0; oi < data.options.length; oi++) {
            var opt = data.options[oi];
            var choicesHtml = '';
            console.log("CE: Building UI for option:", opt.name, "type:", opt.type, "choices:", opt.choices.length);

            if (opt.type === 'color') {
                for (var ci = 0; ci < opt.choices.length; ci++) {
                    var ch = opt.choices[ci];
                    var bgColor = ch.color || ch.value || '#ccc';
                    var label = ch.description || ch.value;
                    choicesHtml += '<div class="color-swatch" data-opt-name="' + this.esc(opt.name) + '" data-choice-value="' + this.esc(ch.value) + '" title="' + this.esc(label) + '" style="background-color:' + bgColor + ';"></div>';
                }
                optionsHtml += '<div class="option-group"><label class="option-label">' + this.esc(opt.name) + ' <span class="selected-label" data-label-for="' + this.esc(opt.name) + '"></span></label><div class="color-swatches">' + choicesHtml + '</div></div>';
            } else {
                for (var ci2 = 0; ci2 < opt.choices.length; ci2++) {
                    var ch2 = opt.choices[ci2];
                    choicesHtml += '<div class="choice-btn" data-opt-name="' + this.esc(opt.name) + '" data-choice-value="' + this.esc(ch2.value) + '">' + this.esc(ch2.description || ch2.value) + '</div>';
                }
                optionsHtml += '<div class="option-group"><label class="option-label">' + this.esc(opt.name) + '</label><div class="choice-buttons">' + choicesHtml + '</div></div>';
            }
        }

        console.log("CE: Options HTML built, length:", optionsHtml.length);

        var overlay = document.createElement('div');
        overlay.className = 'variant-overlay';
        overlay.innerHTML =
            '<div class="variant-modal">' +
            '<button class="modal-close-btn" type="button">&times;</button>' +
            '<div class="modal-header">' +
            (product ? '<img class="modal-thumb" src="' + (product.imageUrl || '') + '" alt="' + this.esc(product.name) + '">' : '') +
            '<div class="modal-header-text">' +
            '<div class="modal-title">' + this.esc(product ? product.name : '') + '</div>' +
            '<div class="modal-price">' + (product ? product.price : '') + '</div>' +
            '</div></div>' +
            '<div class="modal-options">' + optionsHtml + '</div>' +
            '<div class="modal-error"></div>' +
            '<div class="modal-footer">' +
            '<div class="quantity-selector">' +
            '<button class="qty-btn qty-minus" type="button">−</button>' +
            '<span class="qty-display">1</span>' +
            '<button class="qty-btn qty-plus" type="button">+</button>' +
            '</div>' +
            '<button class="modal-add-btn" type="button" disabled>Select Options</button>' +
            '</div></div>';

        this.appendChild(overlay);
        console.log("CE: Modal overlay appended to DOM");
        console.log("CE: Modal visible check - overlay in DOM:", !!this.querySelector('.variant-overlay'));
        console.log("CE: Modal visible check - modal in DOM:", !!this.querySelector('.variant-modal'));

        this.setupModalEvents(overlay, pid, data);
        console.log("CE: Modal events set up");
    }

    setupModalEvents(overlay, pid, data) {
        var self = this;
        var quantity = 1;
        var qtyDisplay = overlay.querySelector('.qty-display');
        var addBtn = overlay.querySelector('.modal-add-btn');
        var errorEl = overlay.querySelector('.modal-error');

        overlay.querySelector('.modal-close-btn').addEventListener('click', function () {
            console.log("CE: Modal close clicked");
            self.closeVariantModal();
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                console.log("CE: Overlay background clicked - closing");
                self.closeVariantModal();
            }
        });

        overlay.querySelector('.qty-minus').addEventListener('click', function () {
            if (quantity > 1) { quantity--; qtyDisplay.textContent = quantity; }
        });
        overlay.querySelector('.qty-plus').addEventListener('click', function () {
            if (quantity < 99) { quantity++; qtyDisplay.textContent = quantity; }
        });

        var clickables = overlay.querySelectorAll('.color-swatch, .choice-btn');
        console.log("CE: Found clickable options:", clickables.length);

        for (var i = 0; i < clickables.length; i++) {
            clickables[i].addEventListener('click', function () {
                var optName = this.getAttribute('data-opt-name');
                var choiceValue = this.getAttribute('data-choice-value');
                console.log("CE: Option clicked - optName:", optName, "choiceValue:", choiceValue);

                if (!self.selectedChoices[pid]) self.selectedChoices[pid] = {};
                self.selectedChoices[pid][optName] = choiceValue;
                console.log("CE: Current selections:", JSON.stringify(self.selectedChoices[pid]));

                var siblings = this.parentElement.querySelectorAll('.color-swatch, .choice-btn');
                for (var j = 0; j < siblings.length; j++) siblings[j].classList.remove('selected');
                this.classList.add('selected');

                var label = overlay.querySelector('[data-label-for="' + optName + '"]');
                if (label) label.textContent = '— ' + (this.getAttribute('title') || choiceValue);

                var allDone = true;
                for (var k = 0; k < data.options.length; k++) {
                    if (!self.selectedChoices[pid] || !self.selectedChoices[pid][data.options[k].name]) {
                        allDone = false; break;
                    }
                }
                console.log("CE: All options selected:", allDone);

                if (allDone) {
                    var matched = self.findMatchingVariant(pid, data);
                    console.log("CE: Matched variant:", matched ? matched.id : "NONE");
                    if (matched) {
                        addBtn.disabled = false;
                        addBtn.textContent = 'Add to Cart';
                    } else {
                        addBtn.disabled = true;
                        addBtn.textContent = 'Unavailable';
                        if (errorEl) errorEl.textContent = 'This combination is not available';
                    }
                }
                if (errorEl && allDone) errorEl.textContent = '';
            });
        }

        addBtn.addEventListener('click', function () {
            if (addBtn.disabled) return;
            var selected = self.selectedChoices[pid] || {};
            var matched = self.findMatchingVariant(pid, data);
            console.log("CE: Add to cart clicked - selected:", JSON.stringify(selected), "matched:", matched ? matched.id : "none");

            self.fireAddToCart(pid, matched ? matched.id : null, quantity, selected, data.manageVariants);
        });
    }

    findMatchingVariant(pid, data) {
        var selected = this.selectedChoices[pid] || {};
        var selKeys = Object.keys(selected);
        console.log("CE: findMatchingVariant - selected keys:", JSON.stringify(selKeys));
        console.log("CE: findMatchingVariant - selected values:", JSON.stringify(selected));
        console.log("CE: findMatchingVariant - total variants to check:", data.variants.length);

        for (var i = 0; i < data.variants.length; i++) {
            var v = data.variants[i];
            var vc = v.choices || {};
            var match = true;

            for (var k = 0; k < selKeys.length; k++) {
                var optName = selKeys[k];
                if (vc[optName] !== selected[optName]) {
                    match = false;
                    break;
                }
            }

            if (match) {
                console.log("CE: MATCHED variant:", v.id, "choices:", JSON.stringify(vc));
                return v;
            }
        }

        console.log("CE: NO variant matched! Logging all variants for comparison:");
        for (var j = 0; j < data.variants.length && j < 5; j++) {
            console.log("CE: Variant[" + j + "] id:", data.variants[j].id, "choices:", JSON.stringify(data.variants[j].choices));
        }
        return null;
    }

    closeVariantModal() {
        console.log("CE: closeVariantModal");
        var overlay = this.querySelector('.variant-overlay');
        if (overlay) overlay.remove();
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

    render() {
        console.log("CE: render() called");
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
            '.variant-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px}' +
            '.variant-modal{background:#fff;border-radius:16px;padding:28px;max-width:440px;width:100%;max-height:85vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:var(--ff)}' +
            '.modal-close-btn{position:absolute;top:12px;right:16px;background:none;border:none;font-size:28px;cursor:pointer;color:#999;line-height:1;padding:0}.modal-close-btn:hover{color:#333}' +
            '.modal-header{display:flex;gap:14px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #eee}' +
            '.modal-thumb{width:70px;height:70px;object-fit:cover;border-radius:8px;flex-shrink:0}' +
            '.modal-header-text{min-width:0}' +
            '.modal-title{font-weight:700;font-size:16px;color:#1a1a1a;margin-bottom:4px}' +
            '.modal-price{font-weight:800;font-size:18px;color:var(--pc,#2c3e50)}' +
            '.option-group{margin-bottom:18px}' +
            '.option-label{display:block;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:#555;margin-bottom:8px}' +
            '.selected-label{font-weight:400;font-size:12px;text-transform:none;letter-spacing:0;color:#888}' +
            '.color-swatches{display:flex;flex-wrap:wrap;gap:8px}' +
            '.color-swatch{width:36px;height:36px;border-radius:50%;cursor:pointer;border:3px solid transparent;transition:all .2s;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}.color-swatch:hover{transform:scale(1.15)}.color-swatch.selected{border-color:var(--accent,#3498db);box-shadow:0 0 0 2px var(--accent,#3498db)}' +
            '.choice-buttons{display:flex;flex-wrap:wrap;gap:8px}' +
            '.choice-btn{padding:8px 18px;border:2px solid #ddd;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;color:#444;transition:all .2s;background:#fff}.choice-btn:hover{border-color:#999}.choice-btn.selected{border-color:var(--accent,#3498db);background:var(--accent,#3498db);color:#fff}' +
            '.modal-error{color:#e74c3c;font-size:13px;min-height:20px;margin-bottom:8px}' +
            '.modal-footer{display:flex;gap:12px;align-items:center;margin-top:10px}' +
            '.quantity-selector{display:flex;align-items:center;border:2px solid #ddd;border-radius:8px;overflow:hidden}' +
            '.qty-btn{width:36px;height:36px;border:none;background:#f5f5f5;cursor:pointer;font-size:18px;font-weight:700;color:#333;transition:background .2s}.qty-btn:hover{background:#e0e0e0}' +
            '.qty-display{width:40px;text-align:center;font-weight:700;font-size:15px}' +
            '.modal-add-btn{flex:1;padding:12px 20px;border:none;border-radius:8px;background:var(--accent,#3498db);color:#fff;font-weight:700;font-size:14px;cursor:pointer;text-transform:uppercase;letter-spacing:.5px;transition:all .2s}.modal-add-btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}.modal-add-btn:disabled{background:#ccc;cursor:not-allowed}' +
            '@media(max-width:1024px){.products-grid{grid-template-columns:repeat(var(--cols-t),1fr)}}' +
            '@media(max-width:768px){.products-grid{grid-template-columns:repeat(var(--cols-m),1fr)}.btns{flex-direction:column}}' +
            '</style>' +
            '<div class="gallery-wrap"><div class="products-grid"></div><div class="load-more-wrap"></div></div>';
        console.log("CE: render() complete");
    }

    renderProducts() {
        console.log("CE: renderProducts called, count:", this.products.length);
        var grid = this.querySelector('.products-grid');
        var lmWrap = this.querySelector('.load-more-wrap');
        if (!grid || !lmWrap) { console.log("CE: ERROR - grid or lmWrap not found!"); return; }

        if (this.products.length === 0) {
            grid.innerHTML = '<div class="empty">No products found. Please select a category.</div>';
            lmWrap.innerHTML = '';
            return;
        }

        var html = '';
        for (var i = 0; i < this.products.length; i++) html += this.renderCard(this.products[i]);
        grid.innerHTML = html;

        var self = this;
        var cartBtns = grid.querySelectorAll('.btn-cart');
        console.log("CE: Found cart buttons:", cartBtns.length);

        for (var b = 0; b < cartBtns.length; b++) {
            cartBtns[b].addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var pid = this.getAttribute('data-product-id');
                console.log("CE: Cart button clicked for pid:", pid);
                this.textContent = 'Loading...';
                this.disabled = true;

                console.log("CE: Dispatching request-variants event for pid:", pid);
                self.dispatchEvent(new CustomEvent('request-variants', {
                    bubbles: true, composed: true,
                    detail: { productId: pid }
                }));
                console.log("CE: request-variants event dispatched");
            });
        }

        if (this.hasMore) {
            lmWrap.innerHTML = '<button class="load-more-btn">' + this.settings.loadMoreText + '</button>';
            lmWrap.querySelector('.load-more-btn').addEventListener('click', function () {
                self.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
            });
        } else {
            lmWrap.innerHTML = '';
        }
        this.updateStyles();
    }

    renderCard(product) {
        var hasCP = product.compareAtPrice && product.compareAtPrice !== product.price;
        return '<div class="product-card">' +
            (product.ribbon ? '<div class="ribbon">' + this.esc(product.ribbon) + '</div>' : '') +
            '<div class="img-wrap"><img src="' + (product.imageUrl || 'https://via.placeholder.com/400') + '" alt="' + this.esc(product.name) + '" loading="lazy" onerror="this.src=\'https://via.placeholder.com/400\'"></div>' +
            '<div class="card-body">' +
            '<h3>' + this.esc(product.name) + '</h3>' +
            '<p>' + (product.description || '') + '</p>' +
            '<div class="price-row"><span class="price">' + (product.price || '') + '</span>' +
            (hasCP ? '<span class="compare-price">' + product.compareAtPrice + '</span>' : '') +
            '</div><div class="btns">' +
            '<a href="' + (product.productUrl || '#') + '" class="btn-view">' + this.settings.buttonText + '</a>' +
            '<button type="button" class="btn-cart" data-product-id="' + product.id + '" data-cart-btn="' + product.id + '">Add to Cart</button>' +
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
