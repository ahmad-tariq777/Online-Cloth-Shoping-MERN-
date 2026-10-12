import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { assetUrl } from '../../api/client';
import '../../css/SaleBadge.css';

const formatPrice = (price) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(price);

export const isSaleValid = (product) => {
  if (!product) return false;
  if (!product.saleActive) return false;
  if (!product.salePrice || product.salePrice <= 0) return false;
  if (product.saleEndDate && new Date(product.saleEndDate) < new Date()) return false;
  return true;
};

export const SaleBadge = ({ product, size = 'md' }) => {
  if (!isSaleValid(product)) return null;
  return <span className={`sb-badge sb-badge--${size}`}>−{product.salePercent}%</span>;
};

export const SalePrice = ({ product, className = '' }) => {
  const onSale = isSaleValid(product);
  return (
    <div className={`sp-wrap ${className}`}>
      {onSale ? (
        <>
          <span className="sp-original">{formatPrice(product.price)}</span>
          <span className="sp-sale">{formatPrice(product.salePrice)}</span>
          <span className="sp-saving">Save {formatPrice(product.price - product.salePrice)}</span>
        </>
      ) : (
        <span className="sp-regular">{formatPrice(product.price)}</span>
      )}
    </div>
  );
};

export const SaleCountdown = ({ product }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!isSaleValid(product) || !product.saleEndDate) return;
    const calc = () => {
      const diff = new Date(product.saleEndDate) - new Date();
      if (diff <= 0) { setTimeLeft(''); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h left`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m left`);
      else setTimeLeft(`${m}m ${s}s left`);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [product]);

  if (!isSaleValid(product) || !product.saleEndDate || !timeLeft) return null;
  return (
    <div className="sc-wrap">
      <span className="sc-icon">◷</span>
      <span className="sc-text">Sale ends in {timeLeft}</span>
    </div>
  );
};

export const SaleProductCard = ({ product, onClick }) => {
  const onSale = isSaleValid(product);
  return (
    <div className={`spc-card${onSale ? ' spc-card--sale' : ''}`} onClick={onClick}>
      <div className="spc-image-wrap">
        {product.images?.[0] ? (
          <img src={assetUrl(product.images[0])} alt={product.name} className="spc-image" />
        ) : (
          <div className="spc-image-empty" />
        )}
        {onSale && <SaleBadge product={product} size="lg" />}
      </div>
      <div className="spc-info">
        <p className="spc-name">{product.name}</p>
        <p className="spc-category">{product.subCategory || product.category}</p>
        <SalePrice product={product} />
        <SaleCountdown product={product} />
      </div>
    </div>
  );
};

const SwipeRow = ({ products, onProductClick }) => {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const scroll = (dir) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * 500, behavior: 'smooth' });
  };

  const onMouseDown = (e) => {
    dragging.current = true;
    startX.current = e.pageX - trackRef.current.offsetLeft;
    scrollStart.current = trackRef.current.scrollLeft;
    trackRef.current.classList.add('is-dragging');
  };

  const onMouseMove = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = scrollStart.current - (x - startX.current);
  };

  const stopDrag = () => {
    dragging.current = false;
    trackRef.current?.classList.remove('is-dragging');
  };

  if (!products || products.length === 0) {
    return <p className="sale-row__empty">No products available</p>;
  }

  return (
    <div className="sale-row">
      <button className="sale-row__arrow sale-row__arrow--left" onClick={() => scroll(-1)} aria-label="Scroll left">
        <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <div
        className="sale-row__track"
        ref={trackRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {products.map((product) => (
          <SaleProductCard
            key={product._id}
            product={product}
            onClick={() => onProductClick(product._id)}
          />
        ))}
      </div>
      <button className="sale-row__arrow sale-row__arrow--right" onClick={() => scroll(1)} aria-label="Scroll right">
        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </div>
  );
};

const buildHierarchy = (products) => {
  const map = {};
  products.forEach((p) => {
    const gender = p.gender || 'Unisex';
    const category = p.category || 'Other';
    const sub = p.subCategory || 'General';
    if (!map[gender]) map[gender] = {};
    if (!map[gender][category]) map[gender][category] = {};
    if (!map[gender][category][sub]) map[gender][category][sub] = [];
    map[gender][category][sub].push(p);
  });
  return map;
};

const SaleSection = () => {
  const [loading, setLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState({});
  const [activeGender, setActiveGender] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSub, setActiveSub] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/sales/active`, {
          params: { limit: 100 },
        });
        const valid = (data.products || []).filter(isSaleValid);
        const h = buildHierarchy(valid);
        setHierarchy(h);
        const g = Object.keys(h)[0] || '';
        const c = g ? Object.keys(h[g])[0] || '' : '';
        const s = g && c ? Object.keys(h[g][c])[0] || '' : '';
        setActiveGender(g);
        setActiveCategory(c);
        setActiveSub(s);
      } catch (err) {
        console.error('SaleSection fetch error:', err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const selectGender = useCallback((g) => {
    setActiveGender(g);
    const c = Object.keys(hierarchy[g] || {})[0] || '';
    setActiveCategory(c);
    setActiveSub(c ? Object.keys(hierarchy[g][c] || {})[0] || '' : '');
  }, [hierarchy]);

  const selectCategory = useCallback((c) => {
    setActiveCategory(c);
    setActiveSub(Object.keys((hierarchy[activeGender] || {})[c] || {})[0] || '');
  }, [hierarchy, activeGender]);

  const selectSub = useCallback((s) => setActiveSub(s), []);

  if (loading) {
    return (
      <section className="sale-section">
        <div className="sale-section__loading">
          <div className="sale-section__spinner" />
        </div>
      </section>
    );
  }

  const genders = Object.keys(hierarchy);
  if (genders.length === 0) return null;

  const categories = Object.keys(hierarchy[activeGender] || {});
  const subs = Object.keys((hierarchy[activeGender] || {})[activeCategory] || {});
  const visibleProducts = ((hierarchy[activeGender] || {})[activeCategory] || {})[activeSub] || [];

  return (
    <section className="sale-section">
      <div className="sale-section__top">
        <div className="sale-section__header-left">
          <p className="sale-section__eyebrow">Limited Time</p>
          <h2 className="sale-section__title">On Sale</h2>
        </div>
        <button className="sale-section__view-all" onClick={() => navigate('/wardrobe?sale=true')}>
          View All
        </button>
      </div>

      <div className="sale-nav">
        <div className="sale-nav__gender">
          {genders.map((g) => (
            <button
              key={g}
              className={`sale-nav__gender-btn${activeGender === g ? ' active' : ''}`}
              onClick={() => selectGender(g)}
            >
              {g}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <div className="sale-nav__categories">
            {categories.map((c) => (
              <button
                key={c}
                className={`sale-nav__cat-btn${activeCategory === c ? ' active' : ''}`}
                onClick={() => selectCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {subs.length > 1 && (
          <div className="sale-nav__subcategories">
            {subs.map((s) => (
              <button
                key={s}
                className={`sale-nav__sub-btn${activeSub === s ? ' active' : ''}`}
                onClick={() => selectSub(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <SwipeRow products={visibleProducts} onProductClick={(id) => navigate(`/product/${id}`)} />
    </section>
  );
};

export default SaleSection;