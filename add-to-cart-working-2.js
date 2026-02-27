class ProductCard extends HTMLElement {
  constructor() {
    super();
    this.selectedOptions = {};
    this.quantities = {};
    this.products = [];
    this.errors = {};
    this.loadedImages = new Set();
    
    // Default style props
    this.styleProps = {
      primaryBg: '#ffffff',
      secondaryBg: '#f8f9fa',
      borderColor: '#e5e7eb',
      shapesColor: '#f3f4f6',
      primaryAccent: '#3b82f6',
      hoverAccent: '#2563eb',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      priceColor: '#111827',
      errorColor: '#ef4444',
      errorBg: '#fee2e2',
      successColor: '#10b981',
      cardRadius: '12',
      spacing: '16',
      fontSize: '16'
    };
  }

  connectedCallback() {
    this.render();
    this.setupIntersectionObserver();
  }

  static get observedAttributes() {
    return ['products-data', 'error-data', 'style-props'];
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
    
    if (name === 'style-props' && newVal && newVal !== oldVal) {
      try {
        const newStyleProps = JSON.parse(newVal);
        this.styleProps = { ...this.styleProps, ...newStyleProps };
        this.updateStyles();
      } catch (error) {
        console.error('Error parsing style props:', error);
      }
    }
  }

  updateStyles() {
    const styleElement = this.querySelector('style');
    if (styleElement) {
      styleElement.textContent = this.getStyles();
    }
  }

  getStyles() {
    const {
      primaryBg, secondaryBg, borderColor, shapesColor, primaryAccent, hoverAccent,
      shadowColor, textPrimary, textSecondary, priceColor, errorColor, errorBg,
      successColor, cardRadius, spacing, fontSize
    } = this.styleProps;

    return `
      * {
        box-sizing: border-box;
      }
      
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
        gap: ${parseInt(spacing) + 8}px;
        padding: ${spacing}px;
        background: ${secondaryBg};
      }
      
      .card {
        border: 2px solid ${borderColor};
        border-radius: ${cardRadius}px;
        overflow: hidden;
        background: ${primaryBg};
        box-shadow: 0 2px 8px ${shadowColor};
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        position: relative;
      }
      
      .card:hover {
        box-shadow: 0 12px 24px ${shadowColor}, 0 0 0 3px ${primaryAccent}15;
        transform: translateY(-4px);
        border-color: ${primaryAccent};
      }
      
      .image-container {
        position: relative;
        width: 100%;
        padding-top: 100%;
        background: linear-gradient(135deg, ${shapesColor} 0%, ${secondaryBg} 100%);
        overflow: hidden;
      }
      
      .image-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: shimmer 2s infinite;
      }
      
      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }
      
      .ribbon {
        position: absolute;
        top: 12px;
        right: 12px;
        background: ${errorColor};
        color: ${primaryBg};
        padding: 6px 12px;
        border-radius: 20px;
        font-size: ${parseInt(fontSize) - 5}px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px ${shadowColor};
        z-index: 2;
      }
      
      .card img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
      }
      
      .card img.loaded {
        opacity: 1;
      }
      
      .card:hover img.loaded {
        transform: scale(1.08);
      }
      
      .card-content {
        padding: ${parseInt(spacing) + 8}px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: ${parseInt(spacing) - 2}px;
      }
      
      .card h3 {
        font-size: ${parseInt(fontSize) + 4}px;
        margin: 0;
        font-weight: 700;
        color: ${textPrimary};
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: ${(parseInt(fontSize) + 4) * 1.4 * 2}px;
      }
      
      .price-container {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .card p.price {
        font-weight: 800;
        color: ${priceColor};
        font-size: ${parseInt(fontSize) + 10}px;
        margin: 0;
        letter-spacing: -0.5px;
      }
      
      .card p.price.discounted {
        color: ${errorColor};
      }
      
      .card p.original-price {
        font-weight: 600;
        color: ${textSecondary};
        font-size: ${parseInt(fontSize) + 2}px;
        margin: 0;
        text-decoration: line-through;
        opacity: 0.7;
      }
      
      .discount-badge {
        background: ${successColor};
        color: ${primaryBg};
        padding: 4px 8px;
        border-radius: 12px;
        font-size: ${parseInt(fontSize) - 5}px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
      
      .options-section {
        margin: ${parseInt(spacing) / 2}px 0;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: ${parseInt(spacing)}px;
      }
      
      .option {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .option label {
        display: block;
        font-weight: 600;
        font-size: ${parseInt(fontSize) - 3}px;
        color: ${textSecondary};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .swatch {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid ${borderColor};
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        background-size: cover;
        background-position: center;
        box-shadow: 0 2px 4px ${shadowColor};
      }
      
      .swatch:hover {
        transform: scale(1.15);
        border-color: ${primaryAccent};
        box-shadow: 0 4px 8px ${shadowColor};
      }
      
      .swatch.selected {
        border-color: ${primaryAccent};
        box-shadow: 0 0 0 2px ${primaryBg}, 0 0 0 4px ${primaryAccent}, 0 4px 8px ${shadowColor};
        transform: scale(1.1);
      }
      
      .swatch::after {
        content: attr(title);
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%) scale(0.9);
        background: ${textPrimary};
        color: ${primaryBg};
        padding: 4px 8px;
        border-radius: 4px;
        font-size: ${parseInt(fontSize) - 6}px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s;
        font-weight: 600;
        box-shadow: 0 4px 8px ${shadowColor};
        z-index: 10;
      }
      
      .swatch:hover::after {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }
      
      select {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid ${borderColor};
        border-radius: ${parseInt(cardRadius) / 2}px;
        font-size: ${parseInt(fontSize) - 2}px;
        background: ${primaryBg};
        color: ${textPrimary};
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%236b7280' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        padding-right: 36px;
      }
      
      select:hover {
        border-color: ${primaryAccent};
        box-shadow: 0 0 0 3px ${primaryAccent}15;
      }
      
      select:focus {
        border-color: ${primaryAccent};
        outline: none;
        box-shadow: 0 0 0 4px ${primaryAccent}20;
      }
      
      .error-message {
        color: ${errorColor};
        font-size: ${parseInt(fontSize) - 3}px;
        margin: 0;
        padding: 8px 10px;
        background: ${errorBg};
        border-radius: ${parseInt(cardRadius) / 2}px;
        display: none;
        font-weight: 600;
        border-left: 3px solid ${errorColor};
      }
      
      .quantity-selector {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px;
        background: ${secondaryBg};
        border-radius: ${parseInt(cardRadius) / 2}px;
        border: 2px solid ${borderColor};
      }
      
      .quantity-selector label {
        font-weight: 700;
        font-size: ${parseInt(fontSize) - 3}px;
        color: ${textPrimary};
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .quantity-btn {
        width: 32px;
        height: 32px;
        border: 2px solid ${borderColor};
        background: ${primaryBg};
        border-radius: ${parseInt(cardRadius) / 3}px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        color: ${textPrimary};
        padding: 0;
        box-shadow: 0 2px 4px ${shadowColor};
      }
      
      .quantity-btn:hover:not(:disabled) {
        background: ${primaryAccent};
        border-color: ${primaryAccent};
        color: ${primaryBg};
        transform: scale(1.1);
        box-shadow: 0 4px 8px ${shadowColor};
      }
      
      .quantity-btn:active:not(:disabled) {
        transform: scale(0.95);
      }
      
      .quantity-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        background: ${shapesColor};
      }
      
      .quantity-value {
        min-width: 32px;
        text-align: center;
        font-size: ${parseInt(fontSize) + 2}px;
        font-weight: 800;
        color: ${textPrimary};
        letter-spacing: -0.5px;
      }
      
      .button-group {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 10px;
        margin-top: auto;
      }
      
      .btn {
        padding: 12px 16px;
        border: none;
        border-radius: ${parseInt(cardRadius) / 2}px;
        cursor: pointer;
        font-weight: 700;
        font-size: ${parseInt(fontSize) - 2}px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        white-space: nowrap;
      }
      
      .view-btn {
        background: ${secondaryBg};
        color: ${textPrimary};
        border: 2px solid ${borderColor};
      }
      
      .view-btn:hover {
        background: ${shapesColor};
        border-color: ${primaryAccent};
        transform: translateY(-2px);
        box-shadow: 0 4px 8px ${shadowColor};
      }
      
      .add-btn {
        background: ${primaryAccent};
        color: ${primaryBg};
        border: 2px solid ${primaryAccent};
        box-shadow: 0 2px 8px ${primaryAccent}40;
      }
      
      .add-btn:hover {
        background: ${hoverAccent};
        border-color: ${hoverAccent};
        transform: translateY(-2px);
        box-shadow: 0 6px 16px ${primaryAccent}50;
      }
      
      .add-btn:active,
      .view-btn:active {
        transform: translateY(0);
      }
      
      @media (max-width: 1024px) {
        .grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
          gap: ${parseInt(spacing) + 4}px;
        }
      }
      
      @media (max-width: 768px) {
        .grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
          gap: ${parseInt(spacing)}px;
          padding: ${parseInt(spacing) - 4}px;
        }
        
        .card h3 {
          font-size: ${parseInt(fontSize) + 2}px;
          min-height: ${(parseInt(fontSize) + 2) * 1.4 * 2}px;
        }
        
        .card p.price {
          font-size: ${parseInt(fontSize) + 6}px;
        }
        
        .card-content {
          padding: ${parseInt(spacing) + 4}px;
        }
        
        .button-group {
          grid-template-columns: 1fr;
        }
        
        .btn {
          padding: 12px 14px;
          font-size: ${parseInt(fontSize) - 3}px;
        }
        
        .swatch {
          width: 28px;
          height: 28px;
        }
        
        .ribbon {
          top: 8px;
          right: 8px;
          padding: 4px 10px;
          font-size: ${parseInt(fontSize) - 6}px;
        }
      }
      
      @media (max-width: 480px) {
        .grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 160px), 1fr));
          gap: ${parseInt(spacing) - 4}px;
        }
        
        .card h3 {
          font-size: ${parseInt(fontSize)}px;
          min-height: ${parseInt(fontSize) * 1.4 * 2}px;
        }
        
        .card p.price {
          font-size: ${parseInt(fontSize) + 4}px;
        }
        
        .card-content {
          padding: ${parseInt(spacing)}px;
        }
        
        .swatch {
          width: 24px;
          height: 24px;
        }
        
        .quantity-selector {
          padding: 10px;
        }
        
        .ribbon {
          top: 6px;
          right: 6px;
          padding: 3px 8px;
          font-size: ${parseInt(fontSize) - 7}px;
        }
        
        .discount-badge {
          font-size: ${parseInt(fontSize) - 6}px;
          padding: 3px 6px;
        }
      }
    `;
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

  calculateDiscount(originalPrice, discountedPrice) {
    // Extract numeric values from price strings
    const getNumericPrice = (priceStr) => {
      if (!priceStr) return 0;
      const numStr = priceStr.replace(/[^0-9.]/g, '');
      return parseFloat(numStr) || 0;
    };

    const original = getNumericPrice(originalPrice);
    const discounted = getNumericPrice(discountedPrice);

    if (original > 0 && discounted > 0 && original > discounted) {
      const discount = Math.round(((original - discounted) / original) * 100);
      return discount;
    }
    return 0;
  }

  render() {
    console.log('🎨 Rendering custom element, products count:', this.products.length);
    if (!this.products.length) {
      this.innerHTML = `
        <style>${this.getStyles()}</style>
        <div style="padding: 40px; text-align: center; color: ${this.styleProps.textSecondary}; font-size: 18px;">
          Loading products...
        </div>
      `;
      return;
    }

    this.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="grid">
        ${this.products.map((p, index) => {
          const hasDiscount = p.priceData?.formatted?.discountedPrice && 
                              p.priceData?.formatted?.discountedPrice !== p.priceData?.formatted?.price;
          const discountPercent = hasDiscount ? 
            this.calculateDiscount(p.priceData?.formatted?.price, p.priceData?.formatted?.discountedPrice) : 0;
          
          return `
          <div class="card" data-product-id="${p._id}">
            <div class="image-container">
              ${p.ribbon ? `<div class="ribbon">${p.ribbon}</div>` : ''}
              <img 
                ${index < 6 ? `src="${this.optimizeImageUrl(p.media?.mainMedia?.image?.url, 375, 375)}"` : `data-src="${this.optimizeImageUrl(p.media?.mainMedia?.image?.url, 375, 375)}"`}
                alt="${p.name || 'Product'}"
                ${index < 6 ? 'onload="this.classList.add(\'loaded\')"' : 'loading="lazy"'}
              >
            </div>
            <div class="card-content">
              <h3>${p.name || 'Product'}</h3>
              
              <div class="price-container">
                ${hasDiscount ? `
                  <p class="price discounted">${p.priceData.formatted.discountedPrice}</p>
                  <p class="original-price">${p.priceData.formatted.price}</p>
                  ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
                ` : `
                  <p class="price">${p.priceData?.formatted?.price || 'Price not available'}</p>
                `}
              </div>
              
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
              ` : ''}
              
              <div class="quantity-selector">
                <label>Qty</label>
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
        `;
        }).join('')}
      </div>
    `;

    this.setupIntersectionObserver();
    this.attachEventListeners();
  }

  attachEventListeners() {
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
