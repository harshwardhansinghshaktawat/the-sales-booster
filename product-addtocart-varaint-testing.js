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
        this.pendingVariantCheck = null;
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
        return ['products-data', 'settings', 'cart-status', 'variant-check'];
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
            } else if (name === 'variant-check') {
                this.onVariantCheckResult(data);
            }
        } catch (e) {
            console.error('Parse error for ' + name + ':', e);
        }
    }

    // Handle variant check result from widget
    onVariantCheckResult(data) {
        var pid = data.productId;
        var btn = this.querySelector('[data-cart-btn="' + pid + '"]');

        if (data.hasVariants) {
            // Product HAS variants - open Quick View
            console.log("CE: Product has variants, dispatching open-quick-view for:", pid);
            var prod = this.findProduct(pid);
            this.dispatchEvent(new CustomEvent('open-quick-view', {
                bubbles: true, composed: true,
                detail: { productId: pid, productUrl: prod ? prod.productUrl : '' }
            }));
            // Reset button after a delay (Quick View handles its own UI)
            if (btn) {
                btn.textContent = 'Add to Cart';
                btn.disabled = false;
            }
        } else {
            // Product does NOT have variants - add to cart directly
            console.log("CE: Product has NO variants, dispatching add-to-cart for:", pid);
            this.dispatchEvent(new CustomEvent('add-to-cart', {
                bubbles: true, composed: true,
                detail: { productId: pid, quantity: 1 }
            }));
        }
    }

    onCartStatus(data) {
        var pid = data.productId;
        var btn = this.querySelector('[data-cart-btn="' + pid + '"]');
        var self = this;

        if (data.status === 'loading') {
            if (btn) { btn.textContent = 'Adding...'; btn.disabled = true; }
        } else if (data.status === 'success') {
            if (btn) btn.textContent = '✓ Added!';
            setTimeout(function () {
                if (btn) { btn.textContent = 'Add to Cart'; btn.disabled = false; }
            }, 1500);
        } else if (data.status === 'error') {
            if (btn) { btn.textContent = 'Add to Cart'; btn.disabled = false; }
        }
    }

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
        var cartBtns = grid.querySelectorAll('.btn-cart');
        for (var b = 0; b < cartBtns.length; b++) {
            cartBtns[b].addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var pid = this.getAttribute('data-product-id');
                var hasOpts = this.getAttribute('data-has-options') === 'true';
                this.textContent = 'Loading...';
                this.disabled = true;

                if (hasOpts) {
                    // Product is KNOWN to have options → open Quick View directly
                    console.log("CE: hasOptions=true, opening Quick View for:", pid);
                    var prod = self.findProduct(pid);
                    self.dispatchEvent(new CustomEvent('open-quick-view', {
                        bubbles: true, composed: true,
                        detail: { productId: pid, productUrl: prod ? prod.productUrl : '' }
                    }));
                    // Reset button (Quick View handles the rest)
                    var btn = this;
                    setTimeout(function () {
                        btn.textContent = 'Add to Cart';
                        btn.disabled = false;
                    }, 500);
                } else {
                    // hasOptions is false — but could be a V3 product where productOptions
                    // wasn't populated. Ask widget to check Stores/Variants collection.
                    console.log("CE: hasOptions=false, checking variants for:", pid);
                    self.dispatchEvent(new CustomEvent('check-variants', {
                        bubbles: true, composed: true,
                        detail: { productId: pid }
                    }));
                }
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
