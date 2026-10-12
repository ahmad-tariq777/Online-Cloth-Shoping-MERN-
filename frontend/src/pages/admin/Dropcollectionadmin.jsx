import React, { useEffect, useState, useCallback, useRef } from 'react';
import api, { assetUrl, errorMessage } from '../../api/client';
import '../../css/DropCollectionsAdmin.css';

const buildImgSrc = (img) => (img ? assetUrl(img) : null);

const SEASONS = [
  { value: 'none', label: 'No Season' },
  { value: 'winter', label: 'Winter' },
  { value: 'summer', label: 'Summer' },
  { value: 'spring', label: 'Spring' },
  { value: 'autumn', label: 'Autumn' },
];

const GENDER_OPTIONS = [
  { value: 'men', label: "Men's" },
  { value: 'women', label: "Women's" },
  { value: 'unisex', label: 'Unisex' },
  { value: 'kids_male', label: 'Boys' },
  { value: 'kids_female', label: 'Girls' },
];

const SEASON_SYMBOLS = { winter: '❄', summer: '☀', spring: '❀', autumn: '◈', none: '◇' };

const EMPTY_FORM = {
  collectionName: '',
  season: 'none',
  heading: '',
  subheading: '',
  body: '',
  order: 0,
  active: true,
  linkedProducts: [],
};

