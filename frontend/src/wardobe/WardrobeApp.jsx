import { useState, useEffect } from "react";
import "./WardobeApp.css";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const MOCK_ITEMS = [
  { _id: "1", name: "White Oxford Shirt", category: "top", color: "white", season: ["spring", "summer", "all"], occasion: ["work", "casual"], imageUrl: null, wearCount: 12, lastWorn: "2025-02-20", isFavorite: true, brand: "Uniqlo", size: "M" },
  { _id: "2", name: "Slim Fit Chinos", category: "bottom", color: "beige", season: ["all"], occasion: ["casual", "work"], imageUrl: null, wearCount: 8, lastWorn: "2025-02-28", isFavorite: false, brand: "H&M", size: "32" },
  { _id: "3", name: "Navy Blazer", category: "jacket", color: "navy", season: ["autumn", "spring"], occasion: ["work", "formal"], imageUrl: null, wearCount: 5, lastWorn: "2025-01-15", isFavorite: true, brand: "Zara", size: "L" },
  { _id: "4", name: "White Sneakers", category: "shoes", color: "white", season: ["all"], occasion: ["casual"], imageUrl: null, wearCount: 24, lastWorn: "2025-03-01", isFavorite: true, brand: "Nike", size: "42" },
  { _id: "5", name: "Black Turtleneck", category: "top", color: "black", season: ["winter", "autumn"], occasion: ["casual", "formal"], imageUrl: null, wearCount: 3, lastWorn: null, isFavorite: false, brand: "COS", size: "M" },
  { _id: "6", name: "Blue Denim Jeans", category: "bottom", color: "blue", season: ["all"], occasion: ["casual"], imageUrl: null, wearCount: 30, lastWorn: "2025-03-05", isFavorite: false, brand: "Levi's", size: "32" },
  { _id: "7", name: "Leather Loafers", category: "shoes", color: "brown", season: ["spring", "autumn"], occasion: ["work", "casual"], imageUrl: null, wearCount: 7, lastWorn: "2025-02-10", isFavorite: false, brand: "Clarks", size: "42" },
  { _id: "8", name: "Silk Midi Dress", category: "dress", color: "cream", season: ["spring", "summer"], occasion: ["formal", "party", "date"], imageUrl: null, wearCount: 2, lastWorn: "2024-12-31", isFavorite: true, brand: "Massimo Dutti", size: "S" },
];

const api = {
  async getItems(filters = {}) {
    await delay(400);
    let items = [...MOCK_ITEMS];
    if (filters.category) items = items.filter((i) => i.category === filters.category);
    if (filters.search) items = items.filter((i) => i.name.toLowerCase().includes(filters.search.toLowerCase()));
    return { items, total: items.length };
  },
  async addItem(data) {
    await delay(600);
    const item = { ...data, _id: Date.now().toString(), wearCount: 0, lastWorn: null, createdAt: new Date().toISOString() };
    MOCK_ITEMS.push(item);
    return item;
  },
  async deleteItem(id) {
    await delay(300);
    const idx = MOCK_ITEMS.findIndex((i) => i._id === id);
    if (idx > -1) MOCK_ITEMS.splice(idx, 1);
  },
  async wearItem(id) {
    await delay(200);
    const item = MOCK_ITEMS.find((i) => i._id === id);
    if (item) { item.wearCount++; item.lastWorn = new Date().toISOString(); }
    return item;
  },
  async generateOutfit(occasion = "casual") {
    await delay(800);
    const tops = MOCK_ITEMS.filter((i) => i.category === "top");
    const bottoms = MOCK_ITEMS.filter((i) => i.category === "bottom");
    const shoes = MOCK_ITEMS.filter((i) => i.category === "shoes");
    const jackets = MOCK_ITEMS.filter((i) => i.category === "jacket");
    const results = [];
    for (let i = 0; i < 3; i++) {
      const outfit = {
        score: Math.floor(Math.random() * 30 + 70),
        occasion,
        items: [
          tops[Math.floor(Math.random() * tops.length)],
          bottoms[Math.floor(Math.random() * bottoms.length)],
          shoes[Math.floor(Math.random() * shoes.length)],
          ...(Math.random() > 0.5 && jackets.length ? [jackets[Math.floor(Math.random() * jackets.length)]] : []),
        ].filter(Boolean),
      };
      results.push(outfit);
    }
    return results;
  },
  async getWeather(city = "London") {
    await delay(600);
    return { temperature: 14, condition: "cloudy", city, description: "partly cloudy", feelsLike: 12 };
  },
  async getStats() {
    await delay(300);
    const byCategory = {};
    MOCK_ITEMS.forEach((i) => { byCategory[i.category] = (byCategory[i.category] || 0) + 1; });
    return {
      summary: { totalItems: MOCK_ITEMS.length, totalWears: MOCK_ITEMS.reduce((s, i) => s + i.wearCount, 0) },
      categoryBreakdown: Object.entries(byCategory).map(([_id, count]) => ({ _id, count })),
      mostWorn: [...MOCK_ITEMS].sort((a, b) => b.wearCount - a.wearCount).slice(0, 3),
      leastWorn: MOCK_ITEMS.filter((i) => i.wearCount === 0).slice(0, 3),
    };
  },
};

