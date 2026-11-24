import { useState } from 'react';
import { STATUSES, AVENGERS, overallRating } from '../data';

export default function MissionControl({ missions, assignments, team, onLaunch, onResume }) {
  const [filter, setFilter] = useState('Active');

  const teamRating = team.length
    ? team.reduce((acc, id) => acc + overallRating(AVENGERS.find(a => a.id === id)), 0) / team.length
    : 0;
  const squadReady = team.length >= 4 && teamRating > 0;

  const filtered = filter === 'All'
    ? missions
    : filter === 'Active'
      ? missions.filter(m => m.status !== 'Completed')
      : missions.filter(m => m.status === filter);

  return (
    <div className="missions">
      <div className="db-filters">
        {['Active', ...STATUSES, 'All'].map(s => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mission-cards">
        {filtered.map(m => {
          const assigned = (assignments[m.id] || []).map(id => AVENGERS.find(a => a.id === id)).filter(Boolean);
          return (
            <div key={m.id} className={`mission-card threat-${m.threatLevel.toLowerCase()} status-${m.status.replace(' ', '-').toLowerCase()}`}>
              <div className="mission-card-top">
                <div>
                  <div className="mission-codename">{m.codename}</div>
                  <div className="mission-location">📍 {m.location}</div>
                </div>
                <div className="mission-threat">
                  <div className="threat-num">{m.threatValue.toFixed(1)}</div>
                  <div className="threat-label">THREAT</div>
                </div>
              </div>

              <div className="mission-body">
                <p className="mission-desc">{m.description}</p>
                <div className="mission-villain">
                  <span className="villain-tag">HOSTILE: {m.villain}</span>
                  <span className="power-req">REQ. POWER ≥ {m.requiredPower}</span>
                </div>

                <div className="mission-assigned">
                  <div className="panel-header" style={{ margin: '10px 0 6px' }}>DEPLOYED UNITS ({assigned.length})</div>
                  {assigned.length === 0 ? (
                    <div className="alloc-empty">No units assigned — allocate heroes in TEAM FORMATION</div>
                  ) : (
                    <div className="assigned-chips">
                      {assigned.map(h => (
                        <span key={h.id} className="assigned-chip" style={{ borderColor: h.color, color: h.color }}>
                          {h.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mission-progress">
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: m.status === 'Completed' ? '100%' : m.status === 'In Progress' ? '55%' : '10%' }}
                    />
                  </div>
                  <span className={`status-badge status-${m.status.replace(' ', '-').toLowerCase()}`}>{m.status}</span>
                </div>

                <div className="mission-actions">
                  {m.status === 'Completed' ? (
                    <button className="btn btn-status btn-done" disabled>
                      ✓ NEUTRALIZED
                    </button>
                  ) : m.status === 'In Progress' ? (
                    <button className="btn btn-simulate" onClick={() => onResume?.(m.id)}>
                      ⚔ RESUME ENGAGEMENT
                    </button>
                  ) : (
                    <button
                      className="btn btn-status"
                      onClick={() => onLaunch?.(m.id)}
                      disabled={!squadReady || teamRating < m.requiredPower}
                      title={!squadReady
                        ? 'Assemble at least 4 Avengers in TEAM FORMATION first'
                        : teamRating < m.requiredPower
                          ? `Squad power ${teamRating.toFixed(0)} below required ${m.requiredPower}`
                          : 'Deploy squad — battle simulator will open'}
                    >
                      ▶ LAUNCH OPERATION
                    </button>
                  )}
                  {m.status === 'Pending' && !squadReady && (
                    <span className="alloc-empty" style={{ alignSelf: 'center' }}>
                      {team.length}/4 units assembled
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
