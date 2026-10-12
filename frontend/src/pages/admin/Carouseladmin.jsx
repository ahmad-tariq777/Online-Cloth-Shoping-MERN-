import React, { useState, useEffect } from 'react';
import api, { assetUrl, errorMessage } from '../../api/client';
import '../../css/Carouseladmin.css';

const EMPTY_FORM = {
  label: '',
  heading: '',
  subheading: '',
  body: '',
  scrollLabel: 'SCROLL TO SEE ↓',
  issue: '',
  index: '',
  order: 0,
  active: true,
};

const CarouselAdmin = () => {
  const [slides, setSlides]             = useState([]);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId]       = useState(null);
  const [loading, setLoading]           = useState(false);
  const [message, setMessage]           = useState({ text: '', type: '' });

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const fetchSlides = async () => {
    try {
      const { data } = await api.get('/carousel/all');
      setSlides(data);
    } catch {
      showMsg('Failed to load slides', 'error');
    }
  };

  useEffect(() => { fetchSlides(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.heading || !form.subheading) {
      showMsg('Heading and Subheading are required', 'error');
      return;
    }
    setLoading(true);

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (imageFile) formData.append('image', imageFile);

    try {
      if (editingId) await api.put(`/carousel/${editingId}`, formData);
      else await api.post('/carousel', formData);
      showMsg(editingId ? 'Slide updated!' : 'Slide created!');
      resetForm();
      fetchSlides();
    } catch (error) {
      showMsg(errorMessage(error, 'Failed to save slide'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slide) => {
    setEditingId(slide._id);
    setForm({
      label:       slide.label || '',
      heading:     slide.heading || '',
      subheading:  slide.subheading || '',
      body:        slide.body || '',
      scrollLabel: slide.scrollLabel || 'SCROLL TO SEE ↓',
      issue:       slide.issue || '',
      index:       slide.index || '',
      order:       slide.order || 0,
      active:      slide.active !== undefined ? slide.active : true,
    });
    setImagePreview(slide.image ? assetUrl(slide.image) : null);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slide?')) return;
    try {
      await api.delete(`/carousel/${id}`);
      showMsg('Slide deleted');
      fetchSlides();
    } catch {
      showMsg('Failed to delete slide', 'error');
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
  };

  return (
    <div className="ca-root">
      <div className="ca-container">
        <h1 className="ca-title">Carousel Manager</h1>

        {message.text && (
          <div className={`ca-msg ca-msg--${message.type}`}>{message.text}</div>
        )}

        <form className="ca-form" onSubmit={handleSubmit}>
          <h2 className="ca-form-title">{editingId ? 'Edit Slide' : 'Add New Slide'}</h2>

          <div className="ca-grid">
            <div className="ca-field">
              <label>Heading *</label>
              <input name="heading" value={form.heading} onChange={handleChange} placeholder="OLD" required />
            </div>
            <div className="ca-field">
              <label>Subheading *</label>
              <input name="subheading" value={form.subheading} onChange={handleChange} placeholder="MONEY" required />
            </div>
            <div className="ca-field">
              <label>Label (top left tag)</label>
              <input name="label" value={form.label} onChange={handleChange} placeholder="LIFESTYLE / FASHION" />
            </div>
            <div className="ca-field">
              <label>Issue (top right)</label>
              <input name="issue" value={form.issue} onChange={handleChange} placeholder="BEFORE 2016" />
            </div>
            <div className="ca-field">
              <label>Issue Number</label>
              <input name="index" value={form.index} onChange={handleChange} placeholder="/ ISSUE 1" />
            </div>
            <div className="ca-field">
              <label>Scroll Label</label>
              <input name="scrollLabel" value={form.scrollLabel} onChange={handleChange} placeholder="SCROLL TO SEE ↓" />
            </div>
            <div className="ca-field">
              <label>Order (display position)</label>
              <input type="number" name="order" value={form.order} onChange={handleChange} min="0" />
            </div>
            <div className="ca-field ca-field--checkbox">
              <label>
                <input type="checkbox" name="active" checked={form.active} onChange={handleChange} />
                Active (visible on site)
              </label>
            </div>
          </div>

          <div className="ca-field ca-field--full">
            <label>Body Text</label>
            <textarea name="body" value={form.body} onChange={handleChange}
              placeholder="Old money is an aesthetic based around..." rows={4} />
          </div>

          <div className="ca-field ca-field--full">
            <label>Slide Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <div className="ca-preview">
                <img src={imagePreview} alt="Preview" />
                <button type="button" className="ca-remove-img" onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }}>✕ Remove</button>
              </div>
            )}
          </div>

          <div className="ca-form-actions">
            <button type="submit" className="ca-btn ca-btn--primary" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update Slide' : 'Add Slide'}
            </button>
            {editingId && (
              <button type="button" className="ca-btn ca-btn--ghost" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <section className="ca-list-section">
          <h2 className="ca-form-title">All Slides ({slides.length})</h2>
          {slides.length === 0 ? (
            <p className="ca-empty">No slides yet. Add one above.</p>
          ) : (
            <div className="ca-list">
              {slides.map(slide => (
                <div key={slide._id} className={`ca-card ${!slide.active ? 'ca-card--inactive' : ''}`}>
                  <div className="ca-card-img">
                    {slide.image
                      ? <img src={assetUrl(slide.image)} alt={slide.heading} />
                      : <div className="ca-card-no-img">No Image</div>
                    }
                  </div>
                  <div className="ca-card-info">
                    <div className="ca-card-heading">
                      {slide.heading} <span>{slide.subheading}</span>
                    </div>
                    <div className="ca-card-label">{slide.label}</div>
                    <div className="ca-card-meta">
                      Order: {slide.order} &nbsp;|&nbsp;
                      {slide.active
                        ? <span className="ca-badge ca-badge--green">Active</span>
                        : <span className="ca-badge ca-badge--grey">Inactive</span>
                      }
                    </div>
                    <p className="ca-card-body">{slide.body?.slice(0, 80)}...</p>
                  </div>
                  <div className="ca-card-actions">
                    <button className="ca-btn ca-btn--edit" onClick={() => handleEdit(slide)}>Edit</button>
                    <button className="ca-btn ca-btn--danger" onClick={() => handleDelete(slide._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CarouselAdmin;