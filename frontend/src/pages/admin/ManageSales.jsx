import React, { useState, useEffect, useCallback } from 'react';
import api, { assetUrl, errorMessage } from '../../api/client';
import '../../css/ManageSales.css';

const GENDER_OPTIONS = [
  { value: '', label: 'All Genders' },
  { value: 'men', label: "Men's" },
  { value: 'women', label: "Women's" },
  { value: 'kids_male', label: 'Kids — Boy' },
  { value: 'kids_female', label: 'Kids — Girl' },
  { value: 'unisex', label: 'Unisex' },
];

const formatPrice = (price) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(price);

const SaleStatusBadge = ({ product }) => {
  if (!product.saleActive) return <span className="ms-badge ms-badge--none">No Sale</span>;
  const end = product.saleEndDate ? new Date(product.saleEndDate) : null;
  if (end && end < new Date()) return <span className="ms-badge ms-badge--expired">Expired</span>;
  return <span className="ms-badge ms-badge--active">ON SALE</span>;
};

const ProductRow = ({ product, selected, onToggle }) => (
  <tr
    className={`ms-table-row ${selected ? 'ms-table-row--selected' : ''}`}
    onClick={() => onToggle(product._id)}
  >
    <td className="ms-td ms-td--check">
      <span className={`ms-checkbox ${selected ? 'ms-checkbox--checked' : ''}`}>
        {selected && <span className="ms-checkmark">✓</span>}
      </span>
    </td>
    <td className="ms-td ms-td--image">
      {product.images?.[0] ? (
        <img src={assetUrl(product.images[0])} alt={product.name} className="ms-thumb" />
      ) : (
        <div className="ms-thumb ms-thumb--empty" />
      )}
    </td>
    <td className="ms-td ms-td--name">
      <span className="ms-product-name">{product.name}</span>
      <div className="ms-product-meta">
        {product.gender && <span className="ms-meta-pill ms-meta-pill--gender">{GENDER_OPTIONS.find(g => g.value === product.gender)?.label || product.gender}</span>}
        {product.category && <span className="ms-meta-pill ms-meta-pill--cat">{product.category}</span>}
        {product.subCategory && <span className="ms-meta-pill ms-meta-pill--sub">{product.subCategory}</span>}
      </div>
    </td>
    <td className="ms-td ms-td--price">
      <span className="ms-original-price">{formatPrice(product.price)}</span>
      {product.saleActive && product.salePrice && (
        <span className="ms-sale-price">{formatPrice(product.salePrice)}</span>
      )}
    </td>
    <td className="ms-td ms-td--discount">
      {product.saleActive && product.salePercent ? (
        <span className="ms-discount-badge">−{product.salePercent}%</span>
      ) : (
        <span className="ms-discount-empty">—</span>
      )}
    </td>
    <td className="ms-td ms-td--status">
      <SaleStatusBadge product={product} />
    </td>
  </tr>
);

