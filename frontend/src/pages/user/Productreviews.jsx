import React, { useEffect, useState, useCallback } from 'react';
import api, { assetUrl, errorMessage, getStoredUser } from '../../api/client';
import { Star, ThumbsUp, Trash2, Pencil, X, Check } from 'lucide-react';
import "../../css/Productreviews.css"

const StarRating = ({ value, onChange, readOnly = false, size = 18 }) => (
  <div className="rv-stars">
    {[1, 2, 3, 4, 5].map(n => (
      <Star
        key={n}
        size={size}
        strokeWidth={1.4}
        fill={n <= value ? 'currentColor' : 'none'}
        className={`rv-star ${n <= value ? 'filled' : ''} ${!readOnly ? 'interactive' : ''}`}
        onClick={() => !readOnly && onChange && onChange(n)}
      />
    ))}
  </div>
);

const RatingBar = ({ label, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="rv-bar-row">
      <span className="rv-bar-label">{label}</span>
      <div className="rv-bar-track">
        <div className="rv-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rv-bar-count">{count}</span>
    </div>
  );
};

const ReviewCard = ({ review, currentUserId, currentUserRole, onDelete, onUpdate, onHelpful }) => {
  const [editing, setEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editTitle, setEditTitle]   = useState(review.title || '');
  const [editBody, setEditBody]     = useState(review.body || '');
  const [saving, setSaving]         = useState(false);

  const isOwner = currentUserId && String(review.user) === String(currentUserId);
  const isMod   = currentUserRole === 'admin' || currentUserRole === 'moderator';

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(review._id, { rating: editRating, title: editTitle, body: editBody });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="rv-card">
      <div className="rv-card-header">
        <div className="rv-card-left">
          <div className="rv-avatar">
            {(review.userName || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="rv-user-name">{review.userName || 'Anonymous'}</p>
            <p className="rv-date">
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className="rv-card-right">
          {editing ? (
            <StarRating value={editRating} onChange={setEditRating} size={16} />
          ) : (
            <StarRating value={review.rating} readOnly size={16} />
          )}
          <div className="rv-card-actions">
            {isOwner && !editing && (
              <button className="rv-icon-btn" onClick={() => setEditing(true)} title="Edit">
                <Pencil size={13} strokeWidth={1.5} />
              </button>
            )}
            {editing && (
              <>
                <button className="rv-icon-btn confirm" onClick={handleSave} disabled={saving}>
                  <Check size={13} strokeWidth={2} />
                </button>
                <button className="rv-icon-btn" onClick={() => setEditing(false)}>
                  <X size={13} strokeWidth={2} />
                </button>
              </>
            )}
            {(isOwner || isMod) && !editing && (
              <button className="rv-icon-btn danger" onClick={() => onDelete(review._id)} title="Delete">
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="rv-edit-body">
          <input
            className="rv-input"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            placeholder="Review title"
          />
          <textarea
            className="rv-textarea"
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            placeholder="Your review"
            rows={3}
          />
        </div>
      ) : (
        <div className="rv-review-body">
          {review.title && <p className="rv-review-title">{review.title}</p>}
          {review.body  && <p className="rv-review-text">{review.body}</p>}
        </div>
      )}

      {review.images?.length > 0 && (
        <div className="rv-images">
          {review.images.map((img, i) => (
            <img
              key={i}
              src={assetUrl(img)}
              alt={`review-img-${i}`}
              className="rv-image"
            />
          ))}
        </div>
      )}

      {!editing && (
        <div className="rv-card-footer">
          <button className="rv-helpful-btn" onClick={() => onHelpful(review._id)}>
            <ThumbsUp size={12} strokeWidth={1.5} />
            Helpful {review.helpful > 0 && `(${review.helpful})`}
          </button>
        </div>
      )}
    </div>
  );
};

const ProductReviews = ({ productId }) => {
  const user          = getStoredUser();
  const currentUserId = user?.userId;
  const currentRole   = user?.role;
  const isLoggedIn    = !!user;

  const [reviews, setReviews]         = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [breakdown, setBreakdown]     = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [sort, setSort]               = useState('newest');
  const [loading, setLoading]         = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  const [newRating, setNewRating]   = useState(0);
  const [newTitle, setNewTitle]     = useState('');
  const [newBody, setNewBody]       = useState('');
  const [newImages, setNewImages]   = useState([]);

  const fetchReviews = useCallback(async (pg = 1, sortVal = sort) => {
    setLoading(true);
    try {
      const res = await api.get(`/reviews/${productId}`, { params: { page: pg, limit: 10, sort: sortVal } });
      if (pg === 1) {
        setReviews(res.data.reviews || []);
      } else {
        setReviews(prev => [...prev, ...(res.data.reviews || [])]);
      }
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setBreakdown(res.data.breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    } catch {
      setError('Failed to load reviews.');
    }
    setLoading(false);
  }, [productId, sort]);

  useEffect(() => {
    setPage(1);
    fetchReviews(1, sort);
  }, [productId, sort]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newRating) return setError('Please select a rating.');
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append('rating', newRating);
      formData.append('title', newTitle);
      formData.append('body', newBody);
      newImages.forEach(img => formData.append('images', img));

      await api.post(`/reviews/${productId}`, formData);
      setSuccess('Review submitted successfully!');
      setNewRating(0);
      setNewTitle('');
      setNewBody('');
      setNewImages([]);
      setPage(1);
      fetchReviews(1, sort);
    } catch (err) {
      setError(errorMessage(err, 'Failed to submit review.'));
    }
    setSubmitLoading(false);
  };

  const handleDelete = async (reviewId) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      setReviews(prev => prev.filter(r => r._id !== reviewId));
      setTotal(prev => prev - 1);
    } catch {
      setError('Failed to delete review.');
    }
  };

  const handleUpdate = async (reviewId, data) => {
    try {
      const res = await api.put(`/reviews/${reviewId}`, data);
      setReviews(prev =>
        prev.map(r => r._id === reviewId ? res.data.review : r)
      );
    } catch {
      setError('Failed to update review.');
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      const res = await api.post(`/reviews/${reviewId}/helpful`);
      setReviews(prev =>
        prev.map(r => r._id === reviewId ? { ...r, helpful: res.data.helpful } : r)
      );
    } catch {}
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchReviews(next, sort);
  };

  const avgRating = total > 0
    ? (Object.entries(breakdown).reduce((sum, [k, v]) => sum + Number(k) * v, 0) / total).toFixed(1)
    : '0.0';

  return (
    <div className="rv-root">

      <div className="rv-summary">
        <div className="rv-avg-block">
          <span className="rv-avg-num">{avgRating}</span>
          <StarRating value={Math.round(Number(avgRating))} readOnly size={20} />
          <span className="rv-total-label">{total} {total === 1 ? 'review' : 'reviews'}</span>
        </div>
        <div className="rv-breakdown">
          {[5, 4, 3, 2, 1].map(n => (
            <RatingBar key={n} label={`${n} ★`} count={breakdown[n] || 0} total={total} />
          ))}
        </div>
      </div>

      {isLoggedIn && (
        <form className="rv-form" onSubmit={handleSubmit}>
          <h3 className="rv-form-title">Write a Review</h3>
          <StarRating value={newRating} onChange={setNewRating} size={22} />
          <input
            className="rv-input"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Title (optional)"
          />
          <textarea
            className="rv-textarea"
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            placeholder="Share your experience…"
            rows={4}
          />
          <input
            type="file"
            accept="image/*"
            multiple
            className="rv-file-input"
            onChange={e => setNewImages(Array.from(e.target.files).slice(0, 3))}
          />
          {newImages.length > 0 && (
            <p className="rv-file-hint">{newImages.length} image(s) selected</p>
          )}
          {error   && <p className="rv-error">{error}</p>}
          {success && <p className="rv-success">{success}</p>}
          <button className="rv-submit-btn" type="submit" disabled={submitLoading}>
            {submitLoading ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      )}

      <div className="rv-list-header">
        <h3 className="rv-list-title">Customer Reviews</h3>
        <select
          className="rv-sort-select"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
          <option value="helpful">Most Helpful</option>
        </select>
      </div>

      {loading && page === 1 ? (
        <p className="rv-loading">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="rv-empty">No reviews yet. Be the first!</p>
      ) : (
        <div className="rv-list">
          {reviews.map(review => (
            <ReviewCard
              key={review._id}
              review={review}
              currentUserId={currentUserId}
              currentUserRole={currentRole}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
              onHelpful={handleHelpful}
            />
          ))}
        </div>
      )}

      {page < totalPages && (
        <div className="rv-load-more-wrap">
          <button
            className="rv-load-more-btn"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading…' : 'Load More Reviews'}
          </button>
        </div>
      )}

    </div>
  );
};

export default ProductReviews;