import { useState } from 'react';
import { AVENGERS } from '../data';

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
        {filtered.map(h => (
          <div
            key={h.id}
            className={`db-card ${selected?.id === h.id ? 'selected' : ''}`}
            onClick={() => setSelected(h)}
            style={{ '--hero-color': h.color }}
          >
            <div className="db-card-header">
              <div className="db-portrait" style={{ background: `linear-gradient(135deg, ${h.color}33, ${h.color}11)` }}>
                <span className="db-initial">{h.name.split(' ').map(w => w[0]).join('')}</span>
              </div>
              <div>
                <div className="db-name">{h.name}</div>
                <div className="db-alias">{h.alias}</div>
              </div>
            </div>
            <div className="db-role">{h.role}</div>
            <div className="db-stats-mini">
              <StatBar label="PWR" value={h.stats.power} color={h.color} />
              <StatBar label="SPD" value={h.stats.speed} color={h.color} />
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="db-detail overlay" onClick={() => setSelected(null)}>
          <div className="db-detail-card" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelected(null)}>✕</button>
            <div className="db-detail-header" style={{ borderColor: selected.color }}>
              <div className="db-portrait large" style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}44)` }}>
                <span>{selected.name.split(' ').map(w => w[0]).join('')}</span>
              </div>
              <div>
                <h2 style={{ color: selected.color }}>{selected.name}</h2>
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
