import React, { useState, useRef } from 'react';
import api, { errorMessage } from '../../api/client';
import { useCategories, createCategory } from '../../hooks/Usecategories';
import '../../css/AddProducts.css';

const GENDER_OPTIONS = [
  { value: 'men',         label: "Men's" },
  { value: 'women',       label: "Women's" },
  { value: 'kids_male',   label: 'Kids — Boy' },
  { value: 'kids_female', label: 'Kids — Girl' },
  { value: 'unisex',      label: 'Unisex' },
];

const SEASON_OPTIONS = [
  { value: '',           label: 'Not Applicable' },
  { value: 'spring',     label: 'Spring' },
  { value: 'summer',     label: 'Summer' },
  { value: 'autumn',     label: 'Autumn / Fall' },
  { value: 'winter',     label: 'Winter' },
  { value: 'all_season', label: 'All Season' },
];

const PRESET_COLUMNS = {
  upper:  ['Chest', 'Shoulder', 'Length', 'Width'],
  lower:  ['Waist', 'Hip', 'Length', 'Inseam'],
  custom: [],
};

const DEFAULT_SIZES = {
  upper:  ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  lower:  ['28', '30', '32', '34', '36', '38'],
  custom: ['S', 'M', 'L', 'XL'],
};

function buildEmptySizeChart(type) {
  const columns = PRESET_COLUMNS[type] || [];
  const rows = DEFAULT_SIZES[type].map(size => ({
    size,
    measurements: Object.fromEntries(columns.map(col => [col, ''])),
  }));
  return { type, unit: 'inches', columns, rows };
}

