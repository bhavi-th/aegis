import { AVENGERS, overallRating } from '../data';
import CharacterAvatar from './CharacterAvatar';

export default function TeamBuilder({ missions, team, toggleHero, launchMission }) {
  const minMet = team.length >= 4;

  const teamRating = team.length
    ? team.reduce((acc, id) => acc + overallRating(AVENGERS.find(a => a.id === id)), 0) / team.length
    : 0;

  return (
    <div className="team-builder">
      <div className="hud-warning" style={{ opacity: minMet ? 0 : 1 }}>
        {minMet
          ? `TEAM READY — ${team.length} AVENGERS ASSEMBLED`
          : `⚠ INSUFFICIENT FORCE — SELECT AT LEAST 4 AVENGERS (${team.length}/4)`}
      </div>

      <div className="team-layout">
        <div className="hud-panel">
          <div className="panel-header">SELECT TEAM ({team.length}/{AVENGERS.length})</div>
          <div className="select-grid">
            {AVENGERS.map(h => {
              const inTeam = team.includes(h.id);
              return (
                <button
                  key={h.id}
                  className={`select-card ${inTeam ? 'in-team' : ''}`}
                  onClick={() => toggleHero(h.id)}
                  style={{ '--hero-color': h.color }}
                >
                  <div className="select-avatar-row">
                    <CharacterAvatar hero={h} size="small" />
                    <div>
                      <div className="select-name">{h.name}</div>
                      <div className="select-role">{h.role} · PWR {overallRating(h)}</div>
                    </div>
                  </div>
                  {inTeam && <div className="select-check">✓</div>}
                </button>
              );
            })}
          </div>
          <div className="team-slots">
            {[0, 1, 2, 3, 4, 5].map(i => {
              const h = AVENGERS.find(a => a.id === team[i]);
              return (
                <div key={i} className={`team-slot ${h ? 'filled' : ''}`} style={h ? { borderColor: h.color } : {}}>
                  {h ? (
                    <>
                      <span className="slot-name" style={{ color: h.color }}>{h.name}</span>
                      <span className="slot-role">{h.role} · {overallRating(h)} PWR</span>
                    </>
                  ) : (
                    <span className="slot-empty">SLOT {i + 1} — VACANT</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="hud-panel">
          <div className="panel-header">MISSION SELECTION — CHOOSE TASK TO ENGAGE</div>
          {missions.map(m => {
            const enoughHeroes = team.length >= 4;
            const enoughPower = teamRating >= m.requiredPower;
            const canLaunch = enoughHeroes && enoughPower && m.status === 'Pending';

            return (
              <div key={m.id} className="alloc-mission">
                <div className="alloc-head">
                  <div>
                    <div className="alloc-codename">{m.codename}</div>
                    <div className="alloc-meta">
                      {m.location} · <span className={`badge threat-${m.threatLevel.toLowerCase()}`}>{m.threatLevel}</span> · {m.status}
                    </div>
                  </div>
                  <div className="alloc-threat">{m.threatValue.toFixed(1)}</div>
                </div>
                <div className="alloc-actions" style={{ marginTop: 10 }}>
                  <div className="alloc-checks">
                    <span className={`check ${enoughHeroes ? 'ok' : 'fail'}`}>
                      {team.length}/4 UNITS
                    </span>
                    <span className={`check ${enoughPower ? 'ok' : 'fail'}`}>
                      PWR {teamRating.toFixed(0)}/{m.requiredPower}
                    </span>
                  </div>
                  <button
                    className={`btn btn-launch ${m.status === 'Completed' ? 'btn-done' : ''}`}
                    disabled={!canLaunch}
                    onClick={() => launchMission(m.id)}
                  >
                    {m.status === 'Pending'
                      ? '▶ LAUNCH OPERATION'
                      : m.status === 'In Progress'
                        ? '⟳ OPERATION ACTIVE'
                        : '✓ NEUTRALIZED'}
                  </button>
                </div>
              </div>
            );
          })}
          <div className="battle-hint">
            Assemble 4+ Avengers, then launch any eligible operation. Your squad deploys to that mission and the selection resets — heroes return once the battle ends.
          </div>
        </div>
      </div>
    </div>
  );
}
