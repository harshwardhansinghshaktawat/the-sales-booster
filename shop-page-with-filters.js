class EcommerceHomepage extends HTMLElement {
  constructor() {
    super();
    this.selectedOptions = {};
    this.quantities = {};
    this.categoriesData = [];
    this.errors = {};
    this.loadedImages = new Set();
    
    // Filter state
    this.filters = {
      search: '',
      categories: new Set(),
      priceRange: { min: 0, max: Infinity },
      options: {} // e.g., { Color: ['Red', 'Blue'], Size: ['M', 'L'] }
    };
    
    // Default style props with simplified naming
    this.styleProps = {
      color1: '#ffffff',      // Primary BG
      color2: '#f8f9fa',      // Secondary BG
      color3: '#e5e7eb',      // Border
      color4: '#f3f4f6',      // Shapes
      color5: '#3b82f6',      // Primary Accent
      color6: '#2563eb',      // Hover Accent
      color7: 'rgba(0, 0, 0, 0.1)', // Shadow
      color8: '#1f2937',      // Text Primary
      color9: '#6b7280',      // Text Secondary
      color10: '#111827',     // Price
      color11: '#ef4444',     // Error
      color12: '#fee2e2',     // Error BG
      color13: '#10b981',     // Success
      text1: 'Welcome to Our Store',
      text2: 'Discover Amazing Products',
      text3: 'Shop Now',
      slider1: '12',  // Card Radius
      slider2: '16',  // Spacing
      slider3: '16'   // Font Size
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
        
        // Initialize selections and quantities
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
    const heroTitle = this.querySelector('.hero-title');
    const heroSubtitle = this.querySelector('.hero-subtitle');
    const heroBtn = this.querySelector('.hero-cta');
    
    if (heroTitle) heroTitle.textContent = this.styleProps.text1;
    if (heroSubtitle) heroSubtitle.textContent = this.styleProps.text2;
    if (heroBtn) heroBtn.textContent = this.styleProps.text3;
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
      
      .shop-container {
        width: 100%;
        background: ${color2};
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      
      /* Hero Section */
      .hero {
        background: linear-gradient(135deg, ${color5} 0%, ${color6} 100%);
        padding: ${spacing * 4}px ${spacing}px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      
      .hero::before {
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
        animation: slide 20s linear infinite;
      }
      
      @keyframes slide {
        0% { transform: translate(0, 0); }
        100% { transform: translate(50px, 50px); }
      }
      
      .hero-content {
        position: relative;
        z-index: 1;
        max-width: 900px;
        margin: 0 auto;
      }
      
      .hero-title {
        font-size: ${fontSize * 3}px;
        font-weight: 900;
        color: ${color1};
        margin-bottom: ${spacing}px;
        text-shadow: 0 4px 12px rgba(0,0,0,0.2);
        letter-spacing: -1px;
      }
      
      .hero-subtitle {
        font-size: ${fontSize + 6}px;
        color: rgba(255,255,255,0.95);
        margin-bottom: ${spacing * 2}px;
        font-weight: 400;
      }
      
      .hero-cta {
        display: inline-block;
        padding: ${spacing + 4}px ${spacing * 4}px;
        background: ${color1};
        color: ${color5};
        font-size: ${fontSize + 2}px;
        font-weight: 700;
        border: none;
        border-radius: ${radius * 3}px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      }
      
      .hero-cta:hover {
        transform: translateY(-4px);
        box-shadow: 0 15px 35px rgba(0,0,0,0.3);
      }
      
      /* Main Content */
      .main-content {
        max-width: 1600px;
        margin: 0 auto;
        padding: ${spacing * 3}px ${spacing}px;
      }
      
      /* Filters Sidebar */
      .layout {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: ${spacing * 2}px;
        align-items: start;
      }
      
      .filters-sidebar {
        background: ${color1};
        border: 2px solid ${color3};
        border-radius: ${radius * 2}px;
        padding: ${spacing * 2}px;
        position: sticky;
        top: ${spacing * 2}px;
        max-height: calc(100vh - ${spacing * 4}px);
        overflow-y: auto;
      }
      
      .filter-section {
        margin-bottom: ${spacing * 2}px;
        padding-bottom: ${spacing * 2}px;
        border-bottom: 2px solid ${color3};
      }
      
      .filter-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      
      .filter-title {
        font-size: ${fontSize}px;
        font-weight: 700;
        color: ${color8};
        margin-bottom: ${spacing}px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .clear-filter {
        font-size: ${fontSize - 4}px;
        color: ${color5};
        cursor: pointer;
        font-weight: 600;
        text-transform: none;
        letter-spacing: 0;
      }
      
      .clear-filter:hover {
        color: ${color6};
        text-decoration: underline;
      }
      
      /* Search Box */
      .search-box {
        position: relative;
      }
      
      .search-input {
        width: 100%;
        padding: ${spacing - 2}px ${spacing * 3}px ${spacing - 2}px ${spacing}px;
        border: 2px solid ${color3};
        border-radius: ${radius}px;
        font-size: ${fontSize - 2}px;
        background: ${color1};
        color: ${color8};
        transition: all 0.2s;
      }
      
      .search-input:focus {
        outline: none;
        border-color: ${color5};
        box-shadow: 0 0 0 3px ${color5}20;
      }
      
      .search-input::placeholder {
        color: ${color9};
      }
      
      .search-icon {
        position: absolute;
        right: ${spacing}px;
        top: 50%;
        transform: translateY(-50%);
        color: ${color9};
        font-size: ${fontSize + 2}px;
        pointer-events: none;
      }
      
      /* Price Range */
      .price-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${spacing}px;
      }
      
      .price-input {
        padding: ${spacing - 4}px ${spacing - 2}px;
        border: 2px solid ${color3};
        border-radius: ${radius / 2}px;
        font-size: ${fontSize - 3}px;
        background: ${color1};
        color: ${color8};
        width: 100%;
      }
      
      .price-input:focus {
        outline: none;
        border-color: ${color5};
      }
      
      .price-label {
        font-size: ${fontSize - 4}px;
        color: ${color9};
        margin-bottom: 4px;
        display: block;
        font-weight: 600;
      }
      
      /* Checkboxes */
      .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: ${spacing - 4}px;
      }
      
      .checkbox-item {
        display: flex;
        align-items: center;
        gap: ${spacing - 4}px;
        cursor: pointer;
        padding: ${spacing - 6}px;
        border-radius: ${radius / 2}px;
        transition: background 0.2s;
      }
      
      .checkbox-item:hover {
        background: ${color4};
      }
      
      .checkbox-item input {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: ${color5};
      }
      
      .checkbox-label {
        font-size: ${fontSize - 3}px;
        color: ${color8};
        cursor: pointer;
        flex: 1;
      }
      
      .checkbox-count {
        font-size: ${fontSize - 5}px;
        color: ${color9};
        background: ${color4};
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 600;
      }
      
      /* Active Filters Bar */
      .active-filters {
        display: flex;
        flex-wrap: wrap;
        gap: ${spacing - 4}px;
        margin-bottom: ${spacing * 2}px;
        padding: ${spacing}px;
        background: ${color1};
        border-radius: ${radius}px;
        border: 2px solid ${color3};
      }
      
      .active-filters:empty {
        display: none;
      }
      
      .filter-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: ${color5};
        color: ${color1};
        border-radius: ${radius * 2}px;
        font-size: ${fontSize - 4}px;
        font-weight: 600;
      }
      
      .filter-tag-close {
        cursor: pointer;
        font-size: ${fontSize + 2}px;
        line-height: 1;
        opacity: 0.8;
        transition: opacity 0.2s;
      }
      
      .filter-tag-close:hover {
        opacity: 1;
      }
      
      .clear-all-filters {
        padding: 6px 12px;
        background: ${color11};
        color: ${color1};
        border: none;
        border-radius: ${radius * 2}px;
        font-size: ${fontSize - 4}px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .clear-all-filters:hover {
        opacity: 0.9;
      }
      
      /* Products Section */
      .products-section {
        flex: 1;
      }
      
      .results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: ${spacing * 2}px;
        padding: ${spacing}px;
        background: ${color1};
        border-radius: ${radius}px;
        border: 2px solid ${color3};
      }
      
      .results-count {
        font-size: ${fontSize}px;
        color: ${color8};
        font-weight: 700;
      }
      
      .sort-select {
        padding: ${spacing - 4}px ${spacing}px;
        border: 2px solid ${color3};
        border-radius: ${radius}px;
        font-size: ${fontSize - 3}px;
        background: ${color1};
        color: ${color8};
        cursor: pointer;
        font-weight: 600;
      }
      
      .sort-select:focus {
        outline: none;
        border-color: ${color5};
      }
      
      /* Product Grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
        gap: ${spacing * 2}px;
      }
      
      /* Modern Product Card */
      .product-card {
        background: ${color1};
        border: 2px solid ${color3};
        border-radius: ${radius * 2}px;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        position: relative;
        height: 100%;
      }
      
      .product-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px ${color7}, 0 0 0 4px ${color5}15;
        border-color: ${color5};
      }
      
      /* Image Container */
      .image-wrapper {
        position: relative;
        width: 100%;
        padding-top: 100%;
        background: linear-gradient(135deg, ${color4} 0%, ${color2} 100%);
        overflow: hidden;
      }
      
      .image-wrapper::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        transform: translateX(-100%);
        animation: shimmer 2.5s infinite;
      }
      
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
      
      .product-card img {
        position: absolute;
        top: 0;
        left: 0;
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
      
      /* Ribbon Badge */
      .ribbon {
        position: absolute;
        top: ${spacing}px;
        left: ${spacing}px;
        background: ${color11};
        color: ${color1};
        padding: 6px 14px;
        border-radius: ${radius * 2}px;
        font-size: ${fontSize - 6}px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 2;
      }
      
      /* Quick View Button */
      .quick-view {
        position: absolute;
        bottom: ${spacing}px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        opacity: 0;
        background: ${color1};
        color: ${color5};
        padding: ${spacing - 4}px ${spacing * 2}px;
        border: 2px solid ${color5};
        border-radius: ${radius * 2}px;
        font-size: ${fontSize - 4}px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
        z-index: 3;
      }
      
      .product-card:hover .quick-view {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      
      .quick-view:hover {
        background: ${color5};
        color: ${color1};
      }
      
      /* Card Body */
      .card-body {
        padding: ${spacing * 1.5}px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: ${spacing}px;
      }
      
      .product-name {
        font-size: ${fontSize + 2}px;
        font-weight: 700;
        color: ${color8};
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: ${(fontSize + 2) * 1.3 * 2}px;
        margin: 0;
      }
      
      /* Price Display */
      .price-wrapper {
        display: flex;
        align-items: center;
        gap: ${spacing - 2}px;
        flex-wrap: wrap;
      }
      
      .current-price {
        font-size: ${fontSize + 10}px;
        font-weight: 900;
        color: ${color10};
        letter-spacing: -0.5px;
      }
      
      .current-price.discounted {
        color: ${color11};
      }
      
      .original-price {
        font-size: ${fontSize}px;
        color: ${color9};
        text-decoration: line-through;
        font-weight: 600;
      }
      
      .discount-badge {
        background: linear-gradient(135deg, ${color13} 0%, #059669 100%);
        color: ${color1};
        padding: 4px 10px;
        border-radius: ${radius}px;
        font-size: ${fontSize - 6}px;
        font-weight: 800;
        letter-spacing: 0.5px;
      }
      
      /* Options Section */
      .options-wrapper {
        display: flex;
        flex-direction: column;
        gap: ${spacing}px;
      }
      
      .option-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .option-label {
        font-size: ${fontSize - 4}px;
        font-weight: 700;
        color: ${color9};
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }
      
      /* Color Swatches */
      .color-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .color-swatch {
        width: 36px;
        height: 36px;
        border-radius: ${radius}px;
        border: 3px solid ${color3};
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        background-size: cover;
        background-position: center;
      }
      
      .color-swatch:hover {
        transform: scale(1.15) rotate(5deg);
        border-color: ${color5};
      }
      
      .color-swatch.selected {
        border-color: ${color5};
        box-shadow: 0 0 0 2px ${color1}, 0 0 0 5px ${color5}, 0 4px 12px ${color7};
        transform: scale(1.12);
      }
      
      .color-swatch::after {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: ${radius + 2}px;
        border: 2px solid ${color5};
        opacity: 0;
        transition: opacity 0.25s;
      }
      
      .color-swatch.selected::after {
        opacity: 1;
      }
      
      /* Dropdown Options */
      .option-select {
        width: 100%;
        padding: ${spacing - 2}px ${spacing}px;
        border: 2px solid ${color3};
        border-radius: ${radius}px;
        font-size: ${fontSize - 3}px;
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
        box-shadow: 0 0 0 3px ${color5}20;
      }
      
      /* Quantity Selector */
      .quantity-wrapper {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: ${spacing}px;
        background: ${color2};
        border-radius: ${radius}px;
        border: 2px solid ${color3};
      }
      
      .quantity-label {
        font-size: ${fontSize - 4}px;
        font-weight: 800;
        color: ${color8};
        text-transform: uppercase;
        letter-spacing: 0.8px;
      }
      
      .quantity-controls {
        display: flex;
        align-items: center;
        gap: ${spacing - 2}px;
      }
      
      .qty-btn {
        width: 32px;
        height: 32px;
        border: 2px solid ${color3};
        background: ${color1};
        border-radius: ${radius}px;
        cursor: pointer;
        font-size: ${fontSize + 2}px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        color: ${color8};
      }
      
      .qty-btn:hover:not(:disabled) {
        background: ${color5};
        border-color: ${color5};
        color: ${color1};
        transform: scale(1.15);
      }
      
      .qty-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .qty-display {
        min-width: 36px;
        text-align: center;
        font-size: ${fontSize + 2}px;
        font-weight: 900;
        color: ${color8};
      }
      
      /* Error Message */
      .error-msg {
        color: ${color11};
        background: ${color12};
        padding: ${spacing - 2}px ${spacing}px;
        border-radius: ${radius}px;
        font-size: ${fontSize - 4}px;
        font-weight: 700;
        border-left: 4px solid ${color11};
        display: none;
      }
      
      /* Action Buttons */
      .actions {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: ${spacing - 2}px;
        margin-top: auto;
      }
      
      .action-btn {
        padding: ${spacing + 2}px ${spacing + 4}px;
        border: none;
        border-radius: ${radius}px;
        cursor: pointer;
        font-weight: 800;
        font-size: ${fontSize - 3}px;
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
        background: ${color4};
        transform: translateY(-2px);
      }
      
      .cart-btn {
        background: linear-gradient(135deg, ${color5} 0%, ${color6} 100%);
        color: ${color1};
        border: 2px solid ${color5};
        box-shadow: 0 4px 12px ${color5}40;
      }
      
      .cart-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px ${color5}60;
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
      
      .empty-subtext {
        font-size: ${fontSize}px;
        color: ${color9};
      }
      
      /* Mobile Responsive */
      @media (max-width: 1024px) {
        .layout {
          grid-template-columns: 1fr;
        }
        
        .filters-sidebar {
          position: static;
          max-height: none;
        }
        
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
        }
      }
      
      @media (max-width: 768px) {
        .hero-title {
          font-size: ${fontSize * 2}px;
        }
        
        .hero-subtitle {
          font-size: ${fontSize + 2}px;
        }
        
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
          gap: ${spacing}px;
        }
        
        .actions {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 480px) {
        .main-content {
          padding: ${spacing * 2}px ${spacing}px;
        }
        
        .products-grid {
          grid-template-columns: 1fr;
        }
        
        .hero {
          padding: ${spacing * 3}px ${spacing}px;
        }
      }
    `;
  }

  optimizeImageUrl(url, width = 320, height = 320) {
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

  getAllProducts() {
    const products = [];
    this.categoriesData.forEach(category => {
      if (category.products) {
        category.products.forEach(p => {
          products.push({ ...p, categoryId: category.id, categoryName: category.name });
        });
      }
    });
    return products;
  }

  getFilteredProducts() {
    let products = this.getAllProducts();
    
    // Search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      products = products.filter(p => 
        (p.name || '').toLowerCase().includes(search) ||
        (p.description || '').toLowerCase().includes(search)
      );
    }
    
    // Category filter
    if (this.filters.categories.size > 0) {
      products = products.filter(p => this.filters.categories.has(p.categoryId));
    }
    
    // Price filter
    products = products.filter(p => {
      const price = this.getNumericPrice(p.priceData?.formatted?.discountedPrice || p.priceData?.formatted?.price);
      return price >= this.filters.priceRange.min && price <= this.filters.priceRange.max;
    });
    
    // Product option filters
    for (const [optionName, selectedValues] of Object.entries(this.filters.options)) {
      if (selectedValues.length > 0) {
        products = products.filter(p => {
          if (!p.productOptions) return false;
          const option = p.productOptions.find(opt => opt.name === optionName);
          if (!option) return false;
          return option.choices.some(choice => 
            selectedValues.includes(choice.description)
          );
        });
      }
    }
    
    return products;
  }

  getNumericPrice(priceStr) {
    if (!priceStr) return 0;
    const numStr = priceStr.replace(/[^0-9.]/g, '');
    return parseFloat(numStr) || 0;
  }

  getPriceRange() {
    const products = this.getAllProducts();
    let min = Infinity;
    let max = 0;
    
    products.forEach(p => {
      const price = this.getNumericPrice(p.priceData?.formatted?.discountedPrice || p.priceData?.formatted?.price);
      if (price > 0) {
        if (price < min) min = price;
        if (price > max) max = price;
      }
    });
    
    return { min: min === Infinity ? 0 : min, max };
  }

  getAllCategories() {
    return this.categoriesData.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: cat.products?.length || 0
    }));
  }

  getAllProductOptions() {
    const optionsMap = {};
    
    this.getAllProducts().forEach(product => {
      if (product.productOptions) {
        product.productOptions.forEach(opt => {
          if (!optionsMap[opt.name]) {
            optionsMap[opt.name] = {
              name: opt.name,
              type: opt.optionType,
              values: new Set()
            };
          }
          opt.choices.forEach(choice => {
            optionsMap[opt.name].values.add(choice.description);
          });
        });
      }
    });
    
    // Convert sets to arrays
    Object.keys(optionsMap).forEach(key => {
      optionsMap[key].values = Array.from(optionsMap[key].values).sort();
    });
    
    return optionsMap;
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
    const original = this.getNumericPrice(originalPrice);
    const discounted = this.getNumericPrice(discountedPrice);

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
        <div class="image-wrapper">
          ${product.ribbon ? `<div class="ribbon">${product.ribbon}</div>` : ''}
          <img 
            ${index < 6 ? `src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 320, 320)}"` : `data-src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 320, 320)}"`}
            alt="${product.name || 'Product'}"
            ${index < 6 ? 'onload="this.classList.add(\'loaded\')"' : 'loading="lazy"'}
          >
          <button class="quick-view" data-action="view">Quick View</button>
        </div>
        
        <div class="card-body">
          <h3 class="product-name">${product.name || 'Product'}</h3>
          
          <div class="price-wrapper">
            ${hasDiscount ? `
              <span class="current-price discounted">${product.priceData.formatted.discountedPrice}</span>
              <span class="original-price">${product.priceData.formatted.price}</span>
              ${discountPercent > 0 ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
            ` : `
              <span class="current-price">${product.priceData?.formatted?.price || 'N/A'}</span>
            `}
          </div>
          
          ${product.productOptions && product.productOptions.length > 0 ? `
            <div class="options-wrapper">
              ${product.productOptions.map(opt => `
                <div class="option-group">
                  <label class="option-label">${opt.name}</label>
                  ${opt.optionType === 'color' ? `
                    <div class="color-swatches">
                      ${opt.choices.slice(0, 6).map(c => `
                        <button 
                          class="color-swatch" 
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
                    <select class="option-select" data-option="${opt.name}" aria-label="Select ${opt.name}">
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
          
          <div class="quantity-wrapper">
            <span class="quantity-label">Qty</span>
            <div class="quantity-controls">
              <button class="qty-btn" data-action="decrease">−</button>
              <span class="qty-display">${this.quantities[product._id] || 1}</span>
              <button class="qty-btn" data-action="increase">+</button>
            </div>
          </div>
          
          <div class="error-msg" role="alert"></div>
          
          <div class="actions">
            <button class="action-btn view-btn" data-action="view">View</button>
            <button class="action-btn cart-btn" data-action="add">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    console.log('🎨 Rendering shop page');
    
    if (!this.categoriesData || this.categoriesData.length === 0) {
      this.innerHTML = `
        <style>${this.getStyles()}</style>
        <div class="shop-container">
          <div class="empty-state">
            <div class="empty-icon">🛍️</div>
            <p class="empty-text">Loading products...</p>
          </div>
        </div>
      `;
      return;
    }

    const filteredProducts = this.getFilteredProducts();
    const allCategories = this.getAllCategories();
    const allOptions = this.getAllProductOptions();
    const priceRange = this.getPriceRange();

    this.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="shop-container">
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero-content">
            <h1 class="hero-title">${this.styleProps.text1}</h1>
            <p class="hero-subtitle">${this.styleProps.text2}</p>
            <button class="hero-cta" data-action="scroll-to-shop">${this.styleProps.text3}</button>
          </div>
        </section>

        <!-- Main Content -->
        <div class="main-content">
          <div class="layout">
            <!-- Filters Sidebar -->
            <aside class="filters-sidebar">
              <!-- Search -->
              <div class="filter-section">
                <h3 class="filter-title">Search</h3>
                <div class="search-box">
                  <input 
                    type="text" 
                    class="search-input" 
                    placeholder="Search products..." 
                    value="${this.filters.search}"
                    data-filter="search"
                  >
                  <span class="search-icon">🔍</span>
                </div>
              </div>

              <!-- Price Range -->
              <div class="filter-section">
                <h3 class="filter-title">
                  Price Range
                  ${this.filters.priceRange.min > 0 || this.filters.priceRange.max < Infinity ? 
                    '<span class="clear-filter" data-clear="price">Clear</span>' : ''}
                </h3>
                <div class="price-inputs">
                  <div>
                    <label class="price-label">Min</label>
                    <input 
                      type="number" 
                      class="price-input" 
                      placeholder="${Math.floor(priceRange.min)}"
                      min="0"
                      value="${this.filters.priceRange.min === 0 ? '' : this.filters.priceRange.min}"
                      data-filter="price-min"
                    >
                  </div>
                  <div>
                    <label class="price-label">Max</label>
                    <input 
                      type="number" 
                      class="price-input" 
                      placeholder="${Math.ceil(priceRange.max)}"
                      min="0"
                      value="${this.filters.priceRange.max === Infinity ? '' : this.filters.priceRange.max}"
                      data-filter="price-max"
                    >
                  </div>
                </div>
              </div>

              <!-- Categories -->
              ${allCategories.length > 0 ? `
                <div class="filter-section">
                  <h3 class="filter-title">
                    Categories
                    ${this.filters.categories.size > 0 ? 
                      '<span class="clear-filter" data-clear="categories">Clear</span>' : ''}
                  </h3>
                  <div class="checkbox-group">
                    ${allCategories.map(cat => `
                      <label class="checkbox-item">
                        <input 
                          type="checkbox" 
                          data-filter="category" 
                          data-value="${cat.id}"
                          ${this.filters.categories.has(cat.id) ? 'checked' : ''}
                        >
                        <span class="checkbox-label">${cat.name}</span>
                        <span class="checkbox-count">${cat.count}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Product Options (Color, Size, etc.) -->
              ${Object.entries(allOptions).map(([optionName, optionData]) => `
                <div class="filter-section">
                  <h3 class="filter-title">
                    ${optionName}
                    ${this.filters.options[optionName]?.length > 0 ? 
                      `<span class="clear-filter" data-clear="option-${optionName}">Clear</span>` : ''}
                  </h3>
                  <div class="checkbox-group">
                    ${optionData.values.map(value => `
                      <label class="checkbox-item">
                        <input 
                          type="checkbox" 
                          data-filter="option" 
                          data-option="${optionName}"
                          data-value="${value}"
                          ${this.filters.options[optionName]?.includes(value) ? 'checked' : ''}
                        >
                        <span class="checkbox-label">${value}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </aside>

            <!-- Products Section -->
            <main class="products-section">
              <!-- Active Filters -->
              <div class="active-filters">
                ${this.filters.search ? `
                  <span class="filter-tag">
                    Search: "${this.filters.search}"
                    <span class="filter-tag-close" data-remove="search">×</span>
                  </span>
                ` : ''}
                
                ${Array.from(this.filters.categories).map(catId => {
                  const cat = allCategories.find(c => c.id === catId);
                  return cat ? `
                    <span class="filter-tag">
                      ${cat.name}
                      <span class="filter-tag-close" data-remove="category" data-value="${catId}">×</span>
                    </span>
                  ` : '';
                }).join('')}
                
                ${Object.entries(this.filters.options).map(([optionName, values]) => 
                  values.map(value => `
                    <span class="filter-tag">
                      ${optionName}: ${value}
                      <span class="filter-tag-close" data-remove="option" data-option="${optionName}" data-value="${value}">×</span>
                    </span>
                  `).join('')
                ).join('')}
                
                ${this.filters.search || this.filters.categories.size > 0 || Object.keys(this.filters.options).length > 0 || this.filters.priceRange.min > 0 || this.filters.priceRange.max < Infinity ? `
                  <button class="clear-all-filters" data-action="clear-all">Clear All</button>
                ` : ''}
              </div>

              <!-- Results Header -->
              <div class="results-header">
                <span class="results-count">${filteredProducts.length} Products</span>
                <select class="sort-select" data-action="sort">
                  <option value="default">Sort by: Default</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>

              <!-- Products Grid -->
              ${filteredProducts.length > 0 ? `
                <div class="products-grid">
                  ${filteredProducts.map((product, index) => this.renderProductCard(product, index)).join('')}
                </div>
              ` : `
                <div class="empty-state">
                  <div class="empty-icon">🔍</div>
                  <p class="empty-text">No products found</p>
                  <p class="empty-subtext">Try adjusting your filters</p>
                </div>
              `}
            </main>
          </div>
        </div>
      </div>
    `;

    this.setupIntersectionObserver();
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Hero CTA
    const heroCta = this.querySelector('[data-action="scroll-to-shop"]');
    if (heroCta) {
      heroCta.addEventListener('click', () => {
        const mainContent = this.querySelector('.main-content');
        if (mainContent) {
          mainContent.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Search input
    const searchInput = this.querySelector('[data-filter="search"]');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.render();
        }, 300);
      });
    }

    // Price filters
    const priceMin = this.querySelector('[data-filter="price-min"]');
    const priceMax = this.querySelector('[data-filter="price-max"]');
    
    if (priceMin) {
      priceMin.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        this.filters.priceRange.min = isNaN(val) ? 0 : val;
        this.render();
      });
    }
    
    if (priceMax) {
      priceMax.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        this.filters.priceRange.max = isNaN(val) ? Infinity : val;
        this.render();
      });
    }

    // Category checkboxes
    this.querySelectorAll('[data-filter="category"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const categoryId = e.target.dataset.value;
        if (e.target.checked) {
          this.filters.categories.add(categoryId);
        } else {
          this.filters.categories.delete(categoryId);
        }
        this.render();
      });
    });

    // Option checkboxes
    this.querySelectorAll('[data-filter="option"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const optionName = e.target.dataset.option;
        const value = e.target.dataset.value;
        
        if (!this.filters.options[optionName]) {
          this.filters.options[optionName] = [];
        }
        
        if (e.target.checked) {
          this.filters.options[optionName].push(value);
        } else {
          this.filters.options[optionName] = this.filters.options[optionName].filter(v => v !== value);
          if (this.filters.options[optionName].length === 0) {
            delete this.filters.options[optionName];
          }
        }
        this.render();
      });
    });

    // Clear filter buttons
    this.querySelectorAll('[data-clear]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clearType = e.target.dataset.clear;
        
        if (clearType === 'price') {
          this.filters.priceRange = { min: 0, max: Infinity };
        } else if (clearType === 'categories') {
          this.filters.categories.clear();
        } else if (clearType.startsWith('option-')) {
          const optionName = clearType.replace('option-', '');
          delete this.filters.options[optionName];
        }
        
        this.render();
      });
    });

    // Remove filter tags
    this.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const removeType = e.target.dataset.remove;
        
        if (removeType === 'search') {
          this.filters.search = '';
        } else if (removeType === 'category') {
          this.filters.categories.delete(e.target.dataset.value);
        } else if (removeType === 'option') {
          const optionName = e.target.dataset.option;
          const value = e.target.dataset.value;
          this.filters.options[optionName] = this.filters.options[optionName].filter(v => v !== value);
          if (this.filters.options[optionName].length === 0) {
            delete this.filters.options[optionName];
          }
        }
        
        this.render();
      });
    });

    // Clear all filters
    const clearAllBtn = this.querySelector('[data-action="clear-all"]');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.filters = {
          search: '',
          categories: new Set(),
          priceRange: { min: 0, max: Infinity },
          options: {}
        };
        this.render();
      });
    }

    // Sort select
    const sortSelect = this.querySelector('[data-action="sort"]');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const sortType = e.target.value;
        // Sorting will be implemented in the getFilteredProducts method
        console.log('Sort by:', sortType);
      });
    }

    // Product card interactions
    this.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const option = e.target.dataset.option;
        const description = e.target.dataset.description;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        
        this.selectedOptions[productId][option] = description;
        this.errors[productId] = '';
        this.updateErrorDisplay(productId);

        card.querySelectorAll(`.color-swatch[data-option="${option}"]`).forEach(s => 
          s.classList.remove('selected')
        );
        e.target.classList.add('selected');
      });
    });

    this.querySelectorAll('.option-select').forEach(sel => {
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

    this.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = e.target.dataset.action;
        const card = e.target.closest('.product-card');
        const productId = card.dataset.productId;
        const qtyDisplay = card.querySelector('.qty-display');
        
        let currentQty = this.quantities[productId] || 1;
        
        if (action === 'decrease' && currentQty > 1) {
          currentQty--;
        } else if (action === 'increase' && currentQty < 99) {
          currentQty++;
        }
        
        this.quantities[productId] = currentQty;
        qtyDisplay.textContent = currentQty;
        
        const decreaseBtn = card.querySelector('.qty-btn[data-action="decrease"]');
        const increaseBtn = card.querySelector('.qty-btn[data-action="increase"]');
        
        decreaseBtn.disabled = currentQty <= 1;
        increaseBtn.disabled = currentQty >= 99;
      });
    });

    this.querySelectorAll('.action-btn, .quick-view').forEach(btn => {
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