const CATEGORY_EMOJI = { top: "👕", bottom: "👖", dress: "👗", jacket: "🧥", outerwear: "🧣", shoes: "👟", accessory: "💍", bag: "👜", activewear: "🩱", swimwear: "🩲", other: "🎽" };
const CATEGORY_COLOR = { top: "#e8f4fd", bottom: "#fdf3e8", dress: "#fde8f4", jacket: "#e8fde8", shoes: "#fdf8e8", accessory: "#f0e8fd", bag: "#fde8e8", other: "#f0f0f0" };
const OCCASIONS = ["casual", "work", "formal", "sport", "party", "beach", "travel", "date", "all"];
const SEASONS = ["spring", "summer", "autumn", "winter", "all"];
const CATEGORIES = ["top", "bottom", "dress", "jacket", "outerwear", "shoes", "accessory", "bag", "activewear", "swimwear", "other"];

const COLOR_SWATCHES = {
  white: "#f8f8f8", black: "#1a1a1a", grey: "#9e9e9e", gray: "#9e9e9e",
  navy: "#1a237e", blue: "#1976d2", "light blue": "#64b5f6",
  beige: "#d7ccc8", cream: "#fff9e6", camel: "#c8a96e", brown: "#795548",
  red: "#e53935", pink: "#e91e63", purple: "#9c27b0", yellow: "#fdd835",
  green: "#43a047", olive: "#827717", orange: "#fb8c00",
};

function getColorSwatch(color) {
  return COLOR_SWATCHES[color?.toLowerCase()] || "#ccc";
}

function formatDate(d) {
  if (!d) return "Never";
  const date = new Date(d);
  const diff = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

const Icon = {
  Wardrobe: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <path d="M3 3h18v18H3zM12 3v18M8 7h2M8 11h2M14 7h2M14 11h2" />
    </svg>
  ),
  Add: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  Outfit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Weather: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Pack: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
      <path d="M4 4h16v16H4zM8 2v4M16 2v4M4 10h16M9 14h6" />
    </svg>
  ),
  Heart: ({ filled }) => (
    <svg viewBox="0 0 24 24" fill={filled ? "#e91e63" : "none"} stroke={filled ? "#e91e63" : "currentColor"} strokeWidth="2" style={{ width: 18, height: 18 }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  ),
  Sparkle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
};

