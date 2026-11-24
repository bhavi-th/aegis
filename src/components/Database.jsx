import { useState } from 'react';
import { AVENGERS, overallRating } from '../data';

function StatBar({ label, value, color }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <div className="stat-bar">
        <div className="stat-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="stat-val">{value}</span>
    </div>
  );
}

export default function Database({ team = [], onToggleHero }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('All');

  const roles = ['All', ...new Set(AVENGERS.map(a => a.role))];
  const filtered = filter === 'All' ? AVENGERS : AVENGERS.filter(a => a.role === filter);

  return (
    <div className="database">
      <div className="db-filters">
        {roles.map(r => (
          <button
            key={r}
            className={`filter-btn ${filter === r ? 'active' : ''}`}
            onClick={() => setFilter(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="db-grid">
        {filtered.map((h, i) => (
          <div
            key={h.id}
            className={`db-card ${selected?.id === h.id ? 'selected' : ''}`}
            onClick={() => setSelected(h)}
            style={{ '--hero-color': h.color }}
          >
            <div className="db-card-media">
              <img className="db-card-img" src={h.image} alt={h.name} loading="lazy" />
              <div className="db-card-shade" />
              <div className="db-card-media-top">
                <span className="db-file-no">FILE {String(i + 1).padStart(2, '0')} / {String(filtered.length).padStart(2, '0')}</span>
                <span className="db-team-tag">{h.team}</span>
              </div>
              <div className="db-card-media-info">
                <div className="db-name">{h.name}</div>
                <div className="db-alias">{h.alias}</div>
              </div>
            </div>
            <div className="db-card-body">
              <div className="db-role">{h.role}</div>
              <div className="db-stats-mini">
                <StatBar label="PWR" value={h.stats.power} color={h.color} />
                <StatBar label="SPD" value={h.stats.speed} color={h.color} />
              </div>
              <div className="db-card-foot">
                <span className="db-foot-label">AEGIS // DOSSIER</span>
                <span className="db-foot-rating">{overallRating(h)}<i>/100</i></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="db-detail overlay" onClick={() => setSelected(null)}>
          <div className="db-detail-card" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelected(null)}>✕</button>
            <div className="db-detail-media" style={{ '--hero-color': selected.color }}>
              <img className="db-detail-img" src={selected.image} alt={selected.name} />
              <div className="db-detail-shade" />
              <div className="db-detail-media-info">
                <span className="db-file-no">AEGIS // AVENGERS DB</span>
                <h2>{selected.name}</h2>
                <div className="db-alias">{selected.alias}</div>
                <div className="db-role">{selected.role}</div>
              </div>
            </div>
            <p className="db-bio">{selected.bio}</p>
            <div className="db-stats-full">
              <StatBar label="POWER" value={selected.stats.power} color={selected.color} />
              <StatBar label="SPEED" value={selected.stats.speed} color={selected.color} />
              <StatBar label="DURABILITY" value={selected.stats.durability} color={selected.color} />
              <StatBar label="STRATEGY" value={selected.stats.strategy} color={selected.color} />
            </div>
            <div className="panel-header">ABILITIES & EQUIPMENT</div>
            <div className="ability-list">
              {selected.abilities.map(a => (
                <span key={a} className="ability-chip">{a}</span>
              ))}
            </div>
            {onToggleHero && (
              <button
                className={`btn enlist-btn ${team.includes(selected.id) ? 'btn-enlisted' : ''}`}
                onClick={() => onToggleHero(selected.id)}
              >
                {team.includes(selected.id) ? '✓ ENLISTED — TAP TO REMOVE' : '＋ ENLIST IN TEAM'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