const ManageSales = () => {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [filterSale, setFilterSale] = useState('all');

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [applying, setApplying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchFilters = useCallback(async () => {
    setFiltersLoading(true);
    try {
      const params = {};
      if (filterGender) params.gender = filterGender;
      if (filterCategory) params.category = filterCategory;
      const { data } = await api.get('/sales/filters', { params });
      setCategories(data.categories || []);
      setSubCategories(data.subCategories || []);
    } catch {
      setCategories([]);
      setSubCategories([]);
    } finally {
      setFiltersLoading(false);
    }
  }, [filterGender, filterCategory]);

  useEffect(() => { fetchFilters(); }, [fetchFilters]);

  useEffect(() => { setFilterCategory(''); setFilterSubCategory(''); }, [filterGender]);
  useEffect(() => { setFilterSubCategory(''); }, [filterCategory]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (search) params.search = search;
      if (filterGender) params.gender = filterGender;
      if (filterCategory) params.category = filterCategory;
      if (filterSubCategory) params.subCategory = filterSubCategory;

      const { data } = await api.get('/sales/products', { params });
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterGender, filterCategory, filterSubCategory]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredProducts = products.filter(p => {
    if (filterSale === 'active') return p.saleActive;
    if (filterSale === 'none') return !p.saleActive;
    return true;
  });

  const allVisibleSelected =
    filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p._id));

  const toggleSelectAll = () => {
    const visible = filteredProducts.map(p => p._id);
    const allSel = visible.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      allSel ? visible.forEach(id => next.delete(id)) : visible.forEach(id => next.add(id));
      return next;
    });
  };

  const handleApply = async () => {
    if (selectedIds.size === 0) { showToast('Select at least one product', 'error'); return; }
    if (!discountValue || Number(discountValue) <= 0) { showToast('Enter a valid discount value', 'error'); return; }
    setApplying(true);
    try {
      const { data } = await api.post('/sales/apply', {
        productIds: Array.from(selectedIds),
        discountType,
        discountValue: Number(discountValue),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      showToast(data.message);
      setSelectedIds(new Set());
      setDiscountValue('');
      setStartDate('');
      setEndDate('');
      fetchProducts();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to apply sale'), 'error');
    } finally {
      setApplying(false);
    }
  };

  const handleRemove = async () => {
    if (selectedIds.size === 0) { showToast('Select at least one product', 'error'); return; }
    setRemoving(true);
    try {
      const { data } = await api.post('/sales/remove', { productIds: Array.from(selectedIds) });
      showToast(data.message);
      setSelectedIds(new Set());
      fetchProducts();
    } catch (err) {
      showToast(errorMessage(err, 'Failed to remove sale'), 'error');
    } finally {
      setRemoving(false);
    }
  };

  const handleReset = () => {
    setFilterGender('');
    setFilterCategory('');
    setFilterSubCategory('');
    setFilterSale('all');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const todayStr = new Date().toISOString().slice(0, 16);
  const hasActiveFilters = filterGender || filterCategory || filterSubCategory || filterSale !== 'all' || search;

  return (
    <div className="ms-page">

      {toast && (
        <div className={`ms-toast ms-toast--${toast.type}`}>
          <span className="ms-toast-icon">{toast.type === 'success' ? '✓' : '✕'}</span>
          {toast.msg}
        </div>
      )}

      <div className="ms-header">
        <div className="ms-header-left">
          <p className="ms-eyebrow">Admin Panel</p>
          <h1 className="ms-title">Sale Manager</h1>
          <p className="ms-subtitle">{total} products total</p>
        </div>
      </div>

      <div className="ms-layout">

        <div className="ms-panel ms-panel--products">

          <div className="ms-filter-bar">

            <div className="ms-filter-row ms-filter-row--top">
              <div className="ms-search-wrap">
                <span className="ms-search-icon">⌕</span>
                <input
                  className="ms-search"
                  type="text"
                  placeholder="Search by name…"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { setSearch(searchInput); setPage(1); }
                  }}
                />
                {searchInput && (
                  <button className="ms-search-clear" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>✕</button>
                )}
              </div>
              {hasActiveFilters && (
                <button className="ms-reset-btn" onClick={handleReset}>Reset Filters</button>
              )}
            </div>

            <div className="ms-filter-row ms-filter-row--selects">

              <div className="ms-filter-group">
                <label className="ms-filter-label">Gender</label>
                <select
                  className="ms-filter-select"
                  value={filterGender}
                  onChange={e => { setFilterGender(e.target.value); setPage(1); }}
                >
                  {GENDER_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="ms-filter-group">
                <label className="ms-filter-label">Category</label>
                <select
                  className="ms-filter-select"
                  value={filterCategory}
                  onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
                  disabled={filtersLoading}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="ms-filter-group">
                <label className="ms-filter-label">Sub-Category</label>
                <select
                  className="ms-filter-select"
                  value={filterSubCategory}
                  onChange={e => { setFilterSubCategory(e.target.value); setPage(1); }}
                  disabled={!filterCategory || filtersLoading}
                >
                  <option value="">All Sub-Categories</option>
                  {subCategories.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="ms-filter-group ms-filter-group--sale">
                <label className="ms-filter-label">Sale Status</label>
                <div className="ms-filter-tabs">
                  {['all', 'active', 'none'].map(f => (
                    <button
                      key={f}
                      className={`ms-filter-tab ${filterSale === f ? 'ms-filter-tab--active' : ''}`}
                      onClick={() => setFilterSale(f)}
                    >
                      {f === 'all' ? 'All' : f === 'active' ? 'On Sale' : 'No Sale'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div className="ms-table-container">
            {loading ? (
              <div className="ms-loading">
                <div className="ms-spinner" />
                <span>Loading products…</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="ms-empty">No products found</div>
            ) : (
              <table className="ms-table">
                <thead>
                  <tr className="ms-table-head-row">
                    <th className="ms-th ms-th--check">
                      <span
                        className={`ms-checkbox ${allVisibleSelected ? 'ms-checkbox--checked' : ''}`}
                        onClick={toggleSelectAll}
                      >
                        {allVisibleSelected && <span className="ms-checkmark">✓</span>}
                      </span>
                    </th>
                    <th className="ms-th"></th>
                    <th className="ms-th">Product</th>
                    <th className="ms-th">Price</th>
                    <th className="ms-th">Discount</th>
                    <th className="ms-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <ProductRow
                      key={product._id}
                      product={product}
                      selected={selectedIds.has(product._id)}
                      onToggle={toggleSelect}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="ms-pagination">
              <button className="ms-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
              <span className="ms-page-info">Page {page} of {totalPages}</span>
              <button className="ms-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
            </div>
          )}
        </div>

        <aside className="ms-panel ms-panel--controls">

          <div className="ms-selection-summary">
            <span className="ms-selection-count">{selectedIds.size}</span>
            <span className="ms-selection-label">
              {selectedIds.size === 1 ? 'product selected' : 'products selected'}
            </span>
          </div>

          <div className="ms-control-section">
            <p className="ms-control-heading">Discount Type</p>
            <div className="ms-type-toggle">
              <button
                className={`ms-type-btn ${discountType === 'percent' ? 'ms-type-btn--active' : ''}`}
                onClick={() => setDiscountType('percent')}
              >
                % Percent
              </button>
              <button
                className={`ms-type-btn ${discountType === 'flat' ? 'ms-type-btn--active' : ''}`}
                onClick={() => setDiscountType('flat')}
              >
                Rs. Flat
              </button>
            </div>
          </div>

          <div className="ms-control-section">
            <label className="ms-label">
              {discountType === 'percent' ? 'Discount %' : 'Discount Amount (Rs.)'}
            </label>
            <div className="ms-input-wrap">
              <span className="ms-input-prefix">{discountType === 'percent' ? '%' : 'Rs.'}</span>
              <input
                className="ms-input"
                type="number"
                min="0"
                max={discountType === 'percent' ? 100 : undefined}
                step={discountType === 'percent' ? '1' : '10'}
                placeholder={discountType === 'percent' ? '0 – 100' : 'e.g. 500'}
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
              />
            </div>
          </div>

          <div className="ms-control-section">
            <label className="ms-label">Sale Start</label>
            <input
              className="ms-input ms-input--date"
              type="datetime-local"
              value={startDate}
              min={todayStr}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="ms-control-section">
            <label className="ms-label">Sale End <span className="ms-optional">(optional)</span></label>
            <input
              className="ms-input ms-input--date"
              type="datetime-local"
              value={endDate}
              min={startDate || todayStr}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          <div className="ms-actions">
            <button
              className="ms-action-btn ms-action-btn--apply"
              onClick={handleApply}
              disabled={applying || selectedIds.size === 0}
            >
              {applying ? <span className="ms-spinner ms-spinner--sm" /> : null}
              {applying ? 'Applying…' : 'Apply Sale'}
            </button>

            <button
              className="ms-action-btn ms-action-btn--remove"
              onClick={handleRemove}
              disabled={removing || selectedIds.size === 0}
            >
              {removing ? <span className="ms-spinner ms-spinner--sm" /> : null}
              {removing ? 'Removing…' : 'Remove Sale'}
            </button>
          </div>

          <div className="ms-note">
            <p className="ms-note-text">
              Filter by gender, category, or sub-category then select products and click <strong>Apply Sale</strong>.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ManageSales;