function ItemCard({ item, onWear, onDelete, onSelect, selected }) {
  return (
    <div
      onClick={() => onSelect && onSelect(item)}
      className={`item-card ${selected ? "selected" : ""} ${onSelect ? "clickable" : ""}`}
    >
      {selected && (
        <div className="item-card-selected-badge">
          <Icon.Check />
        </div>
      )}
      <div
        className="item-card-image"
        style={{ background: CATEGORY_COLOR[item.category] || "#f5f5f5" }}
      >
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} />
          : <span>{CATEGORY_EMOJI[item.category] || "👔"}</span>
        }
        {item.isFavorite && (
          <div className="item-card-favorite">
            <Icon.Heart filled={true} />
          </div>
        )}
      </div>
      <div className="item-card-body">
        <div className="item-card-top-row">
          <div style={{ flex: 1 }}>
            <div className={`item-card-name ${selected ? "selected" : ""}`}>{item.name}</div>
            {item.brand && <div className={`item-card-brand ${selected ? "selected" : ""}`}>{item.brand}</div>}
          </div>
          <div className="color-dot" style={{ background: getColorSwatch(item.color) }} />
        </div>
        <div className="item-card-bottom-row">
          <div className={`item-card-meta ${selected ? "selected" : ""}`}>
            Worn {item.wearCount}× · {formatDate(item.lastWorn)}
          </div>
          <div className="item-card-actions">
            {onWear && (
              <button className="btn-wear" onClick={(e) => { e.stopPropagation(); onWear(item._id); }}>
                +wear
              </button>
            )}
            {onDelete && (
              <button className="btn-delete" onClick={(e) => { e.stopPropagation(); onDelete(item._id); }}>
                <Icon.Trash />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OutfitCard({ outfit, onSave }) {
  const scoreClass = outfit.score >= 90 ? "high" : outfit.score >= 70 ? "mid" : "low";
  return (
    <div className="outfit-card">
      <div className="outfit-card-header">
        <div className="outfit-tags">
          {outfit.items.map((item) => (
            <span key={item._id} className="outfit-tag" style={{ background: CATEGORY_COLOR[item.category] || "#f5f5f5" }}>
              {CATEGORY_EMOJI[item.category]} {item.name}
            </span>
          ))}
        </div>
        <div className={`outfit-score ${scoreClass}`}>{outfit.score}%</div>
      </div>
      <div className="outfit-color-bar">
        {outfit.items.map((item) => (
          <div key={item._id} className="outfit-color-segment" style={{ background: getColorSwatch(item.color) }} title={item.color} />
        ))}
      </div>
      <div className="outfit-items">
        {outfit.items.map((item) => (
          <div key={item._id} className="outfit-item-chip">
            <span className="outfit-item-chip-emoji">{CATEGORY_EMOJI[item.category]}</span>
            <div>
              <div className="outfit-item-chip-name">{item.name}</div>
              <div className="outfit-item-chip-sub">{item.color} · {item.category}</div>
            </div>
          </div>
        ))}
      </div>
      {onSave && (
        <button className="btn-save-outfit" onClick={() => onSave(outfit)}>
          Save this outfit ✨
        </button>
      )}
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}><Icon.Close /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddItemForm({ onAdd, onClose }) {
  const [form, setForm] = useState({
    name: "", category: "top", color: "white", season: ["all"],
    occasion: ["casual"], brand: "", size: "", notes: "",
  });
  const [loading, setLoading] = useState(false);

  const field = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggle = (key, val) => setForm((f) => ({
    ...f, [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val],
  }));

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.color) return;
    setLoading(true);
    try {
      await onAdd(form);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-stack">
      <div>
        <label className="form-label">Item Name *</label>
        <input className="form-input" value={form.name} onChange={(e) => field("name", e.target.value)} placeholder="e.g. Blue Denim Jacket" />
      </div>
      <div className="form-grid-2">
        <div>
          <label className="form-label">Category *</label>
          <select className="form-select" value={form.category} onChange={(e) => field("category", e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Color *</label>
          <div className="color-input-row">
            <div className="color-preview" style={{ background: getColorSwatch(form.color) }} />
            <input className="form-input" style={{ flex: 1 }} value={form.color} onChange={(e) => field("color", e.target.value)} placeholder="e.g. navy" />
          </div>
        </div>
      </div>
      <div className="form-grid-2">
        <div>
          <label className="form-label">Brand</label>
          <input className="form-input" value={form.brand} onChange={(e) => field("brand", e.target.value)} placeholder="e.g. Zara" />
        </div>
        <div>
          <label className="form-label">Size</label>
          <input className="form-input" value={form.size} onChange={(e) => field("size", e.target.value)} placeholder="e.g. M, 32, EU42" />
        </div>
      </div>
      <div>
        <label className="form-label">Season</label>
        <div className="tag-btn-group">
          {SEASONS.map((s) => (
            <button key={s} onClick={() => toggle("season", s)} className={`tag-btn ${form.season.includes(s) ? "active-dark" : ""}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="form-label">Occasion</label>
        <div className="tag-btn-group">
          {OCCASIONS.map((o) => (
            <button key={o} onClick={() => toggle("occasion", o)} className={`tag-btn ${form.occasion.includes(o) ? "active-purple" : ""}`}>
              {o}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" value={form.notes} onChange={(e) => field("notes", e.target.value)} placeholder="Any notes about this item..." />
      </div>
      <button className="btn-submit" onClick={handleSubmit} disabled={loading || !form.name || !form.color}>
        {loading ? "Adding..." : "Add to Wardrobe"}
      </button>
    </div>
  );
}

function WardrobePage({ items, onWear, onDelete, onAdd, loading }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = items.filter((item) => {
    if (filterCat && item.category !== filterCat) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Wardrobe</h1>
          <p className="page-subtitle">{items.length} items in your closet</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Icon.Add /> Add Item
        </button>
      </div>

      <div className="filters-row">
        <input
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search your wardrobe..."
        />
        <button className={`filter-btn ${!filterCat ? "active" : ""}`} onClick={() => setFilterCat("")}>All</button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${filterCat === cat ? "active" : ""}`}
            onClick={() => setFilterCat(filterCat === cat ? "" : cat)}
          >
            {CATEGORY_EMOJI[cat]} {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">Loading wardrobe...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👗</div>
          <div className="empty-state-title">No items found</div>
          <div className="empty-state-sub">Add some items to get started!</div>
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map((item) => (
            <ItemCard key={item._id} item={item} onWear={onWear} onDelete={onDelete} />
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add to Wardrobe">
        <AddItemForm onAdd={onAdd} onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}

function OutfitGeneratorPage({ items }) {
  const [occasion, setOccasion] = useState("casual");
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState([]);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await api.generateOutfit(occasion);
      setOutfits(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { generate(); }, [occasion]);

  const saveOutfit = (outfit) => setSaved((s) => [...s, outfit]);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Outfit Generator</h1>
          <p className="page-subtitle">Let AI mix your wardrobe for you</p>
        </div>
      </div>

      <div className="occasion-selector">
        <div className="section-label">Occasion</div>
        <div className="occasion-btns">
          {["casual", "work", "formal", "party", "sport", "date", "travel"].map((o) => (
            <button key={o} className={`occasion-btn ${occasion === o ? "active" : ""}`} onClick={() => setOccasion(o)}>
              {o}
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary" onClick={generate} disabled={loading} style={{ marginBottom: 28 }}>
        <Icon.Sparkle /> {loading ? "Generating..." : "Generate Outfits"}
      </button>

      {outfits.length > 0 && (
        <div className="outfit-list">
          {outfits.map((outfit, i) => <OutfitCard key={i} outfit={outfit} onSave={saveOutfit} />)}
        </div>
      )}

      {saved.length > 0 && (
        <div className="saved-section">
          <h3 className="saved-section-title">Saved Outfits ({saved.length})</h3>
          <div className="outfit-list">
            {saved.map((outfit, i) => <OutfitCard key={i} outfit={outfit} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherPage({ items }) {
  const [city, setCity] = useState("London");
  const [weather, setWeather] = useState(null);
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWeatherOutfits = async () => {
    setLoading(true);
    try {
      const w = await api.getWeather(city);
      setWeather(w);
      const generated = await api.generateOutfit("casual");
      setOutfits(generated);
    } finally {
      setLoading(false);
    }
  };

  const CONDITION_ICON = { cloudy: "⛅", clear: "☀️", rain: "🌧️", snow: "❄️", fog: "🌫️" };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Weather Outfits</h1>
          <p className="page-subtitle">Dress smart for today's weather</p>
        </div>
      </div>

      <div className="city-input-row">
        <input
          className="city-input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchWeatherOutfits()}
          placeholder="Enter city..."
        />
        <button className="btn-dark" onClick={fetchWeatherOutfits} disabled={loading}>
          {loading ? "..." : "Get Outfits"}
        </button>
      </div>

      {weather && (
        <div className="weather-card">
          <div className="weather-card-inner">
            <div>
              <div className="weather-city">{weather.city}</div>
              <div className="weather-temp">{weather.temperature}°C</div>
              <div className="weather-desc">{weather.description}</div>
            </div>
            <div className="weather-icon">{CONDITION_ICON[weather.condition] || "🌤️"}</div>
          </div>
          <div className="weather-tip">
            💡 {weather.temperature < 15
              ? "Layer up — add a jacket to your outfit"
              : weather.temperature > 25
              ? "Keep it light and breathable today"
              : "A light layer might come in handy"}
          </div>
        </div>
      )}

      {outfits.length > 0 && (
        <div>
          <h3 className="saved-section-title">Recommended for today</h3>
          <div className="outfit-list">
            {outfits.map((o, i) => <OutfitCard key={i} outfit={o} />)}
          </div>
        </div>
      )}

      {!weather && !loading && (
        <div className="weather-empty">
          <div className="weather-empty-icon">⛅</div>
          <div className="weather-empty-text">Enter your city to get weather-based outfit suggestions</div>
        </div>
      )}
    </div>
  );
}

function PackingPage({ items }) {
  const [days, setDays] = useState(3);
  const [climate, setClimate] = useState("mild");
  const [occasions, setOccasions] = useState(["casual"]);
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleOccasion = (o) => setOccasions((s) => s.includes(o) ? s.filter((x) => x !== o) : [...s, o]);

  const generate = async () => {
    setLoading(true);
    await delay(700);
    const filtered = items.filter((i) => i.season.includes("all") || i.season.includes(climate === "hot" ? "summer" : climate === "cold" ? "winter" : "spring"));
    setList({
      tops: filtered.filter((i) => i.category === "top").slice(0, days + 1),
      bottoms: filtered.filter((i) => i.category === "bottom").slice(0, Math.ceil(days / 2)),
      shoes: filtered.filter((i) => i.category === "shoes").slice(0, 2),
      outerwear: climate !== "hot" ? filtered.filter((i) => ["jacket", "outerwear"].includes(i.category)).slice(0, 1) : [],
      accessories: filtered.filter((i) => ["accessory", "bag"].includes(i.category)).slice(0, 2),
      summary: { tripDays: days, climate, totalItems: days * 2 + 4 },
    });
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Packing Assistant</h1>
          <p className="page-subtitle">Pack smart for your next trip</p>
        </div>
      </div>

      <div className="packing-config">
        <div className="packing-grid">
          <div>
            <label className="packing-label">Trip Length</label>
            <div className="days-counter">
              <button className="counter-btn" onClick={() => setDays((d) => Math.max(1, d - 1))}>−</button>
              <span className="days-value">{days} days</span>
              <button className="counter-btn" onClick={() => setDays((d) => Math.min(30, d + 1))}>+</button>
            </div>
          </div>
          <div>
            <label className="packing-label">Climate</label>
            <div className="climate-btns">
              {[{ k: "cold", e: "🥶" }, { k: "mild", e: "😊" }, { k: "hot", e: "🔥" }, { k: "mixed", e: "🌤️" }].map(({ k, e }) => (
                <button key={k} className={`climate-btn ${climate === k ? "active" : ""}`} onClick={() => setClimate(k)}>
                  {e} {k}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="packing-label">Activities</label>
          <div className="tag-btn-group">
            {["casual", "work", "formal", "sport", "beach", "party"].map((o) => (
              <button key={o} className={`tag-btn ${occasions.includes(o) ? "active-purple" : ""}`} onClick={() => toggleOccasion(o)}>
                {o}
              </button>
            ))}
          </div>
        </div>
        <button className="btn-generate-packing" onClick={generate} disabled={loading}>
          🧳 {loading ? "Packing..." : "Generate Packing List"}
        </button>
      </div>

      {list && (
        <div>
          <div className="packing-summary">
            <div><div className="packing-summary-item-label">Total Items</div><div className="packing-summary-item-value">{list.summary.totalItems}</div></div>
            <div><div className="packing-summary-item-label">Trip</div><div className="packing-summary-item-value">{days}d</div></div>
            <div><div className="packing-summary-item-label">Climate</div><div className="packing-summary-item-value">{climate}</div></div>
          </div>
          {Object.entries(list).filter(([k]) => k !== "summary").map(([section, sectionItems]) => sectionItems.length > 0 && (
            <div key={section} className="packing-section">
              <h3 className="packing-section-title">
                {CATEGORY_EMOJI[section] || "📦"} {section} ({sectionItems.length})
              </h3>
              <div className="packing-chips">
                {sectionItems.map((item) => item && (
                  <div key={item._id} className="packing-chip">
                    <span className="packing-chip-emoji">{CATEGORY_EMOJI[item.category]}</span>
                    <div>
                      <div className="packing-chip-name">{item.name}</div>
                      <div className="packing-chip-sub">{item.color}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsPage({ items }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.getStats().then(setStats);
  }, [items]);

  if (!stats) return <div className="loading-state">Loading stats...</div>;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Wardrobe Stats</h1>
          <p className="page-subtitle">Insights about your style</p>
        </div>
      </div>

      <div className="stats-summary-grid">
        {[
          { label: "Total Items", value: stats.summary.totalItems, icon: "👗", color: "#e8f4fd" },
          { label: "Total Wears", value: stats.summary.totalWears, icon: "👟", color: "#f0fdf4" },
          { label: "Never Worn", value: stats.leastWorn.length, icon: "🏷️", color: "#fff1f2" },
          { label: "Categories", value: stats.categoryBreakdown.length, icon: "📦", color: "#fdf3e8" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="stat-card" style={{ background: color }}>
            <div className="stat-card-icon">{icon}</div>
            <div className="stat-card-value">{value}</div>
            <div className="stat-card-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stats-panel">
          <h3 className="stats-panel-title">Category Breakdown</h3>
          {stats.categoryBreakdown.map(({ _id, count }) => (
            <div key={_id} className="category-row">
              <div className="category-row-header">
                <span className="category-row-name">{CATEGORY_EMOJI[_id]} {_id}</span>
                <span className="category-row-count">{count}</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${(count / stats.summary.totalItems) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="stats-panel-col">
          <div className="stats-panel">
            <h3 className="stats-panel-title">Most Worn</h3>
            {stats.mostWorn.map((item) => (
              <div key={item._id} className="worn-row">
                <span className="worn-row-name">{CATEGORY_EMOJI[item.category]} {item.name}</span>
                <span className="worn-row-count-green">{item.wearCount}×</span>
              </div>
            ))}
          </div>

          {stats.leastWorn.length > 0 && (
            <div className="stats-panel">
              <h3 className="stats-panel-title">Unworn Items</h3>
              {stats.leastWorn.map((item) => (
                <div key={item._id} className="worn-row">
                  <span className="worn-row-name">{CATEGORY_EMOJI[item.category]} {item.name}</span>
                  <span className="worn-row-count-red">Never worn</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const NAV = [
  { id: "wardrobe", label: "Wardrobe", Icon: Icon.Wardrobe },
  { id: "outfits", label: "Outfits", Icon: Icon.Outfit },
  { id: "weather", label: "Weather", Icon: Icon.Weather },
  { id: "packing", label: "Packing", Icon: Icon.Pack },
  { id: "stats", label: "Stats", Icon: Icon.Calendar },
];

export default function WardrobeApp() {
  const [page, setPage] = useState("wardrobe");
  const [items, setItems] = useState(MOCK_ITEMS);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleWear = async (id) => {
    await api.wearItem(id);
    setItems((prev) => prev.map((i) => i._id === id ? { ...i, wearCount: i.wearCount + 1, lastWorn: new Date().toISOString() } : i));
    showToast("Wear tracked! 👟");
  };

  const handleDelete = async (id) => {
    await api.deleteItem(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
    showToast("Item removed", "error");
  };

  const handleAdd = async (data) => {
    const item = await api.addItem(data);
    setItems((prev) => [...prev, item]);
    showToast("Item added to wardrobe! ✨");
  };

  return (
    <div className="app-root">
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">Wardrobe</div>
          <div className="sidebar-brand-sub">Smart Styling System</div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ id, label, Icon: NavIcon }) => (
            <button
              key={id}
              className={`nav-btn ${page === id ? "active" : ""}`}
              onClick={() => setPage(id)}
            >
              <NavIcon />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-footer-label">Wardrobe Size</div>
          <div className="sidebar-footer-count">{items.length}</div>
          <div className="sidebar-footer-sub">items in closet</div>
        </div>
      </div>

      <div className="main-content">
        {page === "wardrobe" && <WardrobePage items={items} onWear={handleWear} onDelete={handleDelete} onAdd={handleAdd} loading={loading} />}
        {page === "outfits" && <OutfitGeneratorPage items={items} />}
        {page === "weather" && <WeatherPage items={items} />}
        {page === "packing" && <PackingPage items={items} />}
        {page === "stats" && <StatsPage items={items} />}
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}