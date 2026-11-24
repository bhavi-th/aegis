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

export default function Dashboard({ missions, team, assignMission, onSelectMission }) {
  const activeThreats = missions.filter(m => m.status !== 'Completed');
  const threatLevel = activeThreats.length
    ? activeThreats.reduce((acc, m) => acc + m.threatValue, 0) / activeThreats.length
    : 0;
  const activeMissions = missions.filter(m => m.status === 'In Progress');
  const completed = missions.filter(m => m.status === 'Completed');
  const globalThreat = threatLevel === 0 ? 'SECURE' : threatLevel > 8 ? 'CRITICAL' : threatLevel > 6 ? 'ELEVATED' : 'GUARDED';

  return (
    <div className="dashboard">
      <div className="hud-row">
        <div className="hud-card threat-card">
          <div className="hud-label">GLOBAL THREAT INDEX</div>
          <div className={`threat-value ${globalThreat.toLowerCase()}`}>
            {threatLevel.toFixed(1)}
          </div>
          <div className="threat-sub">{globalThreat} {threatLevel === 0 ? '— ALL THREATS NEUTRALIZED' : 'DEFCON LEVEL'}</div>
          <div className="threat-gauge">
            <div className="gauge-fill" style={{ width: `${threatLevel * 10}%` }} />
          </div>
        </div>

        <div className="hud-card">
          <div className="hud-label">ACTIVE OPERATIONS</div>
          <div className="hud-big">{activeMissions.length}</div>
          <div className="hud-sub">missions in progress</div>
        </div>

        <div className="hud-card">
          <div className="hud-label">AVENGERS ASSEMBLED</div>
          <div className="hud-big">{team.length}<span className="hud-dim"> / {AVENGERS.length}</span></div>
          <div className="hud-sub">heroes available for deployment</div>
        </div>

        <div className="hud-card">
          <div className="hud-label">MISSIONS COMPLETED</div>
          <div className="hud-big">{completed.length}<span className="hud-dim"> / {missions.length}</span></div>
          <div className="hud-sub">threats neutralized</div>
        </div>
      </div>

      <div className="hud-grid">
        <div className="hud-panel">
          <div className="panel-header">TOP THREATS — PRIORITY QUEUE</div>
          {missions
            .slice()
            .sort((a, b) => b.threatValue - a.threatValue)
            .map(m => (
              <div key={m.id} className="threat-row clickable" onClick={onSelectMission} title="View in Mission Control">
                <div className="threat-info">
                  <div className="threat-name">{m.codename}</div>
                  <div className="threat-loc">{m.location}</div>
                </div>
                <div className="threat-meta">
                  <span className={`badge threat-${m.threatLevel.toLowerCase()}`}>{m.threatLevel}</span>
                  <span className={`status-badge status-${m.status.replace(' ', '-').toLowerCase()}`}>{m.status}</span>
                </div>
                <div className="threat-power">{m.threatValue.toFixed(1)}</div>
              </div>
            ))}
        </div>

        <div className="hud-panel">
          <div className="panel-header">QUICK DEPLOYMENT</div>
          {AVENGERS.slice(0, 6).map(h => (
            <div key={h.id} className="deploy-row">
              <div className="deploy-dot" style={{ background: h.color }} />
              <div className="deploy-name">{h.name}</div>
              <div className="deploy-stats">
                <StatBar label="PWR" value={h.stats.power} color={h.color} />
                <StatBar label="SPD" value={h.stats.speed} color={h.color} />
              </div>
              <button
                className={`btn btn-small ${team.includes(h.id) ? 'btn-enlisted' : ''}`}
                onClick={() => assignMission(h.id)}
              >
                {team.includes(h.id) ? '✓ ENLISTED' : 'ENLIST'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
