import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { assetUrl, errorMessage } from '../../api/client';
import {
  FiChevronLeft,
  FiChevronRight,
  FiShoppingBag,
  FiArrowRight,
  FiSliders,
  FiTag,
  FiPackage,
  FiThumbsUp,
  FiTrash2
} from 'react-icons/fi';
import '../../css/ProductDetail.css';

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

const SizeChartDisplay = ({ sizeChart }) => {
  const [expanded, setExpanded] = useState(false);
  if (!sizeChart?.rows?.length) return null;

  const typeLabel = {
    upper: 'Upper Body',
    lower: 'Lower Body',
    custom: 'Size Guide',
  }[sizeChart.type] || 'Size Guide';

  return (
    <div className="size-chart-section">
      <button className="sc-toggle-btn" onClick={() => setExpanded(p => !p)}>
        <FiSliders className="sc-icon" />
        {typeLabel} Size Chart
        <span className="sc-unit">({sizeChart.unit})</span>
        <span className="sc-chevron">{expanded ? '▲' : '▼'}</span>
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
                  {sizeChart.columns.map(col => (
                    <td key={col}>{row.measurements?.[col] || '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ReviewForm = ({ productId, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
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
  const [reviews, setReviews] = useState([]);
  const [breakdown, setBreakdown] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchReviews = async () => {
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
  };

  useEffect(() => { fetchReviews(); }, [productId, page, sort]);

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
      alert(err.response?.data?.message || 'Failed to delete review');
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
                  <FiThumbsUp size={13} /> Helpful ({review.helpful})
                </button>
                <button className="delete-review-btn" onClick={() => deleteReview(review._id)}>
                  <FiTrash2 size={13} /> Delete
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

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [productRes, allRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/products', { params: { limit: 50 } }),
        ]);
        setProduct(productRes.data);
        setAllProducts(allRes.data.products);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedSize('');
    setQuantity(1);
  }, [id]);

  const handleNext = () =>
    setCurrentImageIndex(prev => (prev + 1) % product.images.length);

  const handlePrev = () =>
    setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);

  const getRandomProducts = () => {
    const others = allProducts.filter(p => p._id !== product._id);
    return others.sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  const handleAddToCart = () => {
    const availableSizes =
      product.sizeChart?.rows?.length > 0
        ? product.sizeChart.rows.map(r => r.size)
        : product.sizes || [];

    if (availableSizes.length > 0 && !selectedSize) {
      alert('Please select a size.');
      return;
    }
    if (quantity < 1 || quantity > product.quantity) {
      alert(`Please select a valid quantity (1–${product.quantity})`);
      return;
    }
    const cartItem = {
      productId: product._id,
      name: product.name,
      price: product.effectivePrice ?? product.price,
      image: product.images[0],
      size: selectedSize || undefined,
      quantity,
    };
    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
    localStorage.setItem('cart', JSON.stringify([...existingCart, cartItem]));
    alert('Item added to cart!');
  };

  if (loading) return <div className="pd-loading"><span className="pd-spinner" /></div>;
  if (!product) return <div className="pd-not-found">Product not found.</div>;

  const availableSizes =
    product.sizeChart?.rows?.length > 0
      ? product.sizeChart.rows.map(r => r.size)
      : product.sizes || [];

  const randomProducts = getRandomProducts();

  return (
    <div className="product-detail-wrapper">
      <div className="product-detail-container">

        <div className="slider">
          <button onClick={handlePrev} className="nav-btn" aria-label="Previous image">
            <FiChevronLeft />
          </button>
          <div className="image-frame">
            {product.images?.length > 0 ? (
              <img
                src={assetUrl(product.images[currentImageIndex])}
                alt={`${product.name} ${currentImageIndex + 1}`}
                className="product-image"
              />
            ) : (
              <div className="no-image">No Image</div>
            )}
            {product.images?.length > 1 && (
              <div className="image-dots">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    className={`image-dot ${i === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(i)}
                    aria-label={`Image ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
          <button onClick={handleNext} className="nav-btn" aria-label="Next image">
            <FiChevronRight />
          </button>
        </div>

        <div className="details">
          <div className="details-category">
            <FiTag className="category-icon" />
            {product.category}
            {product.subCategory && <span className="sub-category"> / {product.subCategory}</span>}
          </div>

          <h2 className="title">{product.name}</h2>

          {product.brand && <p className="brand-label">{product.brand}</p>}

          <p className="price">
            Rs. {(product.effectivePrice ?? product.price).toLocaleString()}
            {product.isOnSale && (
              <span className="price-original"> <s>Rs. {product.price.toLocaleString()}</s></span>
            )}
          </p>

          {product.averageRating > 0 && (
            <div className="avg-rating">
              <StarRating rating={Math.round(product.averageRating)} />
              <span className="rating-text">{product.averageRating} ({product.reviewCount} reviews)</span>
            </div>
          )}

          <p className="description">{product.description}</p>

          {product.material && (
            <p className="material-label">Material: <strong>{product.material}</strong></p>
          )}

          {product.colors?.length > 0 && (
            <div className="colors-row">
              <span className="colors-label">Colors:</span>
              {product.colors.map((c, i) => (
                <span key={i} className="color-swatch-wrap">
                  <span
                    className="color-swatch"
                    style={{ background: c.hex || '#ccc' }}
                    title={c.name}
                  />
                  <span className="color-name">{c.name}</span>
                </span>
              ))}
            </div>
          )}

          {product.season && (
            <p className="season-label">Season: <strong>{product.season.replace('_', ' ')}</strong></p>
          )}

          {product.gender && product.gender !== 'unisex' && (
            <p className="gender-label">For: <strong>{product.gender}</strong></p>
          )}

          {availableSizes.length > 0 && (
            <div className="size-select">
              <label className="size-select-label">Select Size</label>
              <div className="size-buttons">
                {availableSizes.map((size, index) => (
                  <button
                    key={index}
                    className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="quantity-select">
            <label className="quantity-label">Quantity</label>
            <div className="quantity-controls">
              <button
                className="qty-btn"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >−</button>
              <span className="qty-value">{quantity}</span>
              <button
                className="qty-btn"
                onClick={() => setQuantity(q => Math.min(product.quantity, q + 1))}
                disabled={quantity >= product.quantity}
              >+</button>
            </div>
          </div>

          <p className="stock-note">
            <FiPackage className="stock-icon" />
            {product.quantity > 0 ? `Only ${product.quantity} left in stock` : 'Out of stock'}
          </p>

          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={product.quantity === 0}
          >
            <FiShoppingBag className="cart-icon" />
            {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {product.tags?.length > 0 && (
            <div className="tags-row">
              {product.tags.map((t, i) => (
                <span key={i} className="tag-chip">#{t}</span>
              ))}
            </div>
          )}

          <SizeChartDisplay sizeChart={product.sizeChart} />
        </div>
      </div>

      <div className="reviews-container">
        <ReviewsSection productId={product._id} />
      </div>

      {randomProducts.length > 0 && (
        <div className="recommendations-section">
          <h3 className="recommendations-title">You May Also Like</h3>
          <div className="suggestions">
            {randomProducts.map(item => (
              <div key={item._id} className="suggestion-card">
                <div className="suggestion-img-wrap">
                  {item.images?.[0] && (
                    <img
                      src={assetUrl(item.images[0])}
                      alt={item.name}
                    />
                  )}
                </div>
                <div className="suggestion-info">
                  <h4>{item.name}</h4>
                  <p>Rs. {(item.effectivePrice ?? item.price).toLocaleString()}</p>
                  <Link to={`/product/${item._id}`} className="suggestion-link">
                    View Product <FiArrowRight className="link-arrow" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;