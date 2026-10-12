import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api, { assetUrl } from '../../../api/client';
import { Snowflake, Sun, Flower2, Leaf, ArrowRight, Gem, ChevronRight, ChevronLeft } from 'lucide-react';
import '../../../css/Dropcollections.css';

const buildImgSrc = (img) => (img ? assetUrl(img) : null);

const SEASON_META = {
  winter: { icon: Snowflake, label: 'Winter', color: '#8fb8d4', symbol: '❄' },
  summer: { icon: Sun,       label: 'Summer', color: '#d4a84b', symbol: '☀' },
  spring: { icon: Flower2,   label: 'Spring', color: '#a8c48a', symbol: '❀' },
  autumn: { icon: Leaf,      label: 'Autumn', color: '#c4834a', symbol: '◈' },
  none:   { icon: null,      label: '',       color: '#999',    symbol: '◇' },
};

const GENDER_LABELS = {
  men:         "Men's Wear",
  women:       "Women's Wear",
  unisex:      'Unisex',
  kids_male:   'Boys',
  kids_female: 'Girls',
};

const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
};

const ProductCard = ({ product }) => {
  const [ref, inView] = useInView(0.1);
  const [imgError, setImgError] = useState(false);

  const imgSrc = buildImgSrc(product.images?.[0]);

  return (
    <div ref={ref} className={`dc-product-card ${inView ? 'dc-product-card--visible' : ''}`}>
      <div className="dc-product-img-wrap">
        {imgSrc && !imgError
          ? (
            <img
              src={imgSrc}
              alt={product.name}
              className="dc-product-img"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )
          : <div className="dc-product-no-img">—</div>
        }
        <div className="dc-product-overlay">
          <Link to={`/product/${product._id}`} className="dc-quick-view">
            <Gem size={12} strokeWidth={1.5} />
            <span>Quick View</span>
          </Link>
        </div>
        <span className="dc-new-badge">New</span>
      </div>
      <div className="dc-product-info">
        {product.brand && <p className="dc-product-brand">{product.brand}</p>}
        <p className="dc-product-name">{product.name}</p>
        <div className="dc-product-footer">
          <span className="dc-price">Rs. {product.price?.toLocaleString()}</span>
          <Link to={`/product/${product._id}`} className="dc-shop-btn">
            Shop <ArrowRight size={10} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  );
};

