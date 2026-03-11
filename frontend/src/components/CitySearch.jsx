import { CITIES } from '../services/api';
import './CitySearch.css';

const CITY_ICONS = ['🏙️', '🌆', '🌇', '🏛️', '🌃'];

export default function CitySearch({ value, onChange }) {
  return (
    <div className="city-search">
      <span className="city-search-label">City</span>
      {CITIES.map((city, i) => (
        <button
          key={city.name}
          className={`city-pill${value?.name === city.name ? ' active' : ''}`}
          onClick={() => onChange(city)}
        >
          <span>{CITY_ICONS[i % CITY_ICONS.length]}</span>
          {city.name}
        </button>
      ))}
    </div>
  );
}
