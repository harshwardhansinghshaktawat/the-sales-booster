class AdvancedShopPage extends HTMLElement {
  constructor() {
    super();
    
    // Data
    this.allProducts = [];
    this.categories = [];
    this.availableOptions = []; // Colors, sizes, etc.
    this.priceRange = { min: 0, max: 1000 };
    
    // Filter state
    this.activeFilters = {
      searchQuery: '',
      selectedCategory: '',
      priceMin: null,
      priceMax: null,
      selectedColors: [],
      selectedSizes: [],
      selectedOptions: {}, // For custom options
      inStockOnly: false,
      onSaleOnly: false,
      sortBy: 'newest' // newest, price-low, price-high, name-asc, name-desc
    };
    
    // Pagination
    this.currentPage = 1;
    this.itemsPerPage = 12;
    
    // View settings
    this.viewMode = 'grid'; // grid or list
    this.sidebarOpen = false;
    
    // Style props
    this.styleProps = {
      color1: '#ffffff',    // Primary BG
      color2: '#f8f9fa',    // Secondary BG
      color3: '#e5e7eb',    // Border
      color4: '#f3f4f6',    // Card BG
      color5: '#3b82f6',    // Primary Accent
      color6: '#2563eb',    // Hover Accent
      color7: 'rgba(0,0,0,0.1)', // Shadow
      color8: '#1f2937',    // Text Primary
      color9: '#6b7280',    // Text Secondary
      color10: '#111827',   // Price
      color11: '#ef4444',   // Sale/Error
      color12: '#fee2e2',   // Sale BG
      color13: '#10b981',   // Success
      slider1: '12',        // Border Radius
      slider2: '16',        // Spacing
      slider3: '16',        // Font Size
      text1: 'Shop All Products',
      text2: 'Discover our amazing collection'
    };
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['products-data', 'categories-data', 'options-data', 'price-range-data', 'style-props'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (!newVal || newVal === oldVal) return;
    
    try {
      if (name === 'products-data') {
        this.allProducts = JSON.parse(newVal);
        console.log('📦 Products loaded:', this.allProducts.length);
        this.render();
      }
      
      if (name === 'categories-data') {
        this.categories = JSON.parse(newVal);
        console.log('📂 Categories loaded:', this.categories.length);
        this.render();
      }
      
      if (name === 'options-data') {
        this.availableOptions = JSON.parse(newVal);
        console.log('🎨 Options loaded:', this.availableOptions.length);
        this.render();
      }
      
      if (name === 'price-range-data') {
        this.priceRange = JSON.parse(newVal);
        console.log('💰 Price range:', this.priceRange);
        this.render();
      }
      
      if (name === 'style-props') {
        this.styleProps = { ...this.styleProps, ...JSON.parse(newVal) };
        this.updateStyles();
      }
    } catch (error) {
      console.error('Error parsing attribute:', name, error);
    }
  }

  updateStyles() {
    const style = this.querySelector('style');
    if (style) style.textContent = this.getStyles();
  }

  // Filter products based on active filters
  getFilteredProducts() {
    let filtered = [...this.allProducts];
    
    // Search query
    if (this.activeFilters.searchQuery.trim()) {
      const query = this.activeFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) || 
        p.description?.toLowerCase().includes(query)
      );
    }
    
    // Category
    if (this.activeFilters.selectedCategory) {
      filtered = filtered.filter(p => 
        p.productType === this.activeFilters.selectedCategory ||
        p.collectionIds?.includes(this.activeFilters.selectedCategory)
      );
    }
    
    // Price range
    if (this.activeFilters.priceMin !== null) {
      filtered = filtered.filter(p => (p.price || 0) >= this.activeFilters.priceMin);
    }
    if (this.activeFilters.priceMax !== null) {
      filtered = filtered.filter(p => (p.price || 0) <= this.activeFilters.priceMax);
    }
    
    // In stock only
    if (this.activeFilters.inStockOnly) {
      filtered = filtered.filter(p => p.stock?.inStock === true);
    }
    
    // On sale only
    if (this.activeFilters.onSaleOnly) {
      filtered = filtered.filter(p => 
        p.priceData?.formatted?.discountedPrice && 
        p.priceData?.formatted?.discountedPrice !== p.priceData?.formatted?.price
      );
    }
    
    // Sort
    filtered = this.sortProducts(filtered, this.activeFilters.sortBy);
    
    return filtered;
  }

  sortProducts(products, sortBy) {
    const sorted = [...products];
    
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-high':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'name-asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'newest':
      default:
        return sorted.sort((a, b) => 
          new Date(b._createdDate || 0) - new Date(a._createdDate || 0)
        );
    }
  }

  // Get paginated products
  getPaginatedProducts() {
    const filtered = this.getFilteredProducts();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return {
      products: filtered.slice(start, end),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / this.itemsPerPage)
    };
  }

  // Apply filters and reset to page 1
  applyFilters() {
    this.currentPage = 1;
    this.render();
    this.scrollToTop();
  }

  // Clear all filters
  clearAllFilters() {
    this.activeFilters = {
      searchQuery: '',
      selectedCategory: '',
      priceMin: null,
      priceMax: null,
      selectedColors: [],
      selectedSizes: [],
      selectedOptions: {},
      inStockOnly: false,
      onSaleOnly: false,
      sortBy: 'newest'
    };
    this.currentPage = 1;
    this.render();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  optimizeImageUrl(url, width = 400, height = 400) {
    if (!url) return '';
    try {
      const mediaMatch = url.match(/\/media\/([^/]+)/);
      if (!mediaMatch) return url;
      const mediaId = mediaMatch[1];
      return `https://static.wixstatic.com/media/${mediaId}/v1/fill/w_${width},h_${height},al_c,q_85/img.jpg`;
    } catch {
      return url;
    }
  }

  calculateDiscount(regular, discounted) {
    const reg = parseFloat(String(regular).replace(/[^0-9.]/g, '')) || 0;
    const disc = parseFloat(String(discounted).replace(/[^0-9.]/g, '')) || 0;
    if (reg > 0 && disc > 0 && reg > disc) {
      return Math.round(((reg - disc) / reg) * 100);
    }
    return 0;
  }

  getStyles() {
    const { color1, color2, color3, color4, color5, color6, color7, color8, color9, color10, color11, color12, color13, slider1, slider2, slider3 } = this.styleProps;
    const radius = parseInt(slider1);
    const spacing = parseInt(slider2);
    const fontSize = parseInt(slider3);

    return `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      
      .shop-container {
        width: 100%;
        min-height: 100vh;
        background: ${color2};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      /* ===== HEADER ===== */
      .shop-header {
        background: linear-gradient(135deg, ${color5}15 0%, ${color6}10 100%);
        padding: ${spacing * 3}px ${spacing}px;
        text-align: center;
        border-bottom: 2px solid ${color3};
      }
      
      .shop-title {
        font-size: ${fontSize * 2.5}px;
        font-weight: 800;
        color: ${color8};
        margin: 0 0 ${spacing}px 0;
        line-height: 1.2;
      }
      
      .shop-subtitle {
        font-size: ${fontSize + 2}px;
        color: ${color9};
        margin: 0;
      }
      
      /* ===== LAYOUT ===== */
      .shop-layout {
        max-width: 1600px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: ${spacing * 2}px;
        padding: ${spacing * 2}px ${spacing}px;
        align-items: start;
      }
      
      /* ===== SIDEBAR ===== */
      .shop-sidebar {
        background: ${color1};
        border-radius: ${radius * 1.5}px;
        padding: ${spacing * 1.5}px;
        box-shadow: 0 2px 8px ${color7};
        position: sticky;
        top: ${spacing}px;
        max-height: calc(100vh - ${spacing * 3}px);
        overflow-y: auto;
      }
      
      .sidebar-section {
        margin-bottom: ${spacing * 2}px;
        padding-bottom: ${spacing * 2}px;
        border-bottom: 1px solid ${color3};
      }
      
      .sidebar-section:last-child {
        border-bottom: none;
      }
      
      .sidebar-title {
        font-size: ${fontSize}px;
        font-weight: 700;
        color: ${color8};
        margin-bottom: ${spacing}px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .clear-filter {
        font-size: ${fontSize - 4}px;
        color: ${color5};
        cursor: pointer;
        font-weight: 600;
        background: none;
        border: none;
        padding: 0;
      }
      
      .clear-filter:hover {
        text-decoration: underline;
      }
      
      /* Search */
      .search-input {
        width: 100%;
        padding: 10px ${spacing}px;
        border: 2px solid ${color3};
        border-radius: ${radius}px;
        font-size: ${fontSize - 2}px;
        background: ${color2};
        color: ${color8};
        transition: all 0.3s;
      }
      
      .search-input:focus {
        outline: none;
        border-color: ${color5};
        box-shadow: 0 0 0 3px ${color5}20;
      }
      
      .search-input::placeholder {
        color: ${color9};
      }
      
      /* Categories */
      .category-list {
        list-style: none;
      }
      
      .category-item {
        padding: ${spacing / 2}px 0;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: ${fontSize - 2}px;
        color: ${color8};
        transition: all 0.2s;
        border-radius: ${radius / 2}px;
        padding: ${spacing / 2}px ${spacing}px;
        margin-bottom: 4px;
      }
      
      .category-item:hover {
        background: ${color2};
        color: ${color5};
      }
      
      .category-item.active {
        background: ${color5}15;
        color: ${color5};
        font-weight: 700;
      }
      
      .category-count {
        font-size: ${fontSize - 4}px;
        background: ${color2};
        padding: 2px 8px;
        border-radius: 10px;
        color: ${color9};
      }
      
      .category-item.active .category-count {
        background: ${color5};
        color: ${color1};
      }
      
      /* Price Range */
      .price-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: ${spacing}px;
        margin-top: ${spacing}px;
      }
      
      .price-input {
        padding: 8px;
        border: 2px solid ${color3};
        border-radius: ${radius / 2}px;
        font-size: ${fontSize - 3}px;
        width: 100%;
      }
      
      .price-input:focus {
        outline: none;
        border-color: ${color5};
      }
      
      /* Checkboxes */
      .checkbox-group {
        margin-top: ${spacing}px;
      }
      
      .checkbox-item {
        display: flex;
        align-items: center;
        gap: ${spacing / 2}px;
        margin-bottom: ${spacing / 2}px;
        cursor: pointer;
      }
      
      .checkbox {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: ${color5};
      }
      
      .checkbox-label {
        font-size: ${fontSize - 2}px;
        color: ${color8};
        cursor: pointer;
      }
      
      /* Color Swatches */
      .color-grid {
        display: flex;
        flex-wrap: wrap;
        gap: ${spacing / 2}px;
        margin-top: ${spacing}px;
      }
      
      .color-swatch {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid ${color3};
        cursor: pointer;
        transition: all 0.3s;
        position: relative;
      }
      
      .color-swatch:hover {
        transform: scale(1.1);
        border-color: ${color5};
      }
      
      .color-swatch.active {
        border-color: ${color5};
        box-shadow: 0 0 0 2px ${color1}, 0 0 0 4px ${color5};
        transform: scale(1.05);
      }
      
      /* Size Buttons */
      .size-grid {
        display: flex;
        flex-wrap: wrap;
        gap: ${spacing / 2}px;
        margin-top: ${spacing}px;
      }
      
      .size-btn {
        padding: 8px 14px;
        border: 2px solid ${color3};
        background: ${color1};
        border-radius: ${radius / 2}px;
        font-size: ${fontSize - 3}px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        color: ${color8};
      }
      
      .size-btn:hover {
        border-color: ${color5};
        background: ${color5}10;
      }
      
      .size-btn.active {
        background: ${color5};
        color: ${color1};
        border-color: ${color5};
      }
      
      /* ===== MAIN CONTENT ===== */
      .shop-main {
        min-height: 600px;
      }
      
      /* Toolbar */
      .shop-toolbar {
        background: ${color1};
        padding: ${spacing}px;
        border-radius: ${radius}px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: ${spacing * 2}px;
        box-shadow: 0 2px 4px ${color7};
        flex-wrap: wrap;
        gap: ${spacing}px;
      }
      
      .results-info {
        font-size: ${fontSize - 2}px;
        color: ${color8};
        font-weight: 600;
      }
      
      .toolbar-right {
        display: flex;
        gap: ${spacing}px;
        align-items: center;
      }
      
      .sort-select {
        padding: 8px ${spacing}px;
        border: 2px solid ${color3};
        border-radius: ${radius}px;
        font-size: ${fontSize - 2}px;
        background: ${color1};
        cursor: pointer;
        color: ${color8};
      }
      
      .view-toggle {
        display: flex;
        gap: 4px;
        background: ${color2};
        padding: 4px;
        border-radius: ${radius}px;
      }
      
      .view-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: ${radius / 2}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: ${color9};
        transition: all 0.2s;
      }
      
      .view-btn.active {
        background: ${color5};
        color: ${color1};
      }
      
      /* Products Grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: ${spacing + 8}px;
      }
      
      .products-grid.list-mode {
        grid-template-columns: 1fr;
      }
      
      .product-card {
        background: ${color1};
        border-radius: ${radius}px;
        overflow: hidden;
        box-shadow: 0 2px 8px ${color7};
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        border: 2px solid transparent;
      }
      
      .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px ${color7};
        border-color: ${color5};
      }
      
      .products-grid.list-mode .product-card {
        flex-direction: row;
      }
      
      .product-image-wrapper {
        position: relative;
        width: 100%;
        padding-top: 100%;
        background: ${color4};
        overflow: hidden;
      }
      
      .products-grid.list-mode .product-image-wrapper {
        width: 200px;
        padding-top: 0;
        min-height: 200px;
      }
      
      .product-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s;
      }
      
      .product-card:hover .product-image {
        transform: scale(1.08);
      }
      
      .product-badges {
        position: absolute;
        top: ${spacing}px;
        right: ${spacing}px;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: ${spacing / 2}px;
      }
      
      .badge {
        padding: 4px 10px;
        border-radius: 15px;
        font-size: ${fontSize - 5}px;
        font-weight: 700;
        text-transform: uppercase;
      }
      
      .badge-sale {
        background: ${color11};
        color: ${color1};
      }
      
      .badge-ribbon {
        background: ${color13};
        color: ${color1};
      }
      
      .quick-view {
        position: absolute;
        bottom: ${spacing}px;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        opacity: 0;
        background: ${color5};
        color: ${color1};
        padding: 8px ${spacing * 2}px;
        border: none;
        border-radius: ${radius * 2}px;
        font-size: ${fontSize - 3}px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s;
        white-space: nowrap;
      }
      
      .product-card:hover .quick-view {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      
      .product-info {
        padding: ${spacing + 4}px;
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .product-name {
        font-size: ${fontSize + 1}px;
        font-weight: 700;
        color: ${color8};
        margin-bottom: ${spacing / 2}px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .product-description {
        font-size: ${fontSize - 3}px;
        color: ${color9};
        margin-bottom: ${spacing}px;
        display: none;
        line-height: 1.5;
      }
      
      .products-grid.list-mode .product-description {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .price-wrapper {
        display: flex;
        align-items: center;
        gap: ${spacing / 2}px;
        margin-bottom: ${spacing}px;
        flex-wrap: wrap;
      }
      
      .price {
        font-size: ${fontSize + 4}px;
        font-weight: 800;
        color: ${color10};
      }
      
      .price.sale {
        color: ${color11};
      }
      
      .old-price {
        font-size: ${fontSize - 2}px;
        color: ${color9};
        text-decoration: line-through;
      }
      
      .discount-percent {
        background: ${color13};
        color: ${color1};
        padding: 2px 6px;
        border-radius: 10px;
        font-size: ${fontSize - 6}px;
        font-weight: 700;
      }
      
      .product-actions {
        display: flex;
        gap: ${spacing / 2}px;
        margin-top: auto;
      }
      
      .product-btn {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: ${radius}px;
        font-size: ${fontSize - 3}px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s;
        text-transform: uppercase;
      }
      
      .btn-view {
        background: ${color2};
        color: ${color8};
        border: 2px solid ${color3};
      }
      
      .btn-view:hover {
        background: ${color4};
        border-color: ${color5};
      }
      
      .btn-cart {
        background: ${color5};
        color: ${color1};
      }
      
      .btn-cart:hover {
        background: ${color6};
        transform: translateY(-2px);
      }
      
      /* Empty State */
      .empty-state {
        text-align: center;
        padding: ${spacing * 6}px ${spacing * 2}px;
        color: ${color9};
      }
      
      .empty-icon {
        font-size: 72px;
        margin-bottom: ${spacing}px;
        opacity: 0.3;
      }
      
      .empty-title {
        font-size: ${fontSize + 6}px;
        font-weight: 700;
        color: ${color8};
        margin-bottom: ${spacing / 2}px;
      }
      
      /* Pagination */
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: ${spacing / 2}px;
        margin-top: ${spacing * 3}px;
        flex-wrap: wrap;
      }
      
      .page-btn {
        min-width: 40px;
        height: 40px;
        padding: 0 ${spacing}px;
        border: 2px solid ${color3};
        background: ${color1};
        border-radius: ${radius}px;
        font-size: ${fontSize - 2}px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        color: ${color8};
      }
      
      .page-btn:hover:not(:disabled) {
        border-color: ${color5};
        background: ${color5}10;
      }
      
      .page-btn.active {
        background: ${color5};
        color: ${color1};
        border-color: ${color5};
      }
      
      .page-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      /* Mobile Filter Button */
      .mobile-filter-btn {
        display: none;
        position: fixed;
        bottom: ${spacing * 2}px;
        right: ${spacing * 2}px;
        width: 56px;
        height: 56px;
        background: ${color5};
        color: ${color1};
        border: none;
        border-radius: 50%;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px ${color7};
        z-index: 100;
      }
      
      /* Mobile Sidebar */
      .sidebar-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 999;
      }
      
      /* Responsive */
      @media (max-width: 1024px) {
        .shop-layout {
          grid-template-columns: 1fr;
        }
        
        .shop-sidebar {
          position: fixed;
          left: -100%;
          top: 0;
          height: 100vh;
          width: 280px;
          max-height: 100vh;
          z-index: 1000;
          transition: left 0.3s;
          border-radius: 0;
        }
        
        .shop-sidebar.open {
          left: 0;
        }
        
        .sidebar-overlay.open {
          display: block;
        }
        
        .mobile-filter-btn {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
      
      @media (max-width: 768px) {
        .shop-title {
          font-size: ${fontSize * 1.8}px;
        }
        
        .products-grid {
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: ${spacing}px;
        }
        
        .products-grid.list-mode {
          grid-template-columns: 1fr;
        }
        
        .products-grid.list-mode .product-card {
          flex-direction: column;
        }
        
        .products-grid.list-mode .product-image-wrapper {
          width: 100%;
          padding-top: 100%;
          min-height: 0;
        }
      }
    `;
  }

  render() {
    const { products, total, totalPages } = this.getPaginatedProducts();
    
    this.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="shop-container">
        
        <!-- Header -->
        <header class="shop-header">
          <h1 class="shop-title">${this.styleProps.text1}</h1>
          <p class="shop-subtitle">${this.styleProps.text2}</p>
        </header>
        
        <!-- Main Layout -->
        <div class="shop-layout">
          
          <!-- Sidebar -->
          ${this.renderSidebar()}
          
          <!-- Main Content -->
          <main class="shop-main">
            ${this.renderToolbar(total)}
            ${products.length > 0 ? this.renderProducts(products) : this.renderEmpty()}
            ${totalPages > 1 ? this.renderPagination(totalPages) : ''}
          </main>
          
        </div>
        
        <!-- Mobile Filter Button -->
        <button class="mobile-filter-btn" data-action="toggle-sidebar">☰</button>
        
        <!-- Sidebar Overlay -->
        <div class="sidebar-overlay ${this.sidebarOpen ? 'open' : ''}" data-action="close-sidebar"></div>
        
      </div>
    `;
    
    this.attachEventListeners();
  }

  renderSidebar() {
    const categoryCount = (catId) => {
      if (!catId) return this.allProducts.length;
      return this.allProducts.filter(p => 
        p.productType === catId || p.collectionIds?.includes(catId)
      ).length;
    };

    return `
      <aside class="shop-sidebar ${this.sidebarOpen ? 'open' : ''}">
        
        <!-- Search -->
        <div class="sidebar-section">
          <div class="sidebar-title">Search</div>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search products..." 
            value="${this.activeFilters.searchQuery}"
            data-filter="search"
          >
        </div>
        
        <!-- Categories -->
        <div class="sidebar-section">
          <div class="sidebar-title">
            Categories
            ${this.activeFilters.selectedCategory ? '<button class="clear-filter" data-action="clear-category">Clear</button>' : ''}
          </div>
          <ul class="category-list">
            <li class="category-item ${!this.activeFilters.selectedCategory ? 'active' : ''}" data-category="">
              All Products
              <span class="category-count">${categoryCount('')}</span>
            </li>
            ${this.categories.map(cat => `
              <li class="category-item ${this.activeFilters.selectedCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
                ${cat.name}
                <span class="category-count">${cat.itemCount || categoryCount(cat.id)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        
        <!-- Price Range -->
        <div class="sidebar-section">
          <div class="sidebar-title">
            Price Range
            ${(this.activeFilters.priceMin !== null || this.activeFilters.priceMax !== null) ? '<button class="clear-filter" data-action="clear-price">Clear</button>' : ''}
          </div>
          <div class="price-inputs">
            <input 
              type="number" 
              class="price-input" 
              placeholder="Min" 
              value="${this.activeFilters.priceMin || ''}"
              data-filter="price-min"
            >
            <input 
              type="number" 
              class="price-input" 
              placeholder="Max" 
              value="${this.activeFilters.priceMax || ''}"
              data-filter="price-max"
            >
          </div>
        </div>
        
        <!-- Availability -->
        <div class="sidebar-section">
          <div class="sidebar-title">Availability</div>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                class="checkbox" 
                ${this.activeFilters.inStockOnly ? 'checked' : ''}
                data-filter="in-stock"
              >
              <span class="checkbox-label">In Stock Only</span>
            </label>
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                class="checkbox" 
                ${this.activeFilters.onSaleOnly ? 'checked' : ''}
                data-filter="on-sale"
              >
              <span class="checkbox-label">On Sale</span>
            </label>
          </div>
        </div>
        
        <!-- Clear All -->
        <div class="sidebar-section">
          <button class="clear-filter" data-action="clear-all" style="width: 100%; text-align: center; padding: 10px; background: ${this.styleProps.color2}; border-radius: ${this.styleProps.slider1}px;">
            Clear All Filters
          </button>
        </div>
        
      </aside>
    `;
  }

  renderToolbar(total) {
    return `
      <div class="shop-toolbar">
        <div class="results-info">
          Showing ${this.getPaginatedProducts().products.length} of ${total} products
        </div>
        <div class="toolbar-right">
          <select class="sort-select" data-filter="sort">
            <option value="newest" ${this.activeFilters.sortBy === 'newest' ? 'selected' : ''}>Newest First</option>
            <option value="price-low" ${this.activeFilters.sortBy === 'price-low' ? 'selected' : ''}>Price: Low to High</option>
            <option value="price-high" ${this.activeFilters.sortBy === 'price-high' ? 'selected' : ''}>Price: High to Low</option>
            <option value="name-asc" ${this.activeFilters.sortBy === 'name-asc' ? 'selected' : ''}>Name: A-Z</option>
            <option value="name-desc" ${this.activeFilters.sortBy === 'name-desc' ? 'selected' : ''}>Name: Z-A</option>
          </select>
          <div class="view-toggle">
            <button class="view-btn ${this.viewMode === 'grid' ? 'active' : ''}" data-view="grid">⊞</button>
            <button class="view-btn ${this.viewMode === 'list' ? 'active' : ''}" data-view="list">☰</button>
          </div>
        </div>
      </div>
    `;
  }

  renderProducts(products) {
    return `
      <div class="products-grid ${this.viewMode === 'list' ? 'list-mode' : ''}">
        ${products.map(p => this.renderProductCard(p)).join('')}
      </div>
    `;
  }

  renderProductCard(product) {
    const hasDiscount = product.priceData?.formatted?.discountedPrice && 
                        product.priceData.formatted.discountedPrice !== product.priceData.formatted.price;
    const discountPercent = hasDiscount ? 
      this.calculateDiscount(product.priceData.formatted.price, product.priceData.formatted.discountedPrice) : 0;

    return `
      <article class="product-card" data-product-id="${product._id}">
        <div class="product-image-wrapper">
          <img 
            class="product-image" 
            src="${this.optimizeImageUrl(product.media?.mainMedia?.image?.url, 400, 400)}"
            alt="${product.name}"
            loading="lazy"
          >
          <div class="product-badges">
            ${hasDiscount ? '<span class="badge badge-sale">Sale</span>' : ''}
            ${product.ribbon ? `<span class="badge badge-ribbon">${product.ribbon}</span>` : ''}
          </div>
          <button class="quick-view" data-action="quick-view" data-product-id="${product._id}">Quick View</button>
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          ${this.viewMode === 'list' && product.description ? 
            `<p class="product-description">${product.description.substring(0, 120)}...</p>` : ''}
          <div class="price-wrapper">
            ${hasDiscount ? `
              <span class="price sale">${product.priceData.formatted.discountedPrice}</span>
              <span class="old-price">${product.priceData.formatted.price}</span>
              ${discountPercent > 0 ? `<span class="discount-percent">-${discountPercent}%</span>` : ''}
            ` : `
              <span class="price">${product.priceData?.formatted?.price || 'N/A'}</span>
            `}
          </div>
          <div class="product-actions">
            <button class="product-btn btn-view" data-action="view-product" data-product-id="${product._id}">View</button>
            <button class="product-btn btn-cart" data-action="add-to-cart" data-product-id="${product._id}">Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }

  renderEmpty() {
    return `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">No products found</h3>
        <p>Try adjusting your filters or search term</p>
      </div>
    `;
  }

  renderPagination(totalPages) {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return `
      <nav class="pagination">
        <button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">←</button>
        ${pages.map(p => 
          p === '...' ? '<span class="page-btn" disabled>...</span>' :
          `<button class="page-btn ${p === this.currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`
        ).join('')}
        <button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">→</button>
      </nav>
    `;
  }

  attachEventListeners() {
    // Search
    const searchInput = this.querySelector('[data-filter="search"]');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.activeFilters.searchQuery = e.target.value;
          this.applyFilters();
        }, 300);
      });
    }

    // Categories
    this.querySelectorAll('[data-category]').forEach(el => {
      el.addEventListener('click', () => {
        this.activeFilters.selectedCategory = el.dataset.category;
        this.applyFilters();
      });
    });

    // Price range
    const priceMin = this.querySelector('[data-filter="price-min"]');
    const priceMax = this.querySelector('[data-filter="price-max"]');
    
    if (priceMin) {
      priceMin.addEventListener('change', (e) => {
        this.activeFilters.priceMin = e.target.value ? parseFloat(e.target.value) : null;
        this.applyFilters();
      });
    }
    
    if (priceMax) {
      priceMax.addEventListener('change', (e) => {
        this.activeFilters.priceMax = e.target.value ? parseFloat(e.target.value) : null;
        this.applyFilters();
      });
    }

    // Checkboxes
    const inStockCheckbox = this.querySelector('[data-filter="in-stock"]');
    const onSaleCheckbox = this.querySelector('[data-filter="on-sale"]');
    
    if (inStockCheckbox) {
      inStockCheckbox.addEventListener('change', (e) => {
        this.activeFilters.inStockOnly = e.target.checked;
        this.applyFilters();
      });
    }
    
    if (onSaleCheckbox) {
      onSaleCheckbox.addEventListener('change', (e) => {
        this.activeFilters.onSaleOnly = e.target.checked;
        this.applyFilters();
      });
    }

    // Sort
    const sortSelect = this.querySelector('[data-filter="sort"]');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.activeFilters.sortBy = e.target.value;
        this.render();
      });
    }

    // View toggle
    this.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.viewMode = e.target.dataset.view;
        this.render();
      });
    });

    // Clear filters
    this.querySelectorAll('[data-action="clear-category"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilters.selectedCategory = '';
        this.applyFilters();
      });
    });

    this.querySelectorAll('[data-action="clear-price"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeFilters.priceMin = null;
        this.activeFilters.priceMax = null;
        this.applyFilters();
      });
    });

    this.querySelectorAll('[data-action="clear-all"]').forEach(btn => {
      btn.addEventListener('click', () => this.clearAllFilters());
    });

    // Product actions
    this.querySelectorAll('[data-action="view-product"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('viewProduct', {
          detail: { productId: e.target.dataset.productId }
        }));
      });
    });

    this.querySelectorAll('[data-action="add-to-cart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('addToCart', {
          detail: { productId: e.target.dataset.productId }
        }));
      });
    });

    this.querySelectorAll('[data-action="quick-view"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('quickView', {
          detail: { productId: e.target.dataset.productId }
        }));
      });
    });

    // Pagination
    this.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (!isNaN(page) && page >= 1) {
          this.currentPage = page;
          this.render();
          this.scrollToTop();
        }
      });
    });

    // Mobile sidebar
    this.querySelectorAll('[data-action="toggle-sidebar"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sidebarOpen = !this.sidebarOpen;
        this.render();
      });
    });

    this.querySelectorAll('[data-action="close-sidebar"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.sidebarOpen = false;
        this.render();
      });
    });
  }
}

customElements.define('advanced-shop-page', AdvancedShopPage);
