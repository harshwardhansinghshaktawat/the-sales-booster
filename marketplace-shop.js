class MarketplaceShop extends HTMLElement {
  constructor() {
    super();
    this.selectedOptions = {};
    this.quantities = {};
    this.categoriesData = [];
    this.errors = {};
    this.loadedImages = new Set();
    this.currentSlides = {};
    this.autoSlideIntervals = {};
    
    // Default style props
    this.styleProps = {
      // Colors (13)
      color1: '#ffffff',
      color2: '#f8f9fa',
      color3: '#e5e7eb',
      color4: '#f3f4f6',
      color5: '#3b82f6',
      color6: '#2563eb',
      color7: 'rgba(0, 0, 0, 0.1)',
      color8: '#1f2937',
      color9: '#6b7280',
      color10: '#111827',
      color11: '#ef4444',
      color12: '#fee2e2',
      color13: '#10b981',
      
      // Sliders (3)
      slider1: '16',
      slider2: '20',
      slider3: '14',
      
      // Text Inputs (20)
      text1: 'Flash Deals',
      text2: 'Limited Time Offers',
      text3: 'Trending Products',
      text4: "What's Hot Right Now",
      text5: 'Best Sellers',
      text6: 'Most Popular Items',
      text7: 'New Arrivals',
      text8: 'Just Landed',
      text9: 'Featured Categories',
      text10: 'Shop by Category',
      text11: 'Top Rated',
      text12: 'Customer Favorites',
      text13: 'Special Offers',
      text14: 'Deals You Cannot Miss',
      text15: 'Special Mid-Season Sale!',
      text16: "Don't miss out on incredible deals",
      text17: 'Shop Sale Items',
      text18: '/shop', // Promo Banner URL
      text19: '',
      text20: ''
    };
  }

  connectedCallback() {
    this.render();
    this.setupIntersectionObserver();
  }

  disconnectedCallback() {
    // Clear all auto-slide intervals
    Object.values(this.autoSlideIntervals).forEach(interval => clearInterval(interval));
  }

  static get observedAttributes() {
    return ['categories-data', 'error-data', 'style-props'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'categories-data' && newVal && newVal !== oldVal) {
      try {
        this.categoriesData = JSON.parse(newVal);
        console.log('📦 Received categories data:', this.categoriesData.length, 'categories');
        
        this.categoriesData.forEach(category => {
          if (category.products) {
            category.products.forEach(p => {
              this.selectedOptions[p._id] = {};
              this.quantities[p._id] = 1;
              this.errors[p._id] = '';
            });
          }
        });
        
        this.render();
      } catch (error) {
        console.error('Error parsing categories data:', error);
      }
    }
    
    if (name === 'error-data' && newVal && newVal !== oldVal) {
      try {
        const errorData = JSON.parse(newVal);
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
      color1, color2, color3, color4, color5, color6, color7, color8, color9, color10,
      color11, color12, color13, slider1, slider2, slider3
    } = this.styleProps;

    const radius = parseInt(slider1);
    const spacing = parseInt(slider2);
    const fontSize = parseInt(slider3);

    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      .marketplace-container {
        width: 100%;
        background: ${color2};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif;
        padding: ${spacing * 3}px 0;
      }
      
      /* Main Content */
      .main-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 ${spacing * 2}px;
      }
      
      /* Section Container */
      .section {
        margin: ${spacing * 5}px 0;
      }
      
      .section-header {
        text-align: center;
        margin-bottom: ${spacing * 3}px;
      }
      
      .section-title {
        font-size: ${fontSize * 2.5}px;
        font-weight: 900;
        color: ${color8};
        margin-bottom: ${spacing}px;
        letter-spacing: -1px;
      }
      
      .section-subtitle {
        font-size: ${fontSize + 2}px;
        color: ${color9};
        font-weight: 400;
      }
      
      /* Infinite Scroll Slider Container */
      .product-slider {
        position: relative;
        overflow: hidden;
        margin: 0 -${spacing * 2}px;
      }
      
      .slider-wrapper {
        display: flex;
        width: 100%;
      }
      
      .slider-track {
        display: flex;
        gap: ${spacing * 1.5}px;
        animation: infiniteScroll 40s linear infinite;
        will-change: transform;
      }
      
      .slider-track:hover {
        animation-play-state: paused;
      }
      
      @keyframes infiniteScroll {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }
      
      .slider-track.paused {
        animation-play-state: paused;
      }
      
      /* Product Grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: ${spacing * 2}px;
      }
      
      /* Product Card - Fixed Height */
      .product-card {
        background: ${color1};
        border: 2px solid ${color3};
        border-radius: ${radius}px;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        position: relative;
        cursor: pointer;
        min-width: 280px;
        height: 480px;
      }
      
      .product-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px ${color7};
        border-color: ${color5};
      }
      
      /* Image Container - Fixed Height */
      .image-container {
        position: relative;
        width: 100%;
        height: 280px;
        background: linear-gradient(135deg, ${color2} 0%, #e0e7ff 100%);
        overflow: hidden;
        flex-shrink: 0;
      }
      
      .product-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
      }
      
      .product-card img.loaded {
        opacity: 1;
      }
      
      .product-card:hover img.loaded {
        transform: scale(1.1);
      }
      
      /* Badges */
      .badges {
        position: absolute;
        top: ${spacing}px;
        left: ${spacing}px;
        right: ${spacing}px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        z-index: 2;
      }
      
      .ribbon {
        background: ${color11};
        color: ${color1};
        padding: 6px 12px;
        border-radius: ${radius}px;
        font-size: ${fontSize - 6}px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      
      .discount-percent {
        background: ${color13};
        color: ${color1};
        padding: 6px 12px;
        border-radius: ${radius}px;
        font-size: ${fontSize - 4}px;
        font-weight: 900;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      
      /* Card Body - Fixed Height */
      .card-body {
        padding: ${spacing * 1.5}px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: ${spacing - 4}px;
        min-height: 0;
      }
      
      .product-name {
        font-size: ${fontSize}px;
        font-weight: 700;
        color: ${color8};
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        height: ${fontSize * 1.4 * 2}px;
        margin: 0;
      }
      
      /* Price Section */
      .price-section {
        display: flex;
        align-items: center;
        gap: ${spacing - 4}px;
        flex-wrap: wrap;
      }
      
      .current-price {
        font-size: ${fontSize + 6}px;
        font-weight: 900;
        color: ${color10};
        letter-spacing: -0.5px;
      }
      
      .current-price.discounted {
        color: ${color11};
      }
      
      .original-price {
        font-size: ${fontSize - 1}px;
        color: ${color9};
        text-decoration: line-through;
        font-weight: 600;
      }
      
      /* Options Dropdown - Compact */
      .options-compact {
        position: relative;
      }
      
      .options-trigger {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid ${color3};
        border-radius: ${radius - 2}px;
        font-size: ${fontSize - 4}px;
        font-weight: 600;
        background: ${color2};
        color: ${color8};
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .options-trigger:hover {
        border-color: ${color5};
      }
      
      .options-trigger.active {
        border-color: ${color5};
        background: ${color1};
      }
      
      .options-trigger .arrow {
        font-size: ${fontSize - 6}px;
        transition: transform 0.2s;
      }
      
      .options-trigger.active .arrow {
        transform: rotate(180deg);
      }
      
      .options-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: ${color1};
        border: 2px solid ${color5};
        border-radius: ${radius - 2}px;
        margin-top: 4px;
        padding: ${spacing - 4}px;
        display: none;
        z-index: 100;
        box-shadow: 0 8px 16px ${color7};
        max-height: 200px;
        overflow-y: auto;
      }
      
      .options-dropdown.active {
        display: block;
      }
      
      .option-group {
        margin-bottom: ${spacing - 4}px;
      }
      
      .option-group:last-child {
        margin-bottom: 0;
      }
      
      .option-label {
        font-size: ${fontSize - 6}px;
        font-weight: 700;
        color: ${color9};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
        display: block;
      }
      
      /* Color Swatches */
      .color-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      
      .color-swatch {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid ${color3};
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        background-size: cover;
        background-position: center;
      }
      
      .color-swatch:hover {
        transform: scale(1.15);
        border-color: ${color5};
      }
      
      .color-swatch.selected {
        border-color: ${color5};
        box-shadow: 0 0 0 2px ${color1}, 0 0 0 4px ${color5};
        transform: scale(1.12);
      }
      
      /* Dropdown Options */
      .option-select {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid ${color3};
        border-radius: ${radius - 4}px;
        font-size: ${fontSize - 5}px;
        font-weight: 600;
        background: ${color1};
        color: ${color8};
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .option-select:hover,
      .option-select:focus {
        border-color: ${color5};
        outline: none;
      }
      
      /* Quantity Selector */
      .quantity-section {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 8px;
        background: ${color2};
        border-radius: ${radius - 2}px;
        border: 1px solid ${color3};
      }
      
      .quantity-label {
        font-size: ${fontSize - 6}px;
        font-weight: 800;
        color: ${color8};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .qty-btn {
        width: 24px;
        height: 24px;
        border: 1px solid ${color3};
        background: ${color1};
        border-radius: ${radius - 4}px;
        cursor: pointer;
        font-size: ${fontSize - 2}px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        color: ${color8};
      }
      
      .qty-btn:hover:not(:disabled) {
        background: ${color5};
        border-color: ${color5};
        color: ${color1};
        transform: scale(1.1);
      }
      
      .qty-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .qty-value {
        min-width: 24px;
        text-align: center;
        font-size: ${fontSize - 2}px;
        font-weight: 900;
        color: ${color8};
      }
      
      /* Error Message */
      .error-msg {
        color: ${color11};
        background: ${color12};
        padding: 4px 6px;
        border-radius: ${radius - 4}px;
        font-size: ${fontSize - 7}px;
        font-weight: 700;
        border-left: 3px solid ${color11};
        display: none;
      }
      
      /* Action Buttons */
      .actions {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px;
        margin-top: auto;
      }
      
      .action-btn {
        padding: 10px 14px;
        border: none;
        border-radius: ${radius - 2}px;
        cursor: pointer;
        font-weight: 700;
        font-size: ${fontSize - 4}px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
      }
      
      .view-btn {
        background: ${color1};
        color: ${color5};
        border: 2px solid ${color5};
      }
      
      .view-btn:hover {
        background: ${color2};
        transform: translateY(-2px);
      }
      
      .cart-btn {
        background: linear-gradient(135deg, ${color5} 0%, ${color6} 100%);
        color: ${color1};
        border: 2px solid ${color5};
        box-shadow: 0 4px 12px ${color5}30;
      }
      
      .cart-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px ${color5}50;
      }
      
      /* Category Cards */
      .category-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: ${spacing * 1.5}px;
      }
      
      .category-card {
        background: ${color1};
        border: 2px solid ${color3};
        border-radius: ${radius}px;
        padding: ${spacing * 2.5}px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        height: 200px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      
      .category-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, ${color5}10 0%, ${color6}10 100%);
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .category-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 12px 24px ${color7};
        border-color: ${color5};
      }
      
      .category-card:hover::before {
        opacity: 1;
      }
      
      .category-icon {
        font-size: ${fontSize * 3.5}px;
        margin-bottom: ${spacing}px;
        position: relative;
        z-index: 1;
      }
      
      .category-name {
        font-size: ${fontSize + 2}px;
        font-weight: 700;
        color: ${color8};
        margin-bottom: ${spacing / 2}px;
        position: relative;
        z-index: 1;
      }
      
      .category-count {
        font-size: ${fontSize - 4}px;
        color: ${color9};
        position: relative;
        z-index: 1;
      }
      
      /* Promotional Banner */
      .promo-banner {
        background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%);
        border-radius: ${radius * 2}px;
        padding: ${spacing * 4}px ${spacing * 2}px;
        text-align: center;
        color: ${color1};
        margin: ${spacing * 4}px 0;
        position: relative;
        overflow: hidden;
      }
      
      .promo-banner::before {
        content: '';
        position: absolute;
        inset: -50%;
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255,255,255,0.05) 10px,
          rgba(255,255,255,0.05) 20px
        );
        animation: slidePattern 20s linear infinite;
      }
      
      @keyframes slidePattern {
        0% { transform: translate(0, 0); }
        100% { transform: translate(50px, 50px); }
      }
      
      .promo-content {
        position: relative;
        z-index: 1;
      }
      
      .promo-title {
        font-size: ${fontSize * 2.5}px;
        font-weight: 900;
        margin-bottom: ${spacing}px;
        text-shadow: 0 2px 10px rgba(0,0,0,0.3);
      }
      
      .promo-text {
        font-size: ${fontSize + 4}px;
        margin-bottom: ${spacing * 2}px;
        opacity: 0.95;
      }
      
      .promo-cta {
        display: inline-block;
        padding: ${spacing}px ${spacing * 3}px;
        background: ${color1};
        color: #8b5cf6;
        font-size: ${fontSize}px;
        font-weight: 700;
        border: none;
        border-radius: ${radius * 2}px;
        cursor: pointer;
        transition: all 0.3s;
        text-transform: uppercase;
        letter-spacing: 1px;
        text-decoration: none;
      }
      
      .promo-cta:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      }
      
      /* Empty State */
      .empty-state {
        text-align: center;
        padding: ${spacing * 6}px ${spacing * 2}px;
        color: ${color9};
      }
      
      .empty-icon {
        font-size: ${fontSize * 5}px;
        opacity: 0.3;
        margin-bottom: ${spacing * 2}px;
      }
      
      .empty-text {
        font-size: ${fontSize + 4}px;
        font-weight: 700;
        color: ${color8};
        margin-bottom: ${spacing}px;
      }
      
      /* Responsive */
      @media (max-width: 1200px) {
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }
      }
      
      @media (max-width: 768px) {
        .section-title {
          font-size: ${fontSize * 2}px;
        }
        
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: ${spacing}px;
        }
        
        .product-card {
          height: 460px;
        }
        
        .image-container {
          height: 260px;
        }
        
        .actions {
          grid-template-columns: 1fr;
        }
        
        .category-card {
          height: 180px;
        }
      }
      
      @media (max-width: 480px) {
        .main-content {
          padding: 0 ${spacing}px;
        }
        
        .products-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .product-card {
          min-width: auto;
          height: 440px;
        }
        
        .image-container {
          height: 240px;
        }
        
        .section {
          margin: ${spacing * 3}px 0;
        }
      }
    `;
  }

  optimizeImageUrl(url, width = 280, height = 280) {
    if (!url) return '';
    
    try {
      const mediaMatch = url.match(/\/media\/([^/]+)/);
      if (!mediaMatch) return url;
      
      const mediaId = mediaMatch[1];
      return `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${width},h_${height},al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${mediaId}`;
    } catch (error) {
      return url;
    }
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '100px',
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
    const product = this.findProductById(productId);
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

  findProductById(productId) {
    for (const category of this.categoriesData) {
      if (category.products) {
        const product = category.products.find(p => p._id === productId);
        if (product) return product;
      }
    }
    return null;
  }

  updateErrorDisplay(productId) {
    const card = this.querySelector(`[data-product-id="${productId}"]`);
    if (card) {
      const errorEl = card.querySelector('.error-msg');
      if (errorEl) {
        errorEl.textContent = this.errors[productId] || '';
        errorEl.style.display = this.errors[productId] ? 'block' : 'none';
      }
    }
  }

  calculateDiscount(originalPrice, discountedPrice) {
    const getNumericPrice = (priceStr) => {
      if (!priceStr) return 0;
      const numStr = priceStr.replace(/[^0-9.]/g, '');
      return parseFloat(numStr) || 0;
    };

    const original = getNumericPrice(originalPrice);
    const discounted = getNumericPrice(discountedPrice);

    if (original > 0 && discounted > 0 && original > discounted) {
      return Math.round(((original - discounted) / original) * 100);
    }
    return 0;
  }

  getSelectedOptionsText(productId) {
    const product = this.findProductById(productId);
    if (!product || !product.productOptions || product.productOptions.length === 0) {
      return 'No options available';
    }

    const selected = this.selectedOptions[productId] || {};
    const selectedCount = Object.keys(selected).length;
    
    if (selectedCount === 0) {
      return 'Select options';
    }
    
    return `${selectedCount} option${selectedCount > 1 ? 's' : ''} selected`;
  }

  renderProductCard(product, index) {
    const hasDiscount = product.priceData?.formatted?.discountedPrice && 
                        product.priceData?.formatted?.discountedPrice !== product.priceData?.formatted?.price;
    const discountPercent = hasDiscount ? 
      this.calculateDiscount(product.priceData?.formatted?.price, product.priceData?.formatted?.discountedPrice) : 0;
    
    const hasOptions = product.productOptions && product.productOptions.length > 0;
    
    return `
      <div class="product-card" data-product-id="${product._id}">
        <div class="image-container">
          <div class="badges">
            ${product.ribbon ? `<div class="ribbon">${product.ribbon}</div>` : ''}
            ${discountPercent > 0 ? `<div class="discount-percent">-${discountPercent}%</div>` : ''}
          </div>
          
          <img 
            ${index < 8 ? `src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 280, 280)}"` : `data-src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 280, 280)}"`}
            alt="${product.name || 'Product'}"
            ${index < 8 ? 'onload="this.classList.add(\'loaded\')"' : 'loading="lazy"'}
          >
        </div>
        
        <div class="card-body">
          <h3 class="product-name">${product.name || 'Product'}</h3>
          
          <div class="price-section">
            ${hasDiscount ? `
              <span class="current-price discounted">${product.priceData.formatted.discountedPrice}</span>
              <span class="original-price">${product.priceData.formatted.price}</span>
            ` : `
              <span class="current-price">${product.priceData?.formatted?.price || 'N/A'}</span>
            `}
          </div>
          
          ${hasOptions ? `
            <div class="options-compact">
              <button class="options-trigger" data-action="toggle-options">
                <span>${this.getSelectedOptionsText(product._id)}</span>
                <span class="arrow">▼</span>
              </button>
              <div class="options-dropdown">
                ${product.productOptions.map(opt => `
                  <div class="option-group">
                    <label class="option-label">${opt.name}</label>
                    ${opt.optionType === 'color' ? `
                      <div class="color-swatches">
                        ${opt.choices.slice(0, 8).map(c => `
                          <button 
                            class="color-swatch" 
                            style="background-color: ${c.value};" 
                            data-option="${opt.name}" 
                            data-value="${c.value}" 
                            data-description="${c.description}"
                            title="${c.description}">
                          </button>
                        `).join('')}
                      </div>
                    ` : `
                      <select class="option-select" data-option="${opt.name}">
                        <option value="">Choose ${opt.name}</option>
                        ${opt.choices.map(c => `
                          <option value="${c.description}">${c.description}</option>
                        `).join('')}
                      </select>
                    `}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="quantity-section">
            <span class="quantity-label">Qty</span>
            <div class="quantity-controls">
              <button class="qty-btn" data-action="decrease">−</button>
              <span class="qty-value">${this.quantities[product._id] || 1}</span>
              <button class="qty-btn" data-action="increase">+</button>
            </div>
          </div>
          
          <div class="error-msg"></div>
          
          <div class="actions">
            <button class="action-btn view-btn" data-action="view">View</button>
            <button class="action-btn cart-btn" data-action="add">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
  }

  renderCategoryCard(category, index) {
    const icons = ['🎮', '👗', '📱', '🏠', '⚽', '📚', '🎨', '🍔'];
    const icon = icons[index % icons.length];
    
    return `
      <div class="category-card" data-category-id="${category.id}">
        <div class="category-icon">${icon}</div>
        <div class="category-name">${category.name}</div>
        <div class="category-count">${category.products?.length || 0} Products</div>
      </div>
    `;
  }

  render() {
    console.log('🎨 Rendering marketplace shop');
    
    if (!this.categoriesData || this.categoriesData.length === 0) {
      this.innerHTML = `
        <style>${this.getStyles()}</style>
        <div class="marketplace-container">
          <div class="empty-state">
            <div class="empty-icon">🛍️</div>
            <p class="empty-text">Loading amazing products...</p>
          </div>
        </div>
      `;
      return;
    }

    const sections = this.categoriesData.slice(0, 7);

    this.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="marketplace-container">
        <!-- Main Content -->
        <div class="main-content">
          ${sections.map((section, sectionIndex) => {
            const titleKey = `text${(sectionIndex * 2) + 1}`;
            const subtitleKey = `text${(sectionIndex * 2) + 2}`;
            
            return `
              <!-- Section ${sectionIndex + 1}: ${section.name} -->
              <section class="section">
                <div class="section-header">
                  <h2 class="section-title">${this.styleProps[titleKey] || section.name}</h2>
                  <p class="section-subtitle">${this.styleProps[subtitleKey] || ''}</p>
                </div>
                
                ${section.products && section.products.length > 0 ? `
                  ${sectionIndex % 2 === 0 ? `
                    <!-- Infinite Slider Layout -->
                    <div class="product-slider">
                      <div class="slider-wrapper">
                        <div class="slider-track" data-slider="${sectionIndex}">
                          ${section.products.slice(0, 12).map((product, index) => 
                            this.renderProductCard(product, index)
                          ).join('')}
                          ${section.products.slice(0, 12).map((product, index) => 
                            this.renderProductCard(product, index + 12)
                          ).join('')}
                        </div>
                      </div>
                    </div>
                  ` : `
                    <!-- Grid Layout -->
                    <div class="products-grid">
                      ${section.products.slice(0, 8).map((product, index) => 
                        this.renderProductCard(product, index + 100)
                      ).join('')}
                    </div>
                  `}
                ` : `
                  <div class="empty-state">
                    <p>No products available in this section.</p>
                  </div>
                `}
              </section>
              
              ${sectionIndex === 2 ? `
                <!-- Promotional Banner -->
                <div class="promo-banner">
                  <div class="promo-content">
                    <h2 class="promo-title">${this.styleProps.text15}</h2>
                    <p class="promo-text">${this.styleProps.text16}</p>
                    <a href="${this.styleProps.text18 || '/shop'}" class="promo-cta">${this.styleProps.text17}</a>
                  </div>
                </div>
              ` : ''}
              
              ${sectionIndex === 4 ? `
                <!-- Featured Categories -->
                <section class="section">
                  <div class="section-header">
                    <h2 class="section-title">${this.styleProps.text9}</h2>
                    <p class="section-subtitle">${this.styleProps.text10}</p>
                  </div>
                  <div class="category-grid">
                    ${this.categoriesData.slice(0, 8).map((cat, idx) => 
                      this.renderCategoryCard(cat, idx)
                    ).join('')}
                  </div>
                </section>
              ` : ''}
            `;
          }).join('')}
        </div>
      </div>
    `;

    this.setupIntersectionObserver();
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Options Trigger
    this.querySelectorAll('.options-trigger').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = e.target.closest('.product-card');
        const dropdown = card.querySelector('.options-dropdown');
        const allDropdowns = this.querySelectorAll('.options-dropdown');
        const allTriggers = this.querySelectorAll('.options-trigger');
        
        // Close all other dropdowns
        allDropdowns.forEach(d => {
          if (d !== dropdown) {
            d.classList.remove('active');
          }
        });
        allTriggers.forEach(t => {
          if (t !== trigger) {
            t.classList.remove('active');
          }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('active');
        trigger.classList.toggle('active');
      });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.options-compact')) {
        this.querySelectorAll('.options-dropdown').forEach(d => d.classList.remove('active'));
        this.querySelectorAll('.options-trigger').forEach(t => t.classList.remove('active'));
      }
    });

    // Color Swatches
    this.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const option = e.target.dataset.option;
        const description = e.target.dataset.description;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        
        this.selectedOptions[productId][option] = description;
        this.errors[productId] = '';
        this.updateErrorDisplay(productId);

        // Update trigger text
        const trigger = card.querySelector('.options-trigger span:first-child');
        if (trigger) {
          trigger.textContent = this.getSelectedOptionsText(productId);
        }

        card.querySelectorAll(`.color-swatch[data-option="${option}"]`).forEach(s => 
          s.classList.remove('selected')
        );
        e.target.classList.add('selected');
      });
    });

    // Option Selects
    this.querySelectorAll('.option-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        e.stopPropagation();
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

        // Update trigger text
        const trigger = card.querySelector('.options-trigger span:first-child');
        if (trigger) {
          trigger.textContent = this.getSelectedOptionsText(productId);
        }
      });
    });

    // Quantity Controls
    this.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.target.dataset.action;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        const qtyValue = card.querySelector('.qty-value');
        
        let currentQty = this.quantities[productId] || 1;
        
        if (action === 'decrease' && currentQty > 1) {
          currentQty--;
        } else if (action === 'increase' && currentQty < 99) {
          currentQty++;
        }
        
        this.quantities[productId] = currentQty;
        qtyValue.textContent = currentQty;
        
        const decreaseBtn = card.querySelector('.qty-btn[data-action="decrease"]');
        const increaseBtn = card.querySelector('.qty-btn[data-action="increase"]');
        
        decreaseBtn.disabled = currentQty <= 1;
        increaseBtn.disabled = currentQty >= 99;
      });
    });

    // Action Buttons
    this.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.target.dataset.action;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        const product = this.findProductById(productId);
        
        if (action === 'view') {
          this.dispatchEvent(new CustomEvent('viewProduct', {
            detail: { productId, product }
          }));
        } else if (action === 'add') {
          if (this.validateOptions(productId)) {
            const choices = this.selectedOptions[productId];
            const quantity = this.quantities[productId] || 1;
            this.dispatchEvent(new CustomEvent('addToCart', {
              detail: { productId, choices, quantity }
            }));
          }
        }
      });
    });

    // Category Cards
    this.querySelectorAll('.category-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const categoryId = e.currentTarget.dataset.categoryId;
        this.dispatchEvent(new CustomEvent('viewCategory', {
          detail: { categoryId }
        }));
      });
    });

    // Pause slider on hover
    this.querySelectorAll('.slider-track').forEach(track => {
      track.addEventListener('mouseenter', () => {
        track.classList.add('paused');
      });
      
      track.addEventListener('mouseleave', () => {
        track.classList.remove('paused');
      });
    });
  }
}

customElements.define('marketplace-shop', MarketplaceShop);
