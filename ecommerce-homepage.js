class EcommerceHomepage extends HTMLElement {
  constructor() {
    super();
    this.selectedOptions = {};
    this.quantities = {};
    this.categoriesData = [];
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
      fontSize: '16',
      heroTitle: 'Welcome to Our Store',
      heroSubtitle: 'Discover Amazing Products at Great Prices',
      heroButtonText: 'Shop Now',
      section1Title: 'Featured Products',
      section2Title: 'Best Sellers',
      section3Title: 'New Arrivals',
      section4Title: 'Special Offers'
    };
  }

  connectedCallback() {
    this.render();
    this.setupIntersectionObserver();
  }

  static get observedAttributes() {
    return ['categories-data', 'error-data', 'style-props'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'categories-data' && newVal && newVal !== oldVal) {
      try {
        this.categoriesData = JSON.parse(newVal);
        console.log('📦 Received categories data:', this.categoriesData.length, 'categories');
        
        // Initialize selections and quantities for all products
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
    
    // Update text content
    this.updateTextContent();
  }

  updateTextContent() {
    const heroTitle = this.querySelector('.hero-title');
    const heroSubtitle = this.querySelector('.hero-subtitle');
    const heroBtn = this.querySelector('.hero-btn');
    
    if (heroTitle) heroTitle.textContent = this.styleProps.heroTitle || 'Welcome to Our Store';
    if (heroSubtitle) heroSubtitle.textContent = this.styleProps.heroSubtitle || 'Discover Amazing Products at Great Prices';
    if (heroBtn) heroBtn.textContent = this.styleProps.heroButtonText || 'Shop Now';
    
    // Update section titles
    const sections = this.querySelectorAll('.section-title');
    const titles = [
      this.styleProps.section1Title,
      this.styleProps.section2Title,
      this.styleProps.section3Title,
      this.styleProps.section4Title
    ];
    
    sections.forEach((section, index) => {
      if (titles[index]) {
        section.textContent = titles[index];
      }
    });
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
      
      .homepage-container {
        width: 100%;
        background: ${secondaryBg};
        min-height: 100vh;
      }
      
      /* Hero Section */
      .hero-section {
        background: linear-gradient(135deg, ${primaryAccent} 0%, ${hoverAccent} 100%);
        padding: ${parseInt(spacing) * 6}px ${spacing}px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .hero-section::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
        background-size: 50px 50px;
        animation: heroPattern 20s linear infinite;
      }
      
      @keyframes heroPattern {
        0% { transform: translate(0, 0); }
        100% { transform: translate(50px, 50px); }
      }
      
      .hero-content {
        position: relative;
        z-index: 1;
        max-width: 800px;
        margin: 0 auto;
      }
      
      .hero-title {
        font-size: ${parseInt(fontSize) * 3}px;
        font-weight: 800;
        color: ${primaryBg};
        margin: 0 0 ${spacing}px 0;
        text-shadow: 0 2px 10px rgba(0,0,0,0.2);
        line-height: 1.2;
      }
      
      .hero-subtitle {
        font-size: ${parseInt(fontSize) + 4}px;
        color: rgba(255,255,255,0.95);
        margin: 0 0 ${parseInt(spacing) * 2}px 0;
        font-weight: 400;
      }
      
      .hero-btn {
        display: inline-block;
        padding: ${parseInt(spacing) + 2}px ${parseInt(spacing) * 3}px;
        background: ${primaryBg};
        color: ${primaryAccent};
        font-size: ${parseInt(fontSize) + 2}px;
        font-weight: 700;
        border: none;
        border-radius: ${parseInt(cardRadius) * 2}px;
        cursor: pointer;
        transition: all 0.3s;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
      }
      
      .hero-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 30px rgba(0,0,0,0.3);
      }
      
      /* Section Container */
      .category-section {
        padding: ${parseInt(spacing) * 4}px ${spacing}px;
        max-width: 1400px;
        margin: 0 auto;
      }
      
      .section-header {
        text-align: center;
        margin-bottom: ${parseInt(spacing) * 3}px;
      }
      
      .section-title {
        font-size: ${parseInt(fontSize) * 2}px;
        font-weight: 800;
        color: ${textPrimary};
        margin: 0 0 ${parseInt(spacing) / 2}px 0;
        position: relative;
        display: inline-block;
      }
      
      .section-title::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 4px;
        background: ${primaryAccent};
        border-radius: 2px;
      }
      
      .section-subtitle {
        font-size: ${parseInt(fontSize)}px;
        color: ${textSecondary};
        margin-top: ${parseInt(spacing) + 4}px;
      }
      
      /* Product Grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
        gap: ${parseInt(spacing) + 8}px;
        margin-top: ${parseInt(spacing) * 2}px;
      }
      
      .product-card {
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
      
      .product-card:hover {
        box-shadow: 0 12px 24px ${shadowColor}, 0 0 0 3px ${primaryAccent}15;
        transform: translateY(-6px);
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
      
      .product-card img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0;
      }
      
      .product-card img.loaded {
        opacity: 1;
      }
      
      .product-card:hover img.loaded {
        transform: scale(1.08);
      }
      
      .card-content {
        padding: ${parseInt(spacing) + 4}px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: ${parseInt(spacing) - 4}px;
      }
      
      .product-title {
        font-size: ${parseInt(fontSize) + 2}px;
        margin: 0;
        font-weight: 700;
        color: ${textPrimary};
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: ${(parseInt(fontSize) + 2) * 1.4 * 2}px;
      }
      
      .price-container {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .price {
        font-weight: 800;
        color: ${priceColor};
        font-size: ${parseInt(fontSize) + 8}px;
        margin: 0;
        letter-spacing: -0.5px;
      }
      
      .price.discounted {
        color: ${errorColor};
      }
      
      .original-price {
        font-weight: 600;
        color: ${textSecondary};
        font-size: ${parseInt(fontSize)}px;
        margin: 0;
        text-decoration: line-through;
        opacity: 0.7;
      }
      
      .discount-badge {
        background: ${successColor};
        color: ${primaryBg};
        padding: 3px 8px;
        border-radius: 12px;
        font-size: ${parseInt(fontSize) - 6}px;
        font-weight: 700;
      }
      
      .options-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .option {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .option label {
        font-weight: 600;
        font-size: ${parseInt(fontSize) - 4}px;
        color: ${textSecondary};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      
      .swatch {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid ${borderColor};
        cursor: pointer;
        transition: all 0.25s;
        position: relative;
        background-size: cover;
        background-position: center;
        box-shadow: 0 2px 4px ${shadowColor};
      }
      
      .swatch:hover {
        transform: scale(1.15);
        border-color: ${primaryAccent};
      }
      
      .swatch.selected {
        border-color: ${primaryAccent};
        box-shadow: 0 0 0 2px ${primaryBg}, 0 0 0 4px ${primaryAccent};
        transform: scale(1.1);
      }
      
      select {
        width: 100%;
        padding: 8px 10px;
        border: 2px solid ${borderColor};
        border-radius: ${parseInt(cardRadius) / 2}px;
        font-size: ${parseInt(fontSize) - 3}px;
        background: ${primaryBg};
        color: ${textPrimary};
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 500;
      }
      
      select:hover, select:focus {
        border-color: ${primaryAccent};
        outline: none;
      }
      
      .error-message {
        color: ${errorColor};
        font-size: ${parseInt(fontSize) - 4}px;
        padding: 6px 8px;
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
        padding: 10px;
        background: ${secondaryBg};
        border-radius: ${parseInt(cardRadius) / 2}px;
        border: 2px solid ${borderColor};
      }
      
      .quantity-selector label {
        font-weight: 700;
        font-size: ${parseInt(fontSize) - 4}px;
        color: ${textPrimary};
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .quantity-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .quantity-btn {
        width: 28px;
        height: 28px;
        border: 2px solid ${borderColor};
        background: ${primaryBg};
        border-radius: ${parseInt(cardRadius) / 3}px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        color: ${textPrimary};
        padding: 0;
      }
      
      .quantity-btn:hover:not(:disabled) {
        background: ${primaryAccent};
        border-color: ${primaryAccent};
        color: ${primaryBg};
        transform: scale(1.1);
      }
      
      .quantity-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .quantity-value {
        min-width: 28px;
        text-align: center;
        font-size: ${parseInt(fontSize)}px;
        font-weight: 800;
        color: ${textPrimary};
      }
      
      .button-group {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 8px;
        margin-top: auto;
      }
      
      .btn {
        padding: 10px 12px;
        border: none;
        border-radius: ${parseInt(cardRadius) / 2}px;
        cursor: pointer;
        font-weight: 700;
        font-size: ${parseInt(fontSize) - 3}px;
        transition: all 0.25s;
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
      
      /* View All Button */
      .view-all-container {
        text-align: center;
        margin-top: ${parseInt(spacing) * 2}px;
      }
      
      .view-all-btn {
        display: inline-block;
        padding: ${parseInt(spacing)}px ${parseInt(spacing) * 3}px;
        background: transparent;
        color: ${primaryAccent};
        font-size: ${parseInt(fontSize)}px;
        font-weight: 700;
        border: 2px solid ${primaryAccent};
        border-radius: ${parseInt(cardRadius) * 2}px;
        cursor: pointer;
        transition: all 0.3s;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .view-all-btn:hover {
        background: ${primaryAccent};
        color: ${primaryBg};
        transform: translateY(-2px);
        box-shadow: 0 6px 16px ${primaryAccent}30;
      }
      
      /* Empty State */
      .empty-state {
        text-align: center;
        padding: ${parseInt(spacing) * 4}px ${spacing}px;
        color: ${textSecondary};
      }
      
      .empty-icon {
        font-size: ${parseInt(fontSize) * 4}px;
        opacity: 0.3;
        margin-bottom: ${spacing}px;
      }
      
      /* Responsive */
      @media (max-width: 1024px) {
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
        }
        
        .hero-title {
          font-size: ${parseInt(fontSize) * 2.5}px;
        }
      }
      
      @media (max-width: 768px) {
        .hero-section {
          padding: ${parseInt(spacing) * 4}px ${spacing}px;
        }
        
        .hero-title {
          font-size: ${parseInt(fontSize) * 2}px;
        }
        
        .hero-subtitle {
          font-size: ${parseInt(fontSize) + 2}px;
        }
        
        .section-title {
          font-size: ${parseInt(fontSize) * 1.5}px;
        }
        
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
          gap: ${spacing}px;
        }
        
        .button-group {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 480px) {
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 150px), 1fr));
        }
        
        .hero-title {
          font-size: ${parseInt(fontSize) * 1.5}px;
        }
        
        .card-content {
          padding: ${spacing}px;
        }
      }
    `;
  }

  optimizeImageUrl(url, width = 300, height = 300) {
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
      const errorEl = card.querySelector('.error-message');
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

  renderProductCard(product, index) {
    const hasDiscount = product.priceData?.formatted?.discountedPrice && 
                        product.priceData?.formatted?.discountedPrice !== product.priceData?.formatted?.price;
    const discountPercent = hasDiscount ? 
      this.calculateDiscount(product.priceData?.formatted?.price, product.priceData?.formatted?.discountedPrice) : 0;
    
    return `
      <div class="product-card" data-product-id="${product._id}">
        <div class="image-container">
          ${product.ribbon ? `<div class="ribbon">${product.ribbon}</div>` : ''}
          <img 
            ${index < 4 ? `src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 300, 300)}"` : `data-src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 300, 300)}"`}
            alt="${product.name || 'Product'}"
            ${index < 4 ? 'onload="this.classList.add(\'loaded\')"' : 'loading="lazy"'}
          >
        </div>
        <div class="card-content">
          <h3 class="product-title">${product.name || 'Product'}</h3>
          
          <div class="price-container">
            ${hasDiscount ? `
              <p class="price discounted">${product.priceData.formatted.discountedPrice}</p>
              <p class="original-price">${product.priceData.formatted.price}</p>
              ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
            ` : `
              <p class="price">${product.priceData?.formatted?.price || 'N/A'}</p>
            `}
          </div>
          
          ${product.productOptions && product.productOptions.length > 0 ? `
            <div class="options-section">
              ${product.productOptions.map(opt => `
                <div class="option">
                  <label>${opt.name}</label>
                  ${opt.optionType === 'color' ? `
                    <div class="swatches">
                      ${opt.choices.slice(0, 5).map(c => `
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
              <button class="quantity-btn" data-action="decrease">−</button>
              <span class="quantity-value">${this.quantities[product._id] || 1}</span>
              <button class="quantity-btn" data-action="increase">+</button>
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
  }

  render() {
    console.log('🎨 Rendering homepage with', this.categoriesData.length, 'categories');
    
    if (!this.categoriesData || this.categoriesData.length === 0) {
      this.innerHTML = `
        <style>${this.getStyles()}</style>
        <div class="homepage-container">
          <div class="empty-state">
            <div class="empty-icon">🛍️</div>
            <p style="font-size: 18px;">Loading your amazing products...</p>
          </div>
        </div>
      `;
      return;
    }

    const heroTitle = this.styleProps.heroTitle || 'Welcome to Our Store';
    const heroSubtitle = this.styleProps.heroSubtitle || 'Discover Amazing Products at Great Prices';
    const heroButtonText = this.styleProps.heroButtonText || 'Shop Now';

    this.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="homepage-container">
        <!-- Hero Section -->
        <section class="hero-section">
          <div class="hero-content">
            <h1 class="hero-title">${heroTitle}</h1>
            <p class="hero-subtitle">${heroSubtitle}</p>
            <button class="hero-btn" data-action="scroll-to-products">${heroButtonText}</button>
          </div>
        </section>

        <!-- Category Sections -->
        ${this.categoriesData.map((category, catIndex) => {
          const sectionTitleKey = `section${catIndex + 1}Title`;
          const sectionTitle = this.styleProps[sectionTitleKey] || category.name || `Category ${catIndex + 1}`;
          
          // Determine how many products to show
          let productsToShow = category.products || [];
          if (productsToShow.length > 8) {
            productsToShow = productsToShow.slice(0, 8);
          }
          
          return `
            <section class="category-section" data-category-index="${catIndex}">
              <div class="section-header">
                <h2 class="section-title">${sectionTitle}</h2>
                ${category.description ? `<p class="section-subtitle">${category.description}</p>` : ''}
              </div>
              
              ${productsToShow.length > 0 ? `
                <div class="products-grid">
                  ${productsToShow.map((product, index) => this.renderProductCard(product, index)).join('')}
                </div>
                
                ${category.products.length > 8 ? `
                  <div class="view-all-container">
                    <button class="view-all-btn" data-category-id="${category.id}">
                      View All ${category.name} →
                    </button>
                  </div>
                ` : ''}
              ` : `
                <div class="empty-state">
                  <p>No products available in this category.</p>
                </div>
              `}
            </section>
          `;
        }).join('')}
      </div>
    `;

    this.setupIntersectionObserver();
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Hero button
    const heroBtn = this.querySelector('[data-action="scroll-to-products"]');
    if (heroBtn) {
      heroBtn.addEventListener('click', () => {
        const firstSection = this.querySelector('.category-section');
        if (firstSection) {
          firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // View All buttons
    this.querySelectorAll('.view-all-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const categoryId = e.target.dataset.categoryId;
        this.dispatchEvent(new CustomEvent('viewAllCategory', {
          detail: { categoryId }
        }));
      });
    });

    // Product interactions
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

        card.querySelectorAll(`.swatch[data-option="${option}"]`).forEach(s => 
          s.classList.remove('selected')
        );
        e.target.classList.add('selected');
      });
    });

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
      });
    });

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
        
        const decreaseBtn = card.querySelector('.quantity-btn[data-action="decrease"]');
        const increaseBtn = card.querySelector('.quantity-btn[data-action="increase"]');
        
        decreaseBtn.disabled = currentQty <= 1;
        increaseBtn.disabled = currentQty >= 99;
      });
    });

    this.querySelectorAll('.btn').forEach(btn => {
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
  }
}

customElements.define('ecommerce-homepage', EcommerceHomepage);
