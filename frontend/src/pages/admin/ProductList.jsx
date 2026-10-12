import React, { useEffect, useState, useCallback } from 'react';
import api, { assetUrl, errorMessage } from '../../api/client';
import { useCategories } from '../../hooks/Usecategories';
import "../../css/ProductList.css"
import {
  FiGrid,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiTrash2,
  FiTag,
  FiPackage,
  FiSliders,
  FiThumbsUp,
} from 'react-icons/fi';

const GENDER_OPTIONS = [
  { value: '', label: 'All Genders' },
  { value: 'men', label: "Men's" },
  { value: 'women', label: "Women's" },
  { value: 'kids_male', label: 'Kids — Boy' },
  { value: 'kids_female', label: 'Kids — Girl' },
  { value: 'unisex', label: 'Unisex' },
];

const SEASON_OPTIONS = [
  { value: '', label: 'All Seasons' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
  { value: 'autumn', label: 'Autumn / Fall' },
  { value: 'winter', label: 'Winter' },
  { value: 'all_season', label: 'All Season' },
];

const StarRating = ({ rating, max = 5, onChange }) => (
  <span className="star-rating">
    {Array.from({ length: max }, (_, i) => i + 1).map(star => (
      <span
        key={star}
        onClick={() => onChange && onChange(star)}
        className={`star ${star <= rating ? 'filled' : ''} ${onChange ? 'interactive' : ''}`}
      >★</span>
    ))}
  </span>
);

const ReviewForm = ({ productId, onSubmitted }) => {
  const [rating, setRating]   = useState(0);
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (rating === 0) { alert('Please select a rating'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('rating', rating);
      formData.append('title', title);
      formData.append('body', body);
      await api.post(`/reviews/${productId}`, formData);
      alert('Review submitted!');
      setRating(0);
      setTitle('');
      setBody('');
      onSubmitted();
    } catch (error) {
      alert(errorMessage(error, 'Failed to submit review'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <h5 className="review-form-title">Write a Review</h5>
      <StarRating rating={rating} onChange={setRating} />
      <input
        type="text"
        placeholder="Review title (optional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="review-input"
        maxLength={120}
      />
      <textarea
        placeholder="Share your experience..."
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={3}
        className="review-textarea"
      />
      <button type="submit" disabled={loading} className="review-submit-btn">
        {loading ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
};

const ReviewsSection = ({ productId }) => {
  const [reviews, setReviews]       = useState([]);
  const [breakdown, setBreakdown]   = useState({});
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort]             = useState('newest');
  const [loading, setLoading]       = useState(false);
  const [showForm, setShowForm]     = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reviews/${productId}`, { params: { page, limit: 5, sort } });
      setReviews(res.data.reviews);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
      setBreakdown(res.data.breakdown || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId, page, sort]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const markHelpful = async reviewId => {
    try {
      await api.post(`/reviews/${reviewId}/helpful`);
      fetchReviews();
    } catch {}
  };

  const deleteReview = async reviewId => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      fetchReviews();
    } catch (err) {
      alert(errorMessage(err, 'Failed to delete review'));
    }
  };

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h4 className="reviews-title">Reviews ({total})</h4>
        <button className="write-review-btn" onClick={() => setShowForm(p => !p)}>
          {showForm ? 'Cancel' : '+ Write Review'}
        </button>
      </div>

      {Object.keys(breakdown).length > 0 && (
        <div className="rating-breakdown">
          {[5, 4, 3, 2, 1].map(star => (
            <div key={star} className="breakdown-row">
              <span className="breakdown-star">{star}★</span>
              <div className="breakdown-bar-track">
                <div
                  className="breakdown-bar-fill"
                  style={{ width: `${total ? ((breakdown[star] || 0) / total) * 100 : 0}%` }}
                />
              </div>
              <span className="breakdown-count">{breakdown[star] || 0}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ReviewForm productId={productId} onSubmitted={() => { setShowForm(false); fetchReviews(); }} />
      )}

      <div className="reviews-sort">
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }} className="sort-select">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {loading ? (
        <p className="reviews-loading">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="reviews-empty">No reviews yet. Be the first!</p>
      ) : (
        <div className="reviews-list">
          {reviews.map(review => (
            <div key={review._id} className="review-item">
              <div className="review-top">
                <div className="review-rating-title">
                  <StarRating rating={review.rating} />
                  {review.title && <strong className="review-title-text">{review.title}</strong>}
                </div>
                <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="review-author">— {review.userName}</p>
              {review.body && <p className="review-body">{review.body}</p>}
              {review.images?.length > 0 && (
                <div className="review-images">
                  {review.images.map((src, i) => (
                    <img key={i} src={assetUrl(src)} alt="" className="review-img" />
                  ))}
                </div>
              )}
              <div className="review-actions">
                <button className="helpful-btn" onClick={() => markHelpful(review._id)}>
                  <FiThumbsUp size={12} /> Helpful ({review.helpful})
                </button>
                <button className="delete-review-btn" onClick={() => deleteReview(review._id)}>
                  <FiTrash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="reviews-pagination">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">Prev</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn">Next</button>
        </div>
      )}
    </div>
  );
};

const SizeChartPreview = ({ sizeChart }) => {
  const [expanded, setExpanded] = useState(false);
  if (!sizeChart?.rows?.length) return null;
  const typeLabel = { upper: 'Upper Body', lower: 'Lower Body', custom: 'Custom' }[sizeChart.type] || 'Size Guide';
  return (
    <div className="sc-preview">
      <button type="button" className="sc-toggle-btn" onClick={() => setExpanded(p => !p)}>
        <FiSliders className="sc-icon" />
        {typeLabel} Size Chart
        <span className="sc-unit">({sizeChart.unit})</span>
        <span className="sc-chevron">{expanded ? <FiChevronUp /> : <FiChevronDown />}</span>
      </button>
      {expanded && (
        <div className="sc-table-wrap">
          <table className="sc-preview-table">
            <thead>
              <tr>
                <th>Size</th>
                {sizeChart.columns.map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {sizeChart.rows.map((row, i) => (
                <tr key={i}>
                  <td className="size-cell">{row.size}</td>
                  {sizeChart.columns.map(col => <td key={col}>{row.measurements?.[col] || '—'}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ProductList = () => {
  const [products, setProducts]                 = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCat, setSelectedSubCat]     = useState('');
  const [selectedGender, setSelectedGender]     = useState('');
  const [selectedSeason, setSelectedSeason]     = useState('');
  const [subCategories, setSubCategories]       = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [expandedProduct, setExpandedProduct]   = useState(null);
  const { categories, loading: catLoading }     = useCategories();

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedSubCat, selectedGender, selectedSeason]);

  useEffect(() => {
    if (!selectedCategory) { setSubCategories([]); setSelectedSubCat(''); return; }
    api.get('/products/subcategories', { params: { category: selectedCategory } })
      .then(res => {
        setSubCategories(res.data.subCategories);
        setSelectedSubCat('');
      })
      .catch(() => setSubCategories([]));
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (selectedCategory) params.category = selectedCategory;
      if (selectedSubCat)   params.subCategory = selectedSubCat;
      if (selectedGender)   params.gender = selectedGender;
      if (selectedSeason)   params.season = selectedSeason;
      const res = await api.get('/products', { params });
      setProducts(res.data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async id => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      alert('Product deleted!');
      fetchProducts();
    } catch (error) {
      alert(errorMessage(error, 'Failed to delete product'));
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubCat('');
    setSelectedGender('');
    setSelectedSeason('');
  };

  const hasFilters = selectedCategory || selectedSubCat || selectedGender || selectedSeason;

  return (
    <div className="product-list-container">
      <div className="pl-header">
        <div className="pl-title-group">
          <FiGrid className="pl-title-icon" />
          <h2 className="product-list-title">Products</h2>
        </div>
        <span className="pl-count">{products.length} items</span>
      </div>

      <div className="filter-row">
        <div className="filter-select-wrap">
          <FiFilter className="filter-icon" />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            disabled={catLoading}
            className="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
          </select>
        </div>

        {subCategories.length > 0 && (
          <div className="filter-select-wrap">
            <select
              value={selectedSubCat}
              onChange={e => setSelectedSubCat(e.target.value)}
              className="category-filter"
            >
              <option value="">All Sub-Categories</option>
              {subCategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
            </select>
          </div>
        )}

        <div className="filter-select-wrap">
          <select
            value={selectedGender}
            onChange={e => setSelectedGender(e.target.value)}
            className="category-filter"
          >
            {GENDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <div className="filter-select-wrap">
          <select
            value={selectedSeason}
            onChange={e => setSelectedSeason(e.target.value)}
            className="category-filter"
          >
            {SEASON_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        {hasFilters && (
          <button className="clear-filter" onClick={clearFilters}>
            <FiX className="clear-icon" /> Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-grid">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton-card" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <FiPackage className="empty-icon" />
          <p>No products found.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <div key={product._id} className="product-card">
              {product.images?.length > 0 && (
                <div className="product-img-wrap">
                  <img
                    src={assetUrl(product.images[0])}
                    alt={product.name}
                    className="product-image"
                  />
                </div>
              )}
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-desc">{product.description}</p>

                <div className="product-meta">
                  <span className="meta-chip price-chip">Rs. {(product.effectivePrice ?? product.price).toLocaleString()}</span>
                  <span className="meta-chip cat-chip">
                    <FiTag className="chip-icon" /> {product.category}
                  </span>
                  {product.subCategory && (
                    <span className="meta-chip cat-chip">{product.subCategory}</span>
                  )}
                  <span className="meta-chip qty-chip">
                    <FiPackage className="chip-icon" /> Qty: {product.quantity}
                  </span>
                  {product.gender && product.gender !== 'unisex' && (
                    <span className="meta-chip cat-chip">{product.gender}</span>
                  )}
                  {product.season && (
                    <span className="meta-chip cat-chip">🌤 {product.season.replace('_', ' ')}</span>
                  )}
                </div>

                {product.brand && (
                  <p className="product-desc" style={{ marginBottom: 4 }}>Brand: <strong>{product.brand}</strong></p>
                )}
                {product.material && (
                  <p className="product-desc" style={{ marginBottom: 4 }}>Material: {product.material}</p>
                )}

                {product.colors?.length > 0 && (
                  <div className="product-meta" style={{ marginBottom: 10 }}>
                    {product.colors.map((c, i) => (
                      <span key={i} className="meta-chip cat-chip" style={{ gap: 5 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.hex || '#ccc', border: '1px solid #999', display: 'inline-block', flexShrink: 0 }} />
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}

                {product.sizes?.length > 0 && (
                  <div className="sizes-row">
                    {product.sizes.map((s, i) => <span key={i} className="size-tag">{s}</span>)}
                  </div>
                )}

                {product.tags?.length > 0 && (
                  <div className="product-meta">
                    {product.tags.map((t, i) => (
                      <span key={i} style={{ fontSize: 11, color: '#6b7280' }}>#{t}</span>
                    ))}
                  </div>
                )}

                {product.averageRating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 13 }}>
                    <StarRating rating={Math.round(product.averageRating)} />
                    <span>{product.averageRating} ({product.reviewCount})</span>
                  </div>
                )}

                <SizeChartPreview sizeChart={product.sizeChart} />

                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="sc-toggle-btn"
                    style={{ flex: 1 }}
                    onClick={() => setExpandedProduct(expandedProduct === product._id ? null : product._id)}
                  >
                    {expandedProduct === product._id ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                    {expandedProduct === product._id ? 'Hide Reviews' : 'Reviews'}
                  </button>
                  <button
                    type="button"
                    className="delete-btn"
                    style={{ flex: 'none', width: 'auto', padding: '10px 14px' }}
                    onClick={() => deleteProduct(product._id)}
                  >
                    <FiTrash2 className="delete-icon" />
                  </button>
                </div>

                {expandedProduct === product._id && (
                  <ReviewsSection productId={product._id} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;