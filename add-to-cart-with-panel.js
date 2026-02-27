class ProductGalleryElement extends HTMLElement {
  constructor() {
    super();
    this.products = [];
    this.hasMore = false;
    this.settings = {
      cardBgColor: '#ffffff',
      cardHoverBgColor: '#f8f9fa',
      headingColor: '#1a1a1a',
      textColor: '#666666',
      fontFamily: 'Arial',
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
    this.isRendered = false;
    this.pendingProductsData = null;
    this.selectedOptions = {};
    this.quantities = {};
    this.errors = {};
    this.loadedImages = new Set();
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
    this.setupIntersectionObserver();
  }

  static get observedAttributes() {
    return ['products-data', 'settings', 'error-data'];
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

          this.products.forEach(p => {
            this.selectedOptions[p.id] = {};
            this.quantities[p.id] = 1; // Initialize quantity to 1
            this.errors[p.id] = '';
          });

          this.renderProducts();
        } catch (e) {
          // Silent fail
        }
      } else if (name === 'settings') {
        try {
          const newSettings = JSON.parse(newValue);
          Object.assign(this.settings, newSettings);
          if (this.isRendered) {
            this.updateStyles();
          }
        } catch (e) {
          // Silent fail
        }
      } else if (name === 'error-data') {
        try {
          const errorData = JSON.parse(newValue);
          console.log('❌ Custom element received error:', errorData);
          this.errors[errorData.productId] = errorData.message;
          this.updateErrorDisplay(errorData.productId);
        } catch (error) {
          console.error('Error parsing error data:', error);
        }
      }
    }
  }

  // Optimize Wix image URL - builds proper Wix media URL like official store widget
  optimizeImageUrl(url, width = 375, height = 375) {
    if (!url) return '';
    
    try {
      // Extract the media ID from the URL
      const mediaMatch = url.match(/\/media\/([^/]+)/);
      if (!mediaMatch) return url; // Not a Wix media URL, return as-is
      
      const mediaId = mediaMatch[1];
      
      // Build optimized URL
      const optimizedUrl = `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${width},h_${height},al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${mediaId}`;
      
      return optimizedUrl;
    } catch (error) {
      console.error('Error optimizing image URL:', error);
      return url; // Return original URL if optimization fails
    }
  }

  // Setup lazy loading for images
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '50px',
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

    // Observe all lazy images
    this.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });
  }

  // Validate product options
  validateOptions(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product || !product.productOptions || product.productOptions.length === 0) {
      return true; // No options to validate
    }

    const selected = this.selectedOptions[productId] || {};
    const missing = [];

    product.productOptions.forEach(opt => {
      if (!selected[opt.name] || selected[opt.name] === '') {
        missing.push(opt.name);
      }
    });

    if (missing.length > 0) {
      this.errors[productId] = `Please select: ${missing.join(', ')}`;
      this.updateErrorDisplay(productId);
      return false;
    }

    this.errors[productId] = '';
    this.updateErrorDisplay(productId);
    return true;
  }

  // Update error message display
  updateErrorDisplay(productId) {
    const card = this.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
      const errorEl = card.querySelector('.error-message');
      if (errorEl) {
        errorEl.textContent = this.errors[productId] || '';
        errorEl.style.display = this.errors[productId] ? 'block' : 'none';
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

  getHoverEffectCSS() {
    const effects = {
      lift: 'transform: translateY(-8px); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);',
      glow: `box-shadow: 0 0 20px ${this.settings.primaryAccent}66;`,
      zoom: 'transform: scale(1.02);',
      none: ''
    };
    return effects[this.settings.hoverEffect] || effects.lift;
  }

  getButtonCSS() {
    const sizes = {
      small: 'padding: 10px 20px; font-size: 12px;',
      medium: 'padding: 14px 28px; font-size: 14px;',
      large: 'padding: 18px 36px; font-size: 16px;'
    };
    
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
    
    return sizes[this.settings.buttonSize] + styles[this.settings.buttonStyle];
  }

  render() {
    this.innerHTML = `
      <style>
        * { box-sizing: border-box; }
        :host { display: block; width: 100%; }
        
        .gallery-container {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: var(--font-family);
        }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(var(--columns-desktop), 1fr);
          gap: var(--card-gap);
          margin-bottom: 40px;
        }
        
        .product-card {
          background: var(--card-bg);
          overflow: hidden;
          box-shadow: var(--card-shadow);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
          border: var(--border-width) solid var(--border-color);
          border-radius: var(--corner-radius);
        }
        
        .product-card:hover {
          background: var(--card-hover-bg);
          ${this.getHoverEffectCSS()}
        }
        
        .product-image-container {
          position: relative;
          width: 100%;
          height: var(--image-height);
          overflow: hidden;
          background: #f5f5f5;
          flex-shrink: 0;
          border-radius: var(--image-border-radius);
        }
        
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
        }
        
        .product-image.loaded {
          opacity: 1;
        }
        
        .product-card:hover .product-image.loaded {
          transform: ${this.settings.imageZoom ? 'scale(1.1)' : 'scale(1)'};
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
          box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
          z-index: 10;
          border-radius: 0 4px 4px 0;
        }
        
        .product-content {
          padding: var(--card-padding);
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .product-name {
          font-size: var(--heading-size);
          font-weight: 700;
          margin: 0 0 12px 0;
          line-height: 1.3;
          color: var(--heading-color);
          height: calc(var(--heading-size) * 2.6);
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .options-section {
          margin: 12px 0;
          flex: 1;
        }
        
        .option {
          margin-bottom: 16px;
        }
        
        .option label {
          display: block;
          font-weight: 600;
          font-size: 0.9em;
          margin-bottom: 8px;
          color: #555;
        }
        
        .swatches {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .swatch {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #ddd;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          background-size: cover;
          background-position: center;
        }
        
        .swatch:hover {
          transform: scale(1.1);
          border-color: #999;
        }
        
        .swatch.selected {
          border-color: #000;
          box-shadow: 0 0 0 2px white, 0 0 0 4px #000;
        }
        
        .swatch::after {
          content: attr(title);
          position: absolute;
          bottom: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }
        
        .swatch:hover::after {
          opacity: 1;
        }
        
        select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.95em;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        
        select:hover,
        select:focus {
          border-color: #999;
          outline: none;
        }
        
        .error-message {
          color: #d32f2f;
          font-size: 0.85em;
          margin: 8px 0;
          padding: 8px;
          background: #ffebee;
          border-radius: 4px;
          display: none;
        }
        
        .quantity-selector {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 16px 0;
          padding: 12px;
          background: #f8f8f8;
          border-radius: 6px;
        }
        
        .quantity-selector label {
          font-weight: 600;
          font-size: 0.9em;
          color: #555;
          margin: 0;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }
        
        .quantity-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.2em;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          color: #333;
          padding: 0;
        }
        
        .quantity-btn:hover {
          background: #007bff;
          border-color: #007bff;
          color: white;
        }
        
        .quantity-btn:active {
          transform: scale(0.95);
        }
        
        .quantity-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          background: #f5f5f5;
        }
        
        .quantity-btn:disabled:hover {
          background: #f5f5f5;
          border-color: #ddd;
          color: #333;
        }
        
        .quantity-value {
          min-width: 40px;
          text-align: center;
          font-size: 1.1em;
          font-weight: 600;
          color: #333;
        }
        
        .product-price-section {
          margin: auto 0 16px 0;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .product-price {
          font-size: var(--price-size);
          font-weight: 800;
          color: var(--price-color);
          display: inline-block;
        }
        
        .product-compare-price {
          font-size: calc(var(--price-size) * 0.65);
          color: var(--compare-price-color);
          text-decoration: line-through;
          display: inline-block;
        }
        
        .button-group {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        
        .btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9em;
          transition: all 0.2s ease;
          text-align: center;
          ${this.getButtonCSS()}
        }
        
        .view-btn {
          background: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        
        .view-btn:hover {
          background: #e5e5e5;
          border-color: #999;
        }
        
        .add-btn {
          background: #007bff;
          color: white;
        }
        
        .add-btn:hover {
          background: #0056b3;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,123,255,0.3);
        }
        
        .add-btn:active {
          transform: translateY(0);
        }
        
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
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }
        
        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: var(--text-color);
          font-size: 18px;
          font-family: var(--font-family);
        }
        
        @media (max-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(var(--columns-tablet), 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(var(--columns-mobile), 1fr);
          }
          
          .product-name {
            font-size: calc(var(--heading-size) * 0.9);
          }
          
          .product-description {
            font-size: calc(var(--text-size) * 0.9);
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

    grid.innerHTML = this.products.map((product, index) => this.renderProductCard(product, index)).join('');

    if (this.hasMore) {
      loadMoreContainer.innerHTML = `
        <button class="load-more-button" id="loadMoreBtn">
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
    this.setupIntersectionObserver();
    this.attachEventListeners();
  }

  renderProductCard(product, index) {
    const hasComparePrice = product.compareAtPrice && product.compareAtPrice !== product.price;
    
    return `
      <div class="product-card" data-product-id="${product.id}">
        ${product.ribbon ? `<div class="product-ribbon">${product.ribbon}</div>` : ''}
        
        <div class="product-image-container">
          <img 
            ${index < 6 ? `src="${this.optimizeImageUrl(product.imageUrl, 375, 375)}"` : `data-src="${this.optimizeImageUrl(product.imageUrl, 375, 375)}"`}
            alt="${product.name}" 
            class="product-image"
            ${index < 6 ? 'onload="this.classList.add(\'loaded\')"' : 'loading="lazy"'}
            onerror="this.src='https://via.placeholder.com/400'">
        </div>
        
        <div class="product-content">
          <h3 class="product-name">${product.name}</h3>
          
          ${product.productOptions && product.productOptions.length > 0 ? `
            <div class="options-section">
              ${product.productOptions.map(opt => `
                <div class="option">
                  <label>${opt.name}</label>
                  ${opt.optionType === 'color' ? `
                    <div class="swatches">
                      ${opt.choices.map(c => `
                        <button 
                          class="swatch" 
                          style="background-color: ${c.value};" 
                          data-option="${opt.name}" 
                          data-value="${c.description}" 
                          data-description="${c.description}"
                          title="${c.description}"
                          aria-label="Select ${c.description}">
                        </button>
                      `).join('')}
                    </div>
                  ` : `
                    <select data-option="${opt.name}" aria-label="Select ${opt.name}">
                      <option value="">Choose ${opt.name}</option>
                      ${opt.choices.map(c => `
                        <option value="${c.description}">${c.description}</option>
                      `).join('')}
                    </select>
                  `}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="quantity-selector">
            <label>Quantity</label>
            <div class="quantity-controls">
              <button class="quantity-btn" data-action="decrease" aria-label="Decrease quantity">−</button>
              <span class="quantity-value">${this.quantities[product.id] || 1}</span>
              <button class="quantity-btn" data-action="increase" aria-label="Increase quantity">+</button>
            </div>
          </div>
          
          <div class="error-message" role="alert"></div>
          
          <div class="product-price-section">
            <span class="product-price">${product.price}</span>
            ${hasComparePrice ? `<span class="product-compare-price">${product.compareAtPrice}</span>` : ''}
          </div>
          
          <div class="button-group">
            <button class="btn view-btn" data-action="view">View Product</button>
            <button class="btn add-btn" data-action="add">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Color swatches
    this.querySelectorAll('.swatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const option = e.target.dataset.option;
        const description = e.target.dataset.description;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        
        this.selectedOptions[productId][option] = description;
        this.errors[productId] = '';
        this.updateErrorDisplay(productId);

        // Visual feedback
        card.querySelectorAll(`.swatch[data-option="${option}"]`).forEach(s => 
          s.classList.remove('selected')
        );
        e.target.classList.add('selected');
        
        console.log('✅ Color selected:', option, '=', description);
      });
    });

    // Dropdowns
    this.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const option = e.target.dataset.option;
        const value = e.target.value;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        
        if (value === '') {
          delete this.selectedOptions[productId][option];
        } else {
          this.selectedOptions[productId][option] = value;
          this.errors[productId] = '';
          this.updateErrorDisplay(productId);
        }
        
        console.log('✅ Option selected:', option, '=', value);
      });
    });

    // Quantity buttons
    this.querySelectorAll('.quantity-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.target.dataset.action;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        const quantityValueEl = card.querySelector('.quantity-value');
        
        let currentQty = this.quantities[productId] || 1;
        
        if (action === 'decrease' && currentQty > 1) {
          currentQty--;
        } else if (action === 'increase' && currentQty < 99) {
          currentQty++;
        }
        
        this.quantities[productId] = currentQty;
        quantityValueEl.textContent = currentQty;
        
        // Update button states
        const decreaseBtn = card.querySelector('.quantity-btn[data-action="decrease"]');
        const increaseBtn = card.querySelector('.quantity-btn[data-action="increase"]');
        
        decreaseBtn.disabled = currentQty <= 1;
        increaseBtn.disabled = currentQty >= 99;
        
        console.log('✅ Quantity updated:', productId, '=', currentQty);
      });
    });

    // Action buttons
    this.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.target.dataset.action;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        const product = this.products.find(p => p.id === productId);
        
        if (action === 'view') {
          console.log('👁️ View product:', productId);
          this.dispatchEvent(new CustomEvent('viewProduct', {
            detail: { productId, productUrl: product.productUrl }
          }));
        } else if (action === 'add') {
          // Validate before adding
          if (this.validateOptions(productId)) {
            const choices = this.selectedOptions[productId];
            const quantity = this.quantities[productId] || 1;
            console.log('🛒 Add to cart:', productId, choices, 'qty:', quantity);
            this.dispatchEvent(new CustomEvent('addToCart', {
              detail: { productId, choices, quantity }
            }));
          }
        }
      });
    });
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
    container.style.setProperty('--button-bg', this.settings.buttonBgColor);
    container.style.setProperty('--button-text', this.settings.buttonTextColor);
    container.style.setProperty('--button-hover-bg', this.settings.buttonHoverBgColor);
    container.style.setProperty('--image-height', `${this.settings.imageHeight}px`);
    container.style.setProperty('--image-border-radius', `${this.settings.imageBorderRadius}px`);
    container.style.setProperty('--card-shadow', this.getShadowCSS());
    container.style.setProperty('--columns-desktop', this.settings.columnsDesktop);
    container.style.setProperty('--columns-tablet', this.settings.columnsTablet);
    container.style.setProperty('--columns-mobile', this.settings.columnsMobile);
    container.style.setProperty('--ribbon-bg', this.settings.ribbonBgColor);
    container.style.setProperty('--ribbon-text', this.settings.ribbonTextColor);
    container.style.setProperty('--load-more-bg', this.settings.loadMoreBgColor);
    container.style.setProperty('--load-more-text', this.settings.loadMoreTextColor);
    container.style.setProperty('--load-more-border', this.settings.loadMoreBorderColor);
  }
}

customElements.define('product-gallery', ProductGalleryElement);
