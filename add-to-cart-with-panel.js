<script>
class ProductCard extends HTMLElement {
  constructor() {
    super();
    this.selectedOptions = {};
    this.quantities = {};
    this.products = [];           // all products we received
    this.filteredProducts = [];   // products we actually show
    this.errors = {};
    this.loadedImages = new Set();
    this.categoryId = null;
  }

  connectedCallback() {
    this.render();
    this.setupIntersectionObserver();
  }

  static get observedAttributes() {
    return ['products-data', 'error-data', 'category-id'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'products-data' && newVal && newVal !== oldVal) {
      try {
        this.products = JSON.parse(newVal);
        console.log('📦 Received products:', this.products.length);

        this.products.forEach(p => {
          this.selectedOptions[p._id] = {};
          this.quantities[p._id] = 1;
          this.errors[p._id] = '';
        });

        this.applyCategoryFilter();
        this.render();
      } catch (error) {
        console.error('Error parsing products:', error);
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

    if (name === 'category-id') {
      this.categoryId = newVal || null;
      console.log('Category changed to:', this.categoryId);
      this.applyCategoryFilter();
      this.render();
    }
  }

  applyCategoryFilter() {
    if (!this.categoryId) {
      this.filteredProducts = [...this.products];
    } else {
      this.filteredProducts = this.products.filter(p => 
        p.categoryIds && p.categoryIds.includes(this.categoryId)
      );
    }
    console.log(`Showing ${this.filteredProducts.length} products`);
  }

  optimizeImageUrl(url, width = 480, height = 480) {
    if (!url) return '';
    try {
      const match = url.match(/\/media\/([^/]+)/);
      if (!match) return url;
      const id = match[1];
      return `https://static.wixstatic.com/media/${id}/v1/fill/w_${width},h_${height},al_c,q_auto,usm_0.66_1.00_0.01,enc_avif,quality_auto/${id}`;
    } catch (e) {
      return url;
    }
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src && !this.loadedImages.has(img.dataset.src)) {
            img.src = img.dataset.src;
            img.classList.add('loaded');
            this.loadedImages.add(img.dataset.src);
            observer.unobserve(img);
          }
        }
      });
    }, { rootMargin: '100px', threshold: 0.1 });

    this.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
  }

  validateOptions(productId) {
    const product = this.products.find(p => p._id === productId);
    if (!product?.productOptions?.length) return true;

    const selected = this.selectedOptions[productId] || {};
    const missing = product.productOptions
      .filter(opt => !selected[opt.name])
      .map(opt => opt.name);

    if (missing.length) {
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
    if (!card) return;
    const errorEl = card.querySelector('.error-message');
    if (errorEl) {
      errorEl.textContent = this.errors[productId] || '';
      errorEl.style.display = this.errors[productId] ? 'block' : 'none';
    }
  }

  render() {
    const productsToShow = this.filteredProducts.length ? this.filteredProducts : this.products;

    if (!productsToShow.length) {
      this.innerHTML = '<div style="padding:40px; text-align:center; color:#666;">No products found</div>';
      return;
    }

    this.innerHTML = `
<style>
:host { display: block; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 28px;
  padding: 20px;
}
.card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: all 0.28s ease;
  display: flex;
  flex-direction: column;
}
.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
}
.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1/1;
  background: #f8f9fa;
  overflow: hidden;
}
.image-wrapper img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.45s ease;
  opacity: 0;
}
.image-wrapper img.loaded { opacity: 1; }
.card:hover .image-wrapper img.loaded { transform: scale(1.06); }

.content { padding: 20px; display: flex; flex-direction: column; gap: 16px; flex: 1; }
.title { font-size: 1.12rem; font-weight: 600; color: #1a1a1a; line-height: 1.35; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.price { font-size: 1.32rem; font-weight: 700; color: #000; margin: 4px 0 8px; }

.option { margin-bottom: 20px; }
.option label { font-size: 0.92rem; font-weight: 600; color: #444; margin-bottom: 10px; display: block; }
.swatches { display: flex; flex-wrap: wrap; gap: 10px; }
.swatch {
  width: 38px; height: 38px; border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; transition: all 0.2s; background-size: cover; box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.swatch:hover { transform: scale(1.12); box-shadow: 0 3px 10px rgba(0,0,0,0.15); }
.swatch.selected { border-color: #000; box-shadow: 0 0 0 3px #fff, 0 0 0 5px #000; }

select {
  width: 100%; padding: 11px 14px; border: 1px solid #d1d5db; border-radius: 10px;
  font-size: 0.96rem; background: white; cursor: pointer;
}
select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); outline: none; }

.error-message {
  color: #dc2626; font-size: 0.875rem; margin: 10px 0; padding: 10px 14px;
  background: #fef2f2; border-radius: 10px; border: 1px solid #fecaca; display: none;
}

.quantity-row {
  display: flex; align-items: center; justify-content: space-between;
  background: #f9fafb; padding: 12px 16px; border-radius: 12px; margin: 12px 0;
}
.quantity-row label { font-weight: 600; color: #444; font-size: 0.95rem; }
.quantity-controls { display: flex; align-items: center; gap: 10px; }
.qty-btn {
  width: 36px; height: 36px; border: 1px solid #d1d5db; background: white;
  border-radius: 10px; font-size: 1.3rem; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; color: #374151;
}
.qty-btn:hover:not(:disabled) { background: #eff6ff; border-color: #3b82f6; color: #1d4ed8; }
.qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.qty-value { min-width: 44px; text-align: center; font-size: 1.18rem; font-weight: 600; }

.actions { display: flex; gap: 12px; margin-top: auto; }
.btn {
  flex: 1; padding: 13px 20px; border-radius: 12px; font-weight: 600; font-size: 0.96rem;
  cursor: pointer; transition: all 0.22s; text-align: center; border: none;
}
.btn-view { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
.btn-view:hover { background: #e5e7eb; }
.btn-add { background: linear-gradient(90deg, #3b82f6, #2563eb); color: white; }
.btn-add:hover { background: linear-gradient(90deg, #2563eb, #1d4ed8); transform: translateY(-1.5px); box-shadow: 0 8px 20px rgba(37,99,235,0.3); }

@media (max-width: 640px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; padding: 16px; }
  .title { font-size: 1.05rem; }
  .price { font-size: 1.22rem; }
  .actions { flex-direction: column; gap: 10px; }
}
</style>

<div class="grid">
  ${productsToShow.map((p, i) => `
    <div class="card" data-product-id="${p._id}">
      <div class="image-wrapper">
        <img
          ${i < 5 ? `src="${this.optimizeImageUrl(p.media?.mainMedia?.image?.url)}"` : `data-src="${this.optimizeImageUrl(p.media?.mainMedia?.image?.url)}"`}
          alt="${p.name || 'Product'}"
          class="${i < 5 ? 'loaded' : ''}"
        >
      </div>
      <div class="content">
        <h3 class="title">${p.name || 'Product'}</h3>
        <div class="price">${p.priceData?.formatted?.price || '—'}</div>

        ${p.productOptions?.length ? `
          <div class="options-section">
            ${p.productOptions.map(opt => `
              <div class="option">
                <label>${opt.name}</label>
                ${opt.optionType === 'color' ? `
                  <div class="swatches">
                    ${opt.choices.map(c => `
                      <button class="swatch" style="background-color:${c.value};"
                        data-option="${opt.name}" data-description="${c.description}" title="${c.description}"></button>
                    `).join('')}
                  </div>
                ` : `
                  <select data-option="${opt.name}">
                    <option value="">Select ${opt.name}</option>
                    ${opt.choices.map(c => `<option value="${c.description}">${c.description}</option>`).join('')}
                  </select>
                `}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="quantity-row">
          <label>Quantity</label>
          <div class="quantity-controls">
            <button class="qty-btn" data-action="decrease">−</button>
            <span class="qty-value">${this.quantities[p._id] || 1}</span>
            <button class="qty-btn" data-action="increase">+</button>
          </div>
        </div>

        <div class="error-message"></div>

        <div class="actions">
          <button class="btn btn-view" data-action="view">View Details</button>
          <button class="btn btn-add" data-action="add">Add to Cart</button>
        </div>
      </div>
    </div>
  `).join('')}
</div>
    `;

    this.setupIntersectionObserver();
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Color swatches
    this.querySelectorAll('.swatch').forEach(btn => {
      btn.addEventListener('click', e => {
        const card = btn.closest('.card');
        const pid = card.dataset.productId;
        const opt = btn.dataset.option;
        const desc = btn.dataset.description;

        this.selectedOptions[pid][opt] = desc;
        this.errors[pid] = '';
        this.updateErrorDisplay(pid);

        card.querySelectorAll(`.swatch[data-option="${opt}"]`).forEach(s => s.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Dropdowns
    this.querySelectorAll('select').forEach(sel => {
      sel.addEventListener('change', e => {
        const card = sel.closest('.card');
        const pid = card.dataset.productId;
        const opt = sel.dataset.option;
        const val = sel.value;

        if (val) this.selectedOptions[pid][opt] = val;
        else delete this.selectedOptions[pid][opt];

        this.errors[pid] = '';
        this.updateErrorDisplay(pid);
      });
    });

    // Quantity
    this.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const card = btn.closest('.card');
        const pid = card.dataset.productId;
        const action = btn.dataset.action;
        const display = card.querySelector('.qty-value');

        let qty = this.quantities[pid] || 1;
        if (action === 'decrease' && qty > 1) qty--;
        if (action === 'increase' && qty < 99) qty++;

        this.quantities[pid] = qty;
        display.textContent = qty;

        card.querySelector('[data-action="decrease"]').disabled = qty <= 1;
        card.querySelector('[data-action="increase"]').disabled = qty >= 99;
      });
    });

    // Buttons
    this.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const card = btn.closest('.card');
        const pid = card.dataset.productId;
        const action = btn.dataset.action;
        const product = this.products.find(p => p._id === pid);

        if (action === 'view') {
          this.dispatchEvent(new CustomEvent('viewProduct', {
            detail: { productId: pid, product },
            bubbles: true,
            composed: true
          }));
        } else if (action === 'add') {
          if (this.validateOptions(pid)) {
            const choices = this.selectedOptions[pid] || {};
            const quantity = this.quantities[pid] || 1;
            this.dispatchEvent(new CustomEvent('addToCart', {
              detail: { productId: pid, choices, quantity },
              bubbles: true,
              composed: true
            }));
          }
        }
      });
    });
  }
}

customElements.define('product-card-element', ProductCard);
</script>