const SizeChartBuilder = ({ sizeChart, onChange }) => {
  const addColumn = () => {
    const name = window.prompt('Enter measurement name (e.g. Chest, Waist):');
    if (!name || !name.trim()) return;
    const col = name.trim();
    if (sizeChart.columns.includes(col)) return;
    onChange({
      ...sizeChart,
      columns: [...sizeChart.columns, col],
      rows: sizeChart.rows.map(row => ({ ...row, measurements: { ...row.measurements, [col]: '' } })),
    });
  };

  const removeColumn = col => {
    const newRows = sizeChart.rows.map(row => {
      const m = { ...row.measurements };
      delete m[col];
      return { ...row, measurements: m };
    });
    onChange({ ...sizeChart, columns: sizeChart.columns.filter(c => c !== col), rows: newRows });
  };

  const addRow = () => {
    const size = window.prompt('Enter size label (e.g. 3XL, 40, etc.):');
    if (!size || !size.trim()) return;
    onChange({
      ...sizeChart,
      rows: [...sizeChart.rows, {
        size: size.trim(),
        measurements: Object.fromEntries(sizeChart.columns.map(col => [col, ''])),
      }],
    });
  };

  const removeRow = idx =>
    onChange({ ...sizeChart, rows: sizeChart.rows.filter((_, i) => i !== idx) });

  const updateCell = (rowIdx, col, value) =>
    onChange({
      ...sizeChart,
      rows: sizeChart.rows.map((row, i) =>
        i === rowIdx ? { ...row, measurements: { ...row.measurements, [col]: value } } : row
      ),
    });

  const updateSize = (rowIdx, value) =>
    onChange({
      ...sizeChart,
      rows: sizeChart.rows.map((row, i) => i === rowIdx ? { ...row, size: value } : row),
    });

  return (
    <div className="size-chart-builder">
      <div className="sc-header">
        <div className="sc-meta">
          <div className="sc-field">
            <label>Chart Type</label>
            <select
              value={sizeChart.type}
              onChange={e => {
                const type = e.target.value;
                if (window.confirm('Changing type will reset columns to defaults. Continue?')) {
                  onChange(buildEmptySizeChart(type));
                }
              }}
            >
              <option value="upper">Upper Body</option>
              <option value="lower">Lower Body</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="sc-field">
            <label>Unit</label>
            <select value={sizeChart.unit} onChange={e => onChange({ ...sizeChart, unit: e.target.value })}>
              <option value="inches">Inches</option>
              <option value="cm">Centimeters</option>
            </select>
          </div>
        </div>
        <div className="sc-actions">
          <button type="button" className="sc-btn add-col" onClick={addColumn}>+ Add Column</button>
          <button type="button" className="sc-btn add-row" onClick={addRow}>+ Add Row</button>
        </div>
      </div>

      {sizeChart.columns.length === 0 ? (
        <p className="sc-empty">No columns yet. Click "+ Add Column" or change the chart type.</p>
      ) : (
        <div className="sc-table-wrapper">
          <table className="sc-table">
            <thead>
              <tr>
                <th>Size</th>
                {sizeChart.columns.map(col => (
                  <th key={col}>
                    {col}
                    <button type="button" className="col-del" onClick={() => removeColumn(col)}>✕</button>
                  </th>
                ))}
                <th>Del</th>
              </tr>
            </thead>
            <tbody>
              {sizeChart.rows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td>
                    <input
                      type="text"
                      className="sc-input size-input"
                      value={row.size}
                      onChange={e => updateSize(rowIdx, e.target.value)}
                    />
                  </td>
                  {sizeChart.columns.map(col => (
                    <td key={col}>
                      <input
                        type="text"
                        className="sc-input"
                        value={row.measurements[col] ?? ''}
                        onChange={e => updateCell(rowIdx, col, e.target.value)}
                        placeholder="—"
                      />
                    </td>
                  ))}
                  <td>
                    <button type="button" className="row-del" onClick={() => removeRow(rowIdx)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ColorPicker = ({ colors, onChange }) => {
  const [name, setName] = useState('');
  const [hex, setHex]   = useState('#000000');

  const add = () => {
    if (!name.trim()) return;
    if (colors.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) return;
    onChange([...colors, { name: name.trim(), hex }]);
    setName('');
    setHex('#000000');
  };

  const remove = idx => onChange(colors.filter((_, i) => i !== idx));

  return (
    <div className="color-picker">
      <div className="color-picker-row">
        <input
          type="text"
          placeholder="Color name (e.g. Navy Blue)"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <input type="color" value={hex} onChange={e => setHex(e.target.value)} title="Pick color" className="color-input" />
        <button type="button" className="sc-btn add-col" onClick={add}>Add</button>
      </div>
      <div className="color-tags">
        {colors.map((c, i) => (
          <span key={i} className="color-tag">
            <span className="color-dot" style={{ background: c.hex }} />
            {c.name}
            <button type="button" className="color-remove" onClick={() => remove(i)}>✕</button>
          </span>
        ))}
      </div>
    </div>
  );
};

const AddProduct = () => {
  const { categories, loading: catLoading, error: catError, refetch } = useCategories();

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '',
    subCategory: '', quantity: '', gender: 'unisex',
    season: '', brand: '', material: '', tags: '',
  });

  const [imageFiles, setImageFiles]     = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [colors, setColors]             = useState([]);
  const [useSizeChart, setUseSizeChart] = useState(false);
  const [sizeChart, setSizeChart]       = useState(buildEmptySizeChart('upper'));
  const [loading, setLoading]           = useState(false);

  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat]   = useState(false);

  const fileInputRef = useRef(null);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = e => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setImagePreview(files.map(f => URL.createObjectURL(f)));
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setAddingCat(true);
    try {
      const created = await createCategory(newCatName.trim());
      await refetch();
      setFormData(f => ({ ...f, category: created.name }));
      setNewCatName('');
      setShowAddCat(false);
    } catch (err) {
      if (err.response?.status === 409) {
        const existing = err.response.data.category;
        await refetch();
        setFormData(f => ({ ...f, category: existing.name }));
        setShowAddCat(false);
        setNewCatName('');
      } else {
        alert(errorMessage(err, 'Failed to create category'));
      }
    } finally {
      setAddingCat(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.category) { alert('Please select a category.'); return; }
    setLoading(true);

    const data = new FormData();
    data.append('name',        formData.name);
    data.append('description', formData.description);
    data.append('price',       Number(formData.price));
    data.append('category',    formData.category);
    data.append('subCategory', formData.subCategory);
    data.append('quantity',    formData.quantity);
    data.append('gender',      formData.gender);
    data.append('season',      formData.season);
    data.append('brand',       formData.brand);
    data.append('material',    formData.material);
    data.append('tags',        formData.tags);
    data.append('colors',      JSON.stringify(colors));

    if (useSizeChart && sizeChart.rows.length > 0) {
      data.append('sizes',     JSON.stringify(sizeChart.rows.map(r => r.size)));
      data.append('sizeChart', JSON.stringify(sizeChart));
    }

    imageFiles.forEach(file => data.append('images', file));

    try {
      await api.post('/products', data);
      alert('Product added successfully!');
      setFormData({ name: '', description: '', price: '', category: '', subCategory: '', quantity: '', gender: 'unisex', season: '', brand: '', material: '', tags: '' });
      setImageFiles([]);
      setImagePreview([]);
      setColors([]);
      setUseSizeChart(false);
      setSizeChart(buildEmptySizeChart('upper'));
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      alert(errorMessage(error, 'Failed to add product'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-page">
      <form onSubmit={handleSubmit} className="add-product-form">
        <h2>Add New Product</h2>

        <section className="form-section">
          <p className="section-title">Product Details</p>

          <div className="form-group">
            <label>Product Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Classic Oxford Shirt" required />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Product description..." required rows={4} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Price (Rs.) *</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" min="0" step="0.01" required />
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="0" min="0" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Brand</label>
              <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g. Nike" />
            </div>
            <div className="form-group">
              <label>Material</label>
              <input type="text" name="material" value={formData.material} onChange={handleChange} placeholder="e.g. 100% Cotton" />
            </div>
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input type="text" name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g. casual, summer, cotton" />
          </div>
        </section>

        <section className="form-section">
          <p className="section-title">Gender</p>
          <div className="gender-select-row">
            {GENDER_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`gender-pill ${formData.gender === opt.value ? 'gender-pill--active' : ''}`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={opt.value}
                  checked={formData.gender === opt.value}
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </section>

        <section className="form-section">
          <p className="section-title">Season (Optional)</p>
          <select name="season" value={formData.season} onChange={handleChange} className="category-select">
            {SEASON_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </section>

        <section className="form-section">
          <p className="section-title">Category *</p>
          {catError ? (
            <p className="field-error">⚠ {catError}</p>
          ) : (
            <>
              <div className="category-select-row">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  disabled={catLoading}
                  required
                  className="category-select"
                >
                  <option value="">{catLoading ? 'Loading categories…' : '— Select a category —'}</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={`add-cat-trigger ${showAddCat ? 'active' : ''}`}
                  onClick={() => { setShowAddCat(p => !p); setNewCatName(''); }}
                >
                  {showAddCat ? '✕ Cancel' : '+ New Category'}
                </button>
              </div>

              {showAddCat && (
                <div className="add-cat-box">
                  <p className="add-cat-hint">Enter a new category name and press Add or hit Enter.</p>
                  <div className="add-cat-inline">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="e.g. Hoodies, Kurtas…"
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); }
                        if (e.key === 'Escape') { setShowAddCat(false); setNewCatName(''); }
                      }}
                      autoFocus
                      maxLength={60}
                    />
                    <button
                      type="button"
                      className="add-cat-confirm"
                      onClick={handleAddCategory}
                      disabled={addingCat || !newCatName.trim()}
                    >
                      {addingCat ? '…' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              {formData.category && (
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>Sub-Category</label>
                  <input
                    type="text"
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    placeholder="e.g. Knitted Stripe, Polo, Graphic Tee…"
                  />
                  <small className="field-hint">
                    Sub-category inside "{formData.category}". Leave blank if not needed.
                  </small>
                </div>
              )}
            </>
          )}
        </section>

        <section className="form-section">
          <p className="section-title">Colors</p>
          <ColorPicker colors={colors} onChange={setColors} />
        </section>

        <section className="form-section">
          <p className="section-title">Product Images *</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            required
          />
          <small className="field-hint">Max 5 images, 5 MB each</small>
          {imagePreview.length > 0 && (
            <div className="image-preview-grid">
              {imagePreview.map((src, i) => (
                <img key={i} src={src} alt={`Preview ${i + 1}`} className="preview-img" />
              ))}
            </div>
          )}
        </section>

        <section className="form-section">
          <div className="section-toggle">
            <p className="section-title">Size Chart</p>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={useSizeChart}
                onChange={e => setUseSizeChart(e.target.checked)}
              />
              <span className="toggle-slider" />
              <span className="toggle-label">{useSizeChart ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>
          {useSizeChart && <SizeChartBuilder sizeChart={sizeChart} onChange={setSizeChart} />}
        </section>

        <button type="submit" disabled={loading} className="submit-btn">
          <span>{loading ? <><span className="spinner" /> Adding…</> : 'Add Product'}</span>
        </button>
      </form>
    </div>
  );
};

export default AddProduct;