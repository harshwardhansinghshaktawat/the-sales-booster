class ProductCard extends HTMLElement {
  constructor() {
    super();
    this.selectedOptions = {};
    this.quantities = {};
    this.products = [];
    this.errors = {};
    this.loadedImages = new Set();
    this.settings = {
      color1: '#667eea',
      color2: '#ffffff',
      color3: '#1a202c',
      color4: '#764ba2',
      color5: '#f7fafc',
      color6: '#e2e8f0',
      color7: '#cbd5e0',
      color8: '#4a5568',
      borderWidth: 0,
      cornerRadius: 16,
      titleFontFamily: 'Arial',
      titleFontSize: 18,
      priceFontFamily: 'Arial',
      priceFontSize: 24,
      buttonFontFamily: 'Arial',
      buttonFontSize: 14
    };
  }

  connectedCallback() {
    this.render();
    this.setupIntersectionObserver();
  }

  static get observedAttributes() {
    return ['products-data', 'error-data', 'settings'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'products-data' && newVal && newVal !== oldVal) {
      try {
        this.products = JSON.parse(newVal);
        console.log('📦 Custom element received products:', this.products.length);
        this.products.forEach(p => {
          this.selectedOptions[p._id] = {};
          this.quantities[p._id] = 1;
          this.errors[p._id] = '';
        });
        this.render();
      } catch (error) {
        console.error('Error parsing products data:', error);
      }
    }
    
    if (name === 'error-data' && newVal && newVal !== oldVal) {
      try {
        const errorData = JSON.parse(newVal);
        console.log('❌ Custom element received error:', errorData);
        this.errors[errorData.productId] = errorData.message;
        this.updateErrorDisplay(errorData.productId);
      } catch (error) {
        console.error('Error parsing error data:', error);
      }
    }

    if (name === 'settings' && newVal && newVal !== oldVal) {
      try {
        const newSettings = JSON.parse(newVal);
        Object.assign(this.settings, newSettings);
        this.updateStyles();
      } catch (error) {
        console.error('Error parsing settings:', error);
      }
    }
  }

  optimizeImageUrl(url, width = 375, height = 375) {
    if (!url) return '';
    
    try {
      const mediaMatch = url.match(/\/media\/([^/]+)/);
      if (!mediaMatch) return url;
      
      const mediaId = mediaMatch[1];
      const optimizedUrl = `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${width},h_${height},al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${mediaId}`;
      
      return optimizedUrl;
    } catch (error) {
      console.error('Error optimizing image URL:', error);
      return url;
    }
  }

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

    this.querySelectorAll('img[data-src]').forEach(img => {
      observer.observe(img);
    });
  }

  validateOptions(productId) {
    const product = this.products.find(p => p._id === productId);
    if (!product || !product.productOptions || product.productOptions.length === 0) {
      return true;
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

  updateStyles() {
    const root = this.querySelector(':host') || this;
    
    // Update CSS variables
    const container = this.querySelector('.grid');
    if (container) {
      container.style.setProperty('--color1', this.settings.color1);
      container.style.setProperty('--color2', this.settings.color2);
      container.style.setProperty('--color3', this.settings.color3);
      container.style.setProperty('--color4', this.settings.color4);
      container.style.setProperty('--color5', this.settings.color5);
      container.style.setProperty('--color6', this.settings.color6);
      container.style.setProperty('--color7', this.settings.color7);
      container.style.setProperty('--color8', this.settings.color8);
      container.style.setProperty('--title-font-family', this.settings.titleFontFamily);
      container.style.setProperty('--title-font-size', `${this.settings.titleFontSize}px`);
      container.style.setProperty('--price-font-family', this.settings.priceFontFamily);
      container.style.setProperty('--price-font-size', `${this.settings.priceFontSize}px`);
      container.style.setProperty('--button-font-family', this.settings.buttonFontFamily);
      container.style.setProperty('--button-font-size', `${this.settings.buttonFontSize}px`);
      container.style.setProperty('--border-width', `${this.settings.borderWidth}px`);
      container.style.setProperty('--corner-radius', `${this.settings.cornerRadius}px`);
    }
  }

  render() {
    console.log('🎨 Rendering custom element, products count:', this.products.length);
    if (!this.products.length) {
      this.innerHTML = '<div style="padding: 20px; text-align: center;">Loading products...</div>';
      return;
    }

    this.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        .grid {
          --color1: ${this.settings.color1};
          --color2: ${this.settings.color2};
          --color3: ${this.settings.color3};
          --color4: ${this.settings.color4};
          --color5: ${this.settings.color5};
          --color6: ${this.settings.color6};
          --color7: ${this.settings.color7};
          --color8: ${this.settings.color8};
          --title-font-family: ${this.settings.titleFontFamily};
          --title-font-size: ${this.settings.titleFontSize}px;
          --price-font-family: ${this.settings.priceFontFamily};
          --price-font-size: ${this.settings.priceFontSize}px;
          --button-font-family: ${this.settings.buttonFontFamily};
          --button-font-size: ${this.settings.buttonFontSize}px;
          --border-width: ${this.settings.borderWidth}px;
          --corner-radius: ${this.settings.cornerRadius}px;
          
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 32px;
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .card {
          position: relative;
          border-radius: var(--corner-radius);
          overflow: hidden;
          background: var(--color2);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          flex-direction: column;
          border: var(--border-width) solid var(--color6);
        }
        
        .card:hover {
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08);
          transform: translateY(-8px);
          border-color: rgba(0, 0, 0, 0.1);
        }
        
        .image-container {
          position: relative;
          width: 100%;
          padding-top: 100%;
          background: linear-gradient(135deg, var(--color5) 0%, var(--color6) 100%);
          overflow: hidden;
        }
        
        .image-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        
        .card img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          opacity: 0;
        }
        
        .card img.loaded {
          opacity: 1;
        }
        
        .card:hover img.loaded {
          transform: scale(1.08);
        }
        
        .card-content {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .product-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .card h3 {
          font-size: var(--title-font-size);
          font-family: var(--title-font-family);
          font-weight: 700;
          color: var(--color3);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          letter-spacing: -0.02em;
        }
        
        .card p.price {
          font-weight: 800;
          background: linear-gradient(135deg, var(--color1) 0%, var(--color4) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: var(--price-font-size);
          font-family: var(--price-font-family);
          letter-spacing: -0.03em;
        }
        
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--color6), transparent);
          margin: 8px 0;
        }
        
        .options-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }
        
        .option {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .option label {
          font-weight: 700;
          font-size: 0.85em;
          color: var(--color8);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .swatches {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .swatch {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          background-size: cover;
          background-position: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .swatch:hover {
          transform: scale(1.15) rotate(5deg);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
        
        .swatch.selected {
          border-color: var(--color1);
          box-shadow: 0 0 0 2px white, 0 0 0 4px var(--color1), 0 4px 12px rgba(102, 126, 234, 0.4);
          transform: scale(1.1);
        }
        
        .swatch::after {
          content: attr(title);
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color3);
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .swatch:hover::after {
          opacity: 1;
        }
        
        select {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid var(--color6);
          border-radius: 10px;
          font-size: 0.95em;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
          color: var(--color3);
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%234a5568' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }
        
        select:hover {
          border-color: var(--color7);
        }
        
        select:focus {
          border-color: var(--color1);
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .error-message {
          color: #e53e3e;
          font-size: 0.85em;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
          border-radius: 10px;
          display: none;
          font-weight: 600;
          border-left: 4px solid #e53e3e;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .quantity-selector {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: linear-gradient(135deg, var(--color5) 0%, #edf2f7 100%);
          border-radius: 12px;
          border: 2px solid var(--color6);
        }
        
        .quantity-selector label {
          font-weight: 700;
          font-size: 0.85em;
          color: var(--color8);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 6px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        .quantity-btn {
          width: 36px;
          height: 36px;
          border: 2px solid var(--color6);
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1.3em;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          color: var(--color8);
          padding: 0;
        }
        
        .quantity-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, var(--color1) 0%, var(--color4) 100%);
          border-color: var(--color1);
          color: white;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .quantity-btn:active:not(:disabled) {
          transform: scale(0.95);
        }
        
        .quantity-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
          background: var(--color5);
        }
        
        .quantity-value {
          min-width: 50px;
          text-align: center;
          font-size: 1.1em;
          font-weight: 800;
          color: var(--color3);
        }
        
        .button-group {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 12px;
          margin-top: 8px;
        }
        
        .btn {
          padding: 14px 20px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          font-size: var(--button-font-size);
          font-family: var(--button-font-family);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          text-align: center;
          letter-spacing: 0.3px;
          position: relative;
          overflow: hidden;
        }
        
        .btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        
        .btn:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .view-btn {
          background: white;
          color: var(--color8);
          border: 2px solid var(--color6);
          position: relative;
        }
        
        .view-btn:hover {
          background: var(--color5);
          border-color: var(--color7);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .add-btn {
          background: linear-gradient(135deg, var(--color1) 0%, var(--color4) 100%);
          color: white;
          position: relative;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .add-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
        }
        
        .add-btn:active {
          transform: translateY(-1px);
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 24px;
            padding: 20px;
          }
        }
        
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            padding: 16px;
          }
          
          .card-content {
            padding: 20px;
            gap: 14px;
          }
          
          .card h3 {
            font-size: calc(var(--title-font-size) * 0.9);
          }
          
          .card p.price {
            font-size: calc(var(--price-font-size) * 0.85);
          }
          
          .button-group {
            grid-template-columns: 1fr;
          }
          
          .view-btn {
            order: 2;
          }
          
          .add-btn {
            order: 1;
          }
          
          .swatch {
            width: 38px;
            height: 38px;
          }
        }
        
        @media (max-width: 480px) {
          .grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 16px;
            padding: 12px;
          }
          
          .card-content {
            padding: 16px;
            gap: 12px;
          }
          
          .card h3 {
            font-size: calc(var(--title-font-size) * 0.8);
          }
          
          .card p.price {
            font-size: calc(var(--price-font-size) * 0.75);
          }
          
          .btn {
            padding: 12px 16px;
            font-size: calc(var(--button-font-size) * 0.9);
          }
          
          .quantity-selector {
            padding: 12px;
          }
          
          .quantity-btn {
            width: 32px;
            height: 32px;
          }
          
          .swatch {
            width: 34px;
            height: 34px;
          }
        }
      </style>
      <div class="grid">
        ${this.products.map((p, index) => `
          <div class="card" data-product-id="${p._id}">
            <div class="image-container">
              <img 
                ${index < 6 ? `src="${this.optimizeImageUrl(p.media?.mainMedia?.image?.url, 375, 375)}"` : `data-src="${this.optimizeImageUrl(p.media?.mainMedia?.image?.url, 375, 375)}"`}
                alt="${p.name || 'Product'}"
                ${index < 6 ? 'onload="this.classList.add(\'loaded\')"' : 'loading="lazy"'}
              >
            </div>
            <div class="card-content">
              <div class="product-header">
                <h3>${p.name || 'Product'}</h3>
                <p class="price">${p.priceData?.formatted?.price || 'Price not available'}</p>
              </div>
              
              ${p.productOptions && p.productOptions.length > 0 ? `
                <div class="divider"></div>
                <div class="options-section">
                  ${p.productOptions.map(opt => `
                    <div class="option">
                      <label>${opt.name}</label>
                      ${opt.optionType === 'color' ? `
                        <div class="swatches">
                          ${opt.choices.map(c => `
                            <button 
                              class="swatch" 
                              style="background-color: ${c.value};" 
                              data-option="${opt.name}" 
                              data-value="${c.value}" 
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
                  <span class="quantity-value">${this.quantities[p._id] || 1}</span>
                  <button class="quantity-btn" data-action="increase" aria-label="Increase quantity">+</button>
                </div>
              </div>
              
              <div class="error-message" role="alert"></div>
              
              <div class="button-group">
                <button class="btn view-btn" data-action="view">View</button>
                <button class="btn add-btn" data-action="add">Add to Cart</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.setupIntersectionObserver();
    this.attachEventListeners();
    this.updateStyles();
  }

  attachEventListeners() {
    // Color swatches
    this.querySelectorAll('.swatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const option = e.target.dataset.option;
        const description = e.target.dataset.description;
        const card = e.target.closest('.card');
        const productId = card.dataset.productId;
        
        this.selectedOptions[productId][option] = description;
        this.errors[productId] = '';
        this.updateErrorDisplay(productId);

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
        const card = e.target.closest('.card');
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
        const card = e.target.closest('.card');
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
        const card = e.target.closest('.card');
        const productId = card.dataset.productId;
        const product = this.products.find(p => p._id === productId);
        
        if (action === 'view') {
          console.log('👁️ View product:', productId);
          this.dispatchEvent(new CustomEvent('viewProduct', {
            detail: { productId, product }
          }));
        } else if (action === 'add') {
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
}

customElements.define('product-card-element', ProductCard);
