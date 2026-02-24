import { useState } from 'react';
import { CITIES } from '../services/api';
import './CitySearch.css';

export default function CitySearch({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = CITIES.find((c) => c.name === value?.name) || value || CITIES[0];

  const handleSelect = (city) => {
    onChange?.(city);
    setOpen(false);
  };

  return (
    <div className="city-search">
      <button
        type="button"
        className="city-search-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="city-search-label">Location</span>
        <span className="city-search-value">{selected?.name ?? 'Select city'}</span>
      </button>
      {open && (
        <ul className="city-search-dropdown">
          {CITIES.map((c) => (
            <li key={c.name}>
              <button
                type="button"
                onClick={() => handleSelect(c)}
                className={selected?.name === c.name ? 'active' : ''}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
