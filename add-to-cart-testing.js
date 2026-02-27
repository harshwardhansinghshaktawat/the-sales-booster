class ProductCard extends HTMLElement {
  constructor() {
    super();
    this.selectedOptions = {};
    this.products = [];
    this.errors = {};
    this.loadedImages = new Set();
  }

  connectedCallback() {
    this.render();
    this.setupIntersectionObserver();
  }

  static get observedAttributes() {
    return ['products-data'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'products-data' && newVal && newVal !== oldVal) {
      try {
        this.products = JSON.parse(newVal);
        console.log('📦 Custom element received products:', this.products.length);
        this.products.forEach(p => {
          this.selectedOptions[p._id] = {};
          this.errors[p._id] = '';
        });
        this.render();
      } catch (error) {
        console.error('Error parsing products data:', error);
      }
    }
  }

  // Optimize Wix image URL
  optimizeImageUrl(url, width = 300, height = 300) {
    if (!url) return '';
    
    // Add Wix image optimization parameters
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}w=${width}&h=${height}&fit=fill&q=80`;
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
    const product = this.products.find(p => p._id === productId);
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
        }
        
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
          padding: 16px;
        }
        
        .card {
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }
        
        .card:hover {
          box-shadow: 0 8px 16px rgba(0,0,0,0.12);
          transform: translateY(-4px);
        }
        
        .image-container {
          position: relative;
          width: 100%;
          padding-top: 100%; /* 1:1 Aspect Ratio */
          background: #f5f5f5;
          overflow: hidden;
        }
        
        .card img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.3s ease, transform 0.3s ease;
          opacity: 0;
        }
        
        .card img.loaded {
          opacity: 1;
        }
        
        .card:hover img {
          transform: scale(1.05);
        }
        
        .card-content {
          padding: 16px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .card h3 {
          font-size: 1.1em;
          margin: 0 0 8px 0;
          font-weight: 600;
          color: #333;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .card p.price {
          font-weight: bold;
          color: #000;
          font-size: 1.2em;
          margin: 0 0 16px 0;
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
        
        @media (max-width: 768px) {
          .grid {
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 16px;
            padding: 12px;
          }
          
          .card h3 {
            font-size: 0.95em;
          }
          
          .card p.price {
            font-size: 1em;
          }
          
          .button-group {
            flex-direction: column;
          }
        }
      </style>
      <div class="grid">
        ${this.products.map(p => `
          <div class="card" data-product-id="${p._id}">
            <div class="image-container">
              <img 
                data-src="${this.optimizeImageUrl(p.media?.mainMedia?.image?.url, 400, 400)}" 
                alt="${p.name || 'Product'}"
                loading="lazy"
              >
            </div>
            <div class="card-content">
              <h3>${p.name || 'Product'}</h3>
              <p class="price">${p.priceData?.formatted?.price || 'Price not available'}</p>
              
              ${p.productOptions && p.productOptions.length > 0 ? `
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
                <div class="error-message" role="alert"></div>
              ` : ''}
              
              <div class="button-group">
                <button class="btn view-btn" data-action="view">View Product</button>
                <button class="btn add-btn" data-action="add">Add to Cart</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Setup lazy loading after render
    this.setupIntersectionObserver();
    this.attachEventListeners();
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
          // Validate before adding
          if (this.validateOptions(productId)) {
            const choices = this.selectedOptions[productId];
            console.log('🛒 Add to cart:', productId, choices);
            this.dispatchEvent(new CustomEvent('addToCart', {
              detail: { productId, choices }
            }));
          }
        }
      });
    });
  }
}

customElements.define('product-card-element', ProductCard);