export default function DropCollectionsAdmin() {
  const [collections, setCollections] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerGender, setPickerGender] = useState('');
  const [pickerCategory, setPickerCategory] = useState('');
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const flash = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };

  const fetchCollections = useCallback(() => {
    api
      .get('/drop-collections/all')
      .then((r) => setCollections(r.data))
      .catch(() => flash('Failed to load collections', 'error'));
  }, []);

  const fetchProducts = useCallback(() => {
    api
      .get('/products', { params: { limit: 100 } })
      .then((r) => setProducts(r.data.products))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCollections();
    fetchProducts();
  }, [fetchCollections, fetchProducts]);

  const handleImage = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImage(file);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setPickerOpen(false);
    setPickerSearch('');
    setPickerGender('');
    setPickerCategory('');
  };

  const loadEdit = (col) => {
    setForm({
      collectionName: col.collectionName || '',
      season: col.season || 'none',
      heading: col.heading || '',
      subheading: col.subheading || '',
      body: col.body || '',
      order: col.order ?? 0,
      active: col.active ?? true,
      linkedProducts: (col.linkedProducts || []).map((lp) => ({
        product: lp.product?._id || lp.product,
        gender: lp.gender || 'unisex',
        _productData: lp.product,
      })),
    });
    setEditingId(col._id);
    setImageFile(null);

    setImagePreview(buildImgSrc(col.image));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addProduct = (product) => {
    if (form.linkedProducts.some((lp) => lp.product === product._id || lp.product?._id === product._id)) return;
    setForm((f) => ({
      ...f,
      linkedProducts: [...f.linkedProducts, { product: product._id, gender: 'unisex', _productData: product }],
    }));
  };

  const removeProduct = (idx) => {
    setForm((f) => ({ ...f, linkedProducts: f.linkedProducts.filter((_, i) => i !== idx) }));
  };

  const updateProductGender = (idx, gender) => {
    setForm((f) => ({
      ...f,
      linkedProducts: f.linkedProducts.map((lp, i) => (i === idx ? { ...lp, gender } : lp)),
    }));
  };

  const reorderProduct = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= form.linkedProducts.length) return;
    const arr = [...form.linkedProducts];
    const [item] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, item);
    setForm((f) => ({ ...f, linkedProducts: arr }));
  };

  const handleSubmit = async () => {
    if (!form.collectionName.trim()) { flash('Collection name is required', 'error'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('collectionName', form.collectionName);
      fd.append('season', form.season);
      fd.append('heading', form.heading);
      fd.append('subheading', form.subheading);
      fd.append('body', form.body);
      fd.append('order', form.order);
      fd.append('active', form.active);
      fd.append('linkedProducts', JSON.stringify(form.linkedProducts.map((lp) => ({ product: lp.product, gender: lp.gender }))));
      if (imageFile) fd.append('image', imageFile);

      if (editingId) {
        await api.put(`/drop-collections/${editingId}`, fd);
        flash('Collection updated');
      } else {
        await api.post('/drop-collections', fd);
        flash('Collection created');
      }
      resetForm();
      fetchCollections();
    } catch (err) {
      flash(errorMessage(err, 'Operation failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/drop-collections/${id}`);
      flash('Collection deleted');
      fetchCollections();
      if (editingId === id) resetForm();
    } catch {
      flash('Delete failed', 'error');
    }
    setDeleteConfirm(null);
  };

  const toggleActive = async (col) => {
    try {
      const fd = new FormData();
      fd.append('collectionName', col.collectionName);
      fd.append('season', col.season);
      fd.append('active', !col.active);
      fd.append('linkedProducts', JSON.stringify((col.linkedProducts || []).map((lp) => ({ product: lp.product?._id || lp.product, gender: lp.gender }))));
      await api.put(`/drop-collections/${col._id}`, fd);
      fetchCollections();
    } catch {
      flash('Update failed', 'error');
    }
  };

  const allProductIds = new Set(form.linkedProducts.map((lp) => lp.product?._id || lp.product));
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts = products.filter((p) => {
    const q = pickerSearch.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q);
    const matchGender = !pickerGender || p.gender === pickerGender;
    const matchCat = !pickerCategory || p.category === pickerCategory;
    return matchSearch && matchGender && matchCat;
  });

  return (
    <div className="dca-root">
      <div className="dca-container">
        {msg && (
          <div className={`dca-msg dca-msg--${msg.type}`}>
            <span className="dca-msg-icon">{msg.type === 'success' ? '✓' : '✕'}</span>
            {msg.text}
          </div>
        )}

        <div className="dca-header">
          <div>
            <p className="dca-eyebrow">Collections Management</p>
            <h1 className="dca-title">{editingId ? 'Edit Collection' : 'New Drop Collection'}</h1>
          </div>
          <div className="dca-header-meta">
            <span className="dca-stat-chip">{collections.length} Total</span>
            <span className="dca-stat-chip dca-stat-chip--green">{collections.filter((c) => c.active).length} Live</span>
          </div>
        </div>

        <div className="dca-form">
          <p className="dca-form-title">
            {editingId ? `Editing — ${form.collectionName || 'Untitled'}` : 'Collection Details'}
          </p>

          <div className="dca-grid">
            <div className="dca-field">
              <label>Collection Name *</label>
              <input
                value={form.collectionName}
                onChange={(e) => setForm((f) => ({ ...f, collectionName: e.target.value }))}
                placeholder="e.g. Noir Solstice"
              />
            </div>
            <div className="dca-field">
              <label>Season</label>
              <select value={form.season} onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}>
                {SEASONS.map((s) => (
                  <option key={s.value} value={s.value}>{SEASON_SYMBOLS[s.value]} {s.label}</option>
                ))}
              </select>
            </div>
            <div className="dca-field">
              <label>Heading</label>
              <input value={form.heading} onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} placeholder="Optional hero heading" />
            </div>
            <div className="dca-field">
              <label>Subheading</label>
              <input value={form.subheading} onChange={(e) => setForm((f) => ({ ...f, subheading: e.target.value }))} placeholder="Italic subtitle" />
            </div>
            <div className="dca-field dca-field--full">
              <label>Body Text</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Editorial description of the collection..."
                rows={3}
              />
            </div>
            <div className="dca-field">
              <label>Display Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                min={0}
              />
            </div>
            <div className="dca-field dca-field--checkbox">
              <label className="dca-checkbox-label">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
                Publish collection
              </label>
            </div>
          </div>

          <div className="dca-field dca-field--full" style={{ marginBottom: 0 }}>
            <label>Editorial Image</label>
            <div
              className={`dca-upload-zone ${dragOver ? 'dca-upload-zone--over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <div className="dca-preview">
                  <img src={imagePreview} alt="Preview" />
                  <div className="dca-preview-info">
                    <p className="dca-preview-label">Current image</p>
                    <button className="dca-remove-img" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="dca-upload-placeholder">
                  <div className="dca-upload-icon">+</div>
                  <p>Drop image here or click to upload</p>
                  <span>JPG, PNG, WEBP — max 10MB</span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImage(e.target.files[0])} />
            </div>
          </div>

          <div className="dca-linked-section">
            <div className="dca-linked-header">
              <label className="dca-section-label">
                Linked Products <span className="dca-count">({form.linkedProducts.length})</span>
              </label>
              <button className="dca-add-products-btn" onClick={() => setPickerOpen((v) => !v)}>
                {pickerOpen ? '✕ Close Picker' : '+ Add Products'}
              </button>
            </div>

            {form.linkedProducts.length > 0 && (
              <div className="dca-linked-list">
                {form.linkedProducts.map((lp, idx) => {
                  const pd = lp._productData;

                  const imgSrc = buildImgSrc(pd?.images?.[0]);
                  return (
                    <div key={idx} className="dca-linked-item">
                      <div className="dca-linked-drag">
                        <button className="dca-drag-btn" onClick={() => reorderProduct(idx, idx - 1)} disabled={idx === 0}>↑</button>
                        <button className="dca-drag-btn" onClick={() => reorderProduct(idx, idx + 1)} disabled={idx === form.linkedProducts.length - 1}>↓</button>
                      </div>
                      <div className="dca-linked-img-wrap">
                        {imgSrc ? <img src={imgSrc} alt="" className="dca-linked-img" /> : <div className="dca-linked-no-img">—</div>}
                      </div>
                      <div className="dca-linked-info">
                        <span className="dca-linked-name">{pd?.name || lp.product}</span>
                        <span className="dca-linked-price">{pd?.category || ''}{pd?.price ? ` · Rs. ${pd.price.toLocaleString()}` : ''}</span>
                      </div>
                      <select className="dca-linked-gender" value={lp.gender} onChange={(e) => updateProductGender(idx, e.target.value)}>
                        {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                      </select>
                      <button className="dca-linked-remove" onClick={() => removeProduct(idx)}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {pickerOpen && (
              <div className="dca-product-picker">
                <div className="dca-picker-header">
                  <input
                    className="dca-picker-search"
                    placeholder="Search products..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    autoFocus
                  />
                  <select className="dca-picker-filter" value={pickerGender} onChange={(e) => setPickerGender(e.target.value)}>
                    <option value="">All Genders</option>
                    {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                  <select className="dca-picker-filter" value={pickerCategory} onChange={(e) => setPickerCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="dca-picker-count">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                </div>
                <div className="dca-picker-grid">
                  {filteredProducts.length === 0 ? (
                    <div className="dca-picker-empty">No products match your filters</div>
                  ) : filteredProducts.map((p) => {

                    const imgSrc = buildImgSrc(p.images?.[0]);
                    const added = allProductIds.has(p._id);
                    return (
                      <div
                        key={p._id}
                        className={`dca-picker-card ${added ? 'dca-picker-card--added' : ''}`}
                        onClick={() => !added && addProduct(p)}
                      >
                        <div className="dca-picker-img-wrap">
                          {imgSrc ? <img src={imgSrc} alt={p.name} className="dca-picker-img" /> : <div className="dca-picker-no-img">—</div>}
                        </div>
                        <p className="dca-picker-name">{p.name}</p>
                        <p className="dca-picker-price">Rs. {p.price?.toLocaleString()}</p>
                        {added && <span className="dca-picker-badge">Added</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="dca-form-actions">
            <button className="dca-btn dca-btn--primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Collection' : 'Create Collection'}
            </button>
            {editingId && (
              <button className="dca-btn dca-btn--ghost" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </div>

        <div className="dca-list-section">
          <div className="dca-list-header">
            <p className="dca-section-label">All Collections <span className="dca-count">({collections.length})</span></p>
          </div>

          {collections.length === 0 ? (
            <div className="dca-empty">
              <div className="dca-empty-icon">◇</div>
              <p>No collections yet. Create your first drop above.</p>
            </div>
          ) : (
            <div className="dca-list">
              {collections
                .sort((a, b) => a.order - b.order)
                .map((col) => (
                  <div key={col._id} className={`dca-card ${!col.active ? 'dca-card--inactive' : ''}`}>
                    <div className="dca-card-img">
                      {col.image

                        ? <img src={buildImgSrc(col.image)} alt="" />
                        : <div className="dca-card-no-img">No Image</div>
                      }
                    </div>
                    <div className="dca-card-info">
                      <div className="dca-card-top">
                        <h3 className="dca-card-heading">{col.collectionName}</h3>
                        <div className="dca-card-badges">
                          <span className={`dca-badge ${col.active ? 'dca-badge--green' : 'dca-badge--grey'}`}>
                            {col.active ? 'Live' : 'Hidden'}
                          </span>
                          {col.season !== 'none' && (
                            <span className="dca-badge dca-badge--blue">
                              {SEASON_SYMBOLS[col.season]} {col.season}
                            </span>
                          )}
                          <span className="dca-badge dca-badge--grey">Order #{col.order}</span>
                        </div>
                      </div>
                      {col.subheading && <p className="dca-card-season">{col.subheading}</p>}
                      <div className="dca-card-meta">
                        <span>{col.linkedProducts?.length || 0} products linked</span>
                        {col.body && <span>· Has description</span>}
                        {col.image && <span>· Has image</span>}
                      </div>
                      {expandedCards[col._id] && col.linkedProducts?.length > 0 && (
                        <div className="dca-card-products">
                          {col.linkedProducts.slice(0, 8).map((lp, i) => {
                            const pd = lp.product;

                            const src = buildImgSrc(pd?.images?.[0]);
                            return (
                              <div key={i} className="dca-mini-product">
                                {src ? <img src={src} alt="" /> : <div className="dca-mini-no-img" />}
                                <span>{pd?.name || '—'}</span>
                              </div>
                            );
                          })}
                          {col.linkedProducts.length > 8 && (
                            <div className="dca-mini-more">+{col.linkedProducts.length - 8} more</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="dca-card-actions">
                      <button className="dca-btn dca-btn--edit" onClick={() => loadEdit(col)}>Edit</button>
                      <button
                        className={`dca-btn ${col.active ? 'dca-btn--ghost' : 'dca-btn--activate'}`}
                        onClick={() => toggleActive(col)}
                      >{col.active ? 'Hide' : 'Publish'}</button>
                      <button
                        className="dca-btn dca-btn--ghost"
                        onClick={() => setExpandedCards((e) => ({ ...e, [col._id]: !e[col._id] }))}
                      >{expandedCards[col._id] ? 'Less' : 'Products'}</button>
                      <button className="dca-btn dca-btn--danger" onClick={() => setDeleteConfirm(col._id)}>Delete</button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="dca-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="dca-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="dca-modal-title">Delete Collection</h3>
            <p className="dca-modal-body">This will permanently remove the collection and its image. Products will not be affected.</p>
            <div className="dca-modal-actions">
              <button className="dca-btn dca-btn--danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
              <button className="dca-btn dca-btn--ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}