const HorizontalSlider = ({ products }) => {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const check = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', check, { passive: true });
    check();
    return () => el.removeEventListener('scroll', check);
  }, [products]);

  const scroll = (dir) => trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });

  return (
    <div className="dc-slider-root">
      <button className={`dc-nav-btn dc-nav-btn--left ${!canLeft ? 'dc-nav-btn--hidden' : ''}`} onClick={() => scroll(-1)} aria-label="Scroll left">
        <ChevronLeft size={16} />
      </button>
      <div className="dc-slider-track" ref={trackRef}>
        {products.map((product, i) => (
          <div key={product._id} className="dc-slider-item" style={{ animationDelay: `${i * 0.04}s` }}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      <button className={`dc-nav-btn dc-nav-btn--right ${!canRight ? 'dc-nav-btn--hidden' : ''}`} onClick={() => scroll(1)} aria-label="Scroll right">
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

const groupProducts = (linkedProducts) => {
  const hierarchy = {};
  linkedProducts.forEach(({ product, gender }) => {
    if (!product) return;
    const g = gender || 'unisex';
    const cat = product.category || 'Collection';
    const sub = product.subCategory || 'Items';
    if (!hierarchy[g]) hierarchy[g] = {};
    if (!hierarchy[g][cat]) hierarchy[g][cat] = {};
    if (!hierarchy[g][cat][sub]) hierarchy[g][cat][sub] = [];
    hierarchy[g][cat][sub].push(product);
  });
  return hierarchy;
};

const CollectionBlock = ({ slide, index }) => {
  const [headerRef, headerInView] = useInView(0.12);
  const meta = SEASON_META[slide.season] || SEASON_META.none;
  const grouped = groupProducts(slide.linkedProducts || []);
  const totalProducts = slide.linkedProducts?.length || 0;
  const SeasonIcon = meta.icon;

  const editorialImgSrc = buildImgSrc(slide.image);

  return (
    <article className="dc-collection" style={{ '--season-color': meta.color }}>
      <div ref={headerRef} className={`dc-collection-editorial ${headerInView ? 'dc-collection-editorial--visible' : ''}`}>
        <div className="dc-editorial-image-col">
          {editorialImgSrc
            ? <img src={editorialImgSrc} alt="" className="dc-editorial-img" />
            : <div className="dc-editorial-placeholder"><span>◇</span></div>
          }
          <div className="dc-editorial-img-overlay" />
        </div>

        <div className="dc-editorial-text-col">
          <span className="dc-collection-index">0{index + 1}</span>
          {slide.season !== 'none' && (
            <div className="dc-season-tag">
              {SeasonIcon && <SeasonIcon size={12} strokeWidth={1.5} />}
              <span>{meta.label}</span>
            </div>
          )}
          <h3 className="dc-collection-name">{slide.collectionName.toUpperCase()}</h3>
          {slide.subheading && <p className="dc-collection-sub">{slide.subheading}</p>}
          {slide.body && <p className="dc-collection-body">{slide.body}</p>}
          <div className="dc-collection-stats">
            <div className="dc-stat">
              <span className="dc-stat-num">{totalProducts}</span>
              <span className="dc-stat-label">Pieces</span>
            </div>
            <div className="dc-stat-divider" />
            <div className="dc-stat">
              <span className="dc-stat-num">{Object.keys(grouped).length}</span>
              <span className="dc-stat-label">Categories</span>
            </div>
            {slide.season !== 'none' && (
              <>
                <div className="dc-stat-divider" />
                <div className="dc-stat">
                  <span className="dc-stat-num" style={{ color: meta.color }}>{meta.symbol}</span>
                  <span className="dc-stat-label">{meta.label}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {totalProducts > 0 && (
        <div className="dc-products-section">
          {Object.entries(grouped).map(([gender, categories]) => (
            <div key={gender} className="dc-gender-group">
              <div className="dc-gender-header">
                <span className="dc-gender-label">{GENDER_LABELS[gender] || gender}</span>
                <div className="dc-gender-line" />
              </div>
              {Object.entries(categories).map(([catName, subcategories]) => (
                <div key={catName} className="dc-category-group">
                  <h5 className="dc-category-title">{catName}</h5>
                  {Object.entries(subcategories).map(([subName, products]) => (
                    <div key={subName} className="dc-subcategory-group">
                      <h6 className="dc-subcategory-title">{subName}</h6>
                      <HorizontalSlider products={products} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

const DropCollections = () => {
  const [dropCollections, setDropCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/drop-collections')
      .then(res => setDropCollections(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <section className="dc-section dc-section--loading">
      <div className="dc-loader">
        <div className="dc-loader-bar" />
      </div>
    </section>
  );

  if (dropCollections.length === 0) return null;

  return (
    <section className="dc-section">
      <div className="dc-section-header">
        <div className="dc-eyebrow">
          <span className="dc-eyebrow-line" />
          <span className="dc-eyebrow-text">Curated Drops</span>
          <span className="dc-eyebrow-line" />
        </div>
        <h2 className="dc-section-title">Drop Collections</h2>
        <p className="dc-section-sub">Seasonally curated edits — crafted with intention</p>
      </div>

      <div className="dc-collections-wrap">
        {dropCollections
          .sort((a, b) => a.order - b.order)
          .map((slide, index) => (
            <CollectionBlock key={slide._id} slide={slide} index={index} />
          ))}
      </div>
    </section>
  );
};

export default DropCollections;