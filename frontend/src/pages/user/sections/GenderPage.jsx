import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { assetUrl, getStoredUser } from '../../../api/client';
import { ArrowLeft, ArrowRight, Plus, Tag, Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import "../../../css/GenderPage.css";

const GENDER_META = {
  men:         { label: "Men's Collection",   heading: 'Men',    accent: 'M' },
  women:       { label: "Women's Collection", heading: 'Women',  accent: 'W' },
  unisex:      { label: 'Unisex Collection',  heading: 'Unisex', accent: 'U' },
  kids_male:   { label: 'Kids — Boys',        heading: 'Boys',   accent: 'B' },
  kids_female: { label: 'Kids — Girls',       heading: 'Girls',  accent: 'G' },
};

const SORT_OPTIONS = [
  { value: 'default',    label: 'Default' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc',   label: 'Name: A–Z' },
  { value: 'name_desc',  label: 'Name: Z–A' },
];

const ProductCard = ({ product, index }) => (
  <div
    className="gp-card scroll-reveal"
    style={{ transitionDelay: `${index * 0.06}s` }}
  >
    <div className="gp-img-wrap">
      <img
        src={assetUrl(product.images?.[0])}
        alt={product.name}
        className="gp-img"
      />
      <div className="gp-img-overlay">
        <Link to={`/product/${product._id}`} className="gp-quick-view">
          Quick View <ArrowRight size={10} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
    <div className="gp-card-info">
      <h3 className="gp-card-name">{product.name}</h3>
      <div className="gp-card-footer">
        <span className="gp-price">Rs. {(product.effectivePrice ?? product.price)?.toLocaleString()}</span>
        <Link to={`/product/${product._id}`} className="gp-explore">
          Explore <ArrowRight size={9} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  </div>
);

const SubCategoryRow = ({ subCategory, products }) => {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isNone = subCategory === '__none__';

  const checkScroll = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [products, checkScroll]);

  const scroll = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <div className="gp-sub-block">
      {!isNone && (
        <div className="gp-sub-header">
          <div className="gp-sub-header-inner">
            <Tag size={11} strokeWidth={2} className="gp-sub-icon" />
            <h3 className="gp-sub-title">{subCategory}</h3>
            <span className="gp-sub-pill">{products.length}</span>
          </div>
        </div>
      )}

      <div className="gp-hscroll-wrapper">
        {canScrollLeft && (
          <button className="gp-hscroll-arrow gp-hscroll-arrow--left" onClick={() => scroll(-1)} aria-label="Scroll left">
            <ArrowLeft size={14} strokeWidth={1.8} />
          </button>
        )}

        <div className="gp-hscroll-row" ref={rowRef}>
          {products.map((product, i) => (
            <div className="gp-hscroll-item" key={product._id}>
              <ProductCard product={product} index={i} />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <button className="gp-hscroll-arrow gp-hscroll-arrow--right" onClick={() => scroll(1)} aria-label="Scroll right">
            <ArrowRight size={14} strokeWidth={1.8} />
          </button>
        )}
      </div>

      <div className="gp-hscroll-dots">
        {products.length > 0 && (
          <span className="gp-hscroll-hint">
            {products.length} item{products.length !== 1 ? 's' : ''} — scroll to explore
          </span>
        )}
      </div>
    </div>
  );
};

const CategorySection = ({ category, subCategories, catIndex }) => {
  const totalItems = Object.values(subCategories).reduce((s, arr) => s + arr.length, 0);

  const subEntries = Object.entries(subCategories).sort(([a], [b]) => {
    if (a === '__none__') return 1;
    if (b === '__none__') return -1;
    return a.localeCompare(b);
  });

  const namedSubs = subEntries.filter(([k]) => k !== '__none__');
  const [collapsed, setCollapsed] = useState(false);

  return (
    <section className="gp-cat-section scroll-reveal" style={{ transitionDelay: `${catIndex * 0.08}s` }}>
      <div className="gp-cat-header" onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer' }}>
        <div className="gp-cat-header-left">
          <span className="gp-cat-number">{String(catIndex + 1).padStart(2, '0')}</span>
          <div>
            <h2 className="gp-cat-title">{category}</h2>
            {namedSubs.length > 0 && (
              <p className="gp-cat-meta">
                {namedSubs.map(([k]) => k).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <div className="gp-cat-header-right">
          <span className="gp-cat-count-big">{totalItems}</span>
          <span className="gp-cat-count-label">items</span>
          <span className="gp-cat-collapse-icon">
            {collapsed ? <ChevronDown size={16} strokeWidth={1.5} /> : <ChevronUp size={16} strokeWidth={1.5} />}
          </span>
        </div>
      </div>

      {!collapsed && (
        <div className="gp-sub-list">
          {subEntries.map(([sub, prods]) => (
            <SubCategoryRow key={sub} subCategory={sub} products={prods} />
          ))}
        </div>
      )}
    </section>
  );
};

const GenderPage = () => {
  const { gender } = useParams();
  const user = getStoredUser();
  const isSuperAdmin = user?.role === 'super_admin';

  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);

  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice]       = useState('');
  const [maxPrice, setMaxPrice]       = useState('');
  const [sortBy, setSortBy]           = useState('default');
  const [activeCategory, setActiveCategory] = useState('');

  const meta = GENDER_META[gender] || { label: gender, heading: gender, accent: gender?.[0]?.toUpperCase() };

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setSearch('');
    setSearchInput('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
    setActiveCategory('');
  }, [gender]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products', { params: { gender, page, limit: 100 } });
        const fetched = res.data.products;
        setProducts(prev => (page === 1 ? fetched : [...prev, ...fetched]));
        if (fetched.length < 100) setHasMore(false);
      } catch {
        setProducts([]);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [gender, page]);

  useEffect(() => {
    const reveal = () => {
      document.querySelectorAll('.scroll-reveal').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight - 40)
          el.classList.add('active');
      });
    };
    reveal();
    window.addEventListener('scroll', reveal, { passive: true });
    return () => window.removeEventListener('scroll', reveal);
  }, [products]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearch('');
    setSearchInput('');
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
    setActiveCategory('');
    setSearch('');
    setSearchInput('');
  };

  const allCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    if (search && !p.name?.toLowerCase().includes(q) && !p.category?.toLowerCase().includes(q) && !p.subCategory?.toLowerCase().includes(q)) return false;
    if (minPrice !== '' && p.price < Number(minPrice)) return false;
    if (maxPrice !== '' && p.price > Number(maxPrice)) return false;
    if (activeCategory && p.category !== activeCategory) return false;
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc')  return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'name_asc')   return a.name?.localeCompare(b.name);
    if (sortBy === 'name_desc')  return b.name?.localeCompare(a.name);
    return 0;
  });

  const grouped = sortedProducts.reduce((acc, product) => {
    const cat = product.category || 'Uncategorized';
    const sub = product.subCategory?.trim() || '__none__';
    if (!acc[cat]) acc[cat] = {};
    if (!acc[cat][sub]) acc[cat][sub] = [];
    acc[cat][sub].push(product);
    return acc;
  }, {});

  const categoryEntries = Object.entries(grouped);
  const hasActiveFilters = search || minPrice !== '' || maxPrice !== '' || sortBy !== 'default' || activeCategory;

  const priceRange = products.length
    ? { min: Math.min(...products.map(p => p.price || 0)), max: Math.max(...products.map(p => p.price || 0)) }
    : { min: 0, max: 99999 };

  return (
    <div className="gp-page">
      <div className="gp-hero scroll-reveal">
        <div className="gp-hero-topbar">
          <Link to="/" className="gp-back">
            <ArrowLeft size={11} strokeWidth={1.8} />
            Back
          </Link>
          {isSuperAdmin && (
            <Link to={`/admin/products/add?gender=${gender}`} className="gp-admin-btn">
              <Plus size={11} strokeWidth={2} />
              Add Product
            </Link>
          )}
        </div>

        <div className="gp-hero-main">
          <div className="gp-hero-watermark">{meta.accent}</div>
          <div className="gp-hero-copy">
            <p className="gp-hero-eyebrow">Collection</p>
            <h1 className="gp-hero-heading">{meta.heading}</h1>
            <p className="gp-hero-sub">{meta.label}</p>
          </div>
        </div>

        <div className="gp-hero-bar">
          <div className="gp-hero-bar-rule" />
          <div className="gp-hero-bar-stats">
            <div className="gp-hero-stat">
              <span className="gp-hero-stat-n">{products.length}</span>
              <span className="gp-hero-stat-l">Products</span>
            </div>
            {categoryEntries.length > 0 && (
              <>
                <span className="gp-hero-stat-sep">×</span>
                <div className="gp-hero-stat">
                  <span className="gp-hero-stat-n">{categoryEntries.length}</span>
                  <span className="gp-hero-stat-l">Categories</span>
                </div>
              </>
            )}
            {hasActiveFilters && (
              <>
                <span className="gp-hero-stat-sep">→</span>
                <div className="gp-hero-stat">
                  <span className="gp-hero-stat-n">{sortedProducts.length}</span>
                  <span className="gp-hero-stat-l">Filtered</span>
                </div>
              </>
            )}
          </div>
          <div className="gp-hero-bar-rule" />
        </div>
      </div>

      <div className="gp-toolbar">
        <form className="gp-search-form" onSubmit={handleSearchSubmit}>
          <div className="gp-search-wrap">
            <Search size={13} strokeWidth={1.8} className="gp-search-icon" />
            <input
              className="gp-search-input"
              type="text"
              placeholder="Search products, categories…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" className="gp-search-clear" onClick={clearSearch}>
                <X size={12} strokeWidth={2} />
              </button>
            )}
            <button type="submit" className="gp-search-btn">Search</button>
          </div>
        </form>

        <div className="gp-toolbar-right">
          <button
            className={`gp-filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(f => !f)}
          >
            <SlidersHorizontal size={12} strokeWidth={1.8} />
            Filters
            {hasActiveFilters && <span className="gp-filter-dot" />}
          </button>

          <div className="gp-sort-wrap">
            <select
              className="gp-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="gp-filter-panel">
          <div className="gp-filter-panel-inner">
            <div className="gp-filter-group">
              <p className="gp-filter-label">Price Range</p>
              <div className="gp-price-inputs">
                <div className="gp-price-field">
                  <span className="gp-price-prefix">Rs.</span>
                  <input
                    type="number"
                    placeholder={priceRange.min}
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="gp-price-input"
                    min={0}
                  />
                </div>
                <span className="gp-price-sep">—</span>
                <div className="gp-price-field">
                  <span className="gp-price-prefix">Rs.</span>
                  <input
                    type="number"
                    placeholder={priceRange.max}
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="gp-price-input"
                    min={0}
                  />
                </div>
              </div>
            </div>

            {allCategories.length > 0 && (
              <div className="gp-filter-group">
                <p className="gp-filter-label">Category</p>
                <div className="gp-cat-chips">
                  <button
                    className={`gp-cat-chip ${activeCategory === '' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('')}
                  >
                    All
                  </button>
                  {allCategories.map(cat => (
                    <button
                      key={cat}
                      className={`gp-cat-chip ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat === activeCategory ? '' : cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <button className="gp-clear-filters" onClick={clearFilters}>
                <X size={10} strokeWidth={2} />
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}

      {loading && page === 1 ? (
        <div className="gp-state">
          <span className="gp-spinner" />
          <p className="gp-state-msg">Loading collection…</p>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="gp-state">
          <p className="gp-state-empty">∅</p>
          <p className="gp-state-msg">
            {hasActiveFilters ? 'No products match your filters.' : 'No products in this collection yet.'}
          </p>
          {hasActiveFilters && (
            <button className="gp-see-more-btn" onClick={clearFilters} style={{ marginTop: '12px' }}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="gp-body">
          {categoryEntries.map(([category, subCategories], i) => (
            <CategorySection
              key={category}
              category={category}
              subCategories={subCategories}
              catIndex={i}
            />
          ))}

          {hasMore && (
            <div className="gp-fetch-more">
              <button
                className="gp-fetch-btn"
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
              >
                {loading ? <><span className="gp-spinner-sm" /> Loading…</> : 'Load More Products'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GenderPage;