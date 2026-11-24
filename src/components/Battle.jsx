import { useState, useRef, useEffect } from 'react';
import { AVENGERS, VILLAINS, overallRating } from '../data';
import BattleMap from './BattleMap';
import CharacterAvatar from './CharacterAvatar';
import BattleAnalytics from './BattleAnalytics';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default function Battle({ team, missions = [], assignments = {}, initialMission, onBattleEnd }) {
  const preset = initialMission ? missions.find(m => m.id === initialMission) : null;
  const [villainName, setVillainName] = useState(preset?.villain || Object.keys(VILLAINS)[0]);
  const [missionId, setMissionId] = useState(initialMission || '');
  const [squad, setSquad] = useState(() => (preset ? (assignments[preset.id] || []).slice(0, 4) : []));
  const [battle, setBattle] = useState(null);
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState(null); // 'victory' | 'defeat' | null
  const [combatEffect, setCombatEffect] = useState(null); // { actor, target, type }
  const [analytics, setAnalytics] = useState([]);
  const logRef = useRef(null);

  const villain = VILLAINS[villainName];
  const selectedMission = missionId ? missions.find(m => m.id === missionId) : null;

  const resetEngagement = () => {
    setBattle(null);
    setLog([]);
    setOutcome(null);
    setCombatEffect(null);
    setAnalytics([]);
  };

  const selectMission = (id) => {
    setMissionId(id);
    resetEngagement();
    if (!id) return;
    const m = missions.find(x => x.id === id);
    if (!m) return;
    setVillainName(m.villain);
    setSquad((assignments[id] || []).slice(0, 4));
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const toggleSquad = (id) => {
    if (running) return;
    if (battle) resetEngagement();
    if (squad.includes(id)) setSquad(squad.filter(x => x !== id));
    else if (squad.length < 4) setSquad([...squad, id]);
  };

  const addLog = (msg, cls = '') => setLog(l => [...l, { msg, cls }]);

  const engage = async () => {
    if (squad.length === 0 || !villain) return;
    setRunning(true);
    setLog([]);
    setOutcome(null);
    setCombatEffect(null);
    setAnalytics([]);
    const heroes = squad.map(id => AVENGERS.find(a => a.id === id));
    const v = { ...villain, hp: villain.hp, maxHp: villain.hp };
    const hs = heroes.map(h => ({ ...h, hp: h.stats.durability, maxHp: h.stats.durability }));
    const metrics = [{
      round: 0,
      heroHp: hs.reduce((total, hero) => total + hero.hp, 0),
      villainHp: v.hp,
      heroDamage: 0,
      villainDamage: 0,
    }];
    setAnalytics([...metrics]);
    setBattle({ villain: v, heroes: hs, round: 0 });
    setCombatEffect({ actor: 'squad', target: 'villain', type: 'deploy' });

    addLog(`⚔ BATTLE INITIATED — ${heroes.map(h => h.name).join(', ')} VS ${villainName}`, 'sys');
    await sleep(600);

    let round = 0;
    const recordRound = () => {
      const heroHp = hs.reduce((total, hero) => total + Math.max(0, hero.hp), 0);
      const point = {
        round,
        heroHp,
        villainHp: v.hp,
        heroDamage: metrics[0].heroHp - heroHp,
        villainDamage: metrics[0].villainHp - v.hp,
      };
      const existing = metrics.findIndex(item => item.round === round);
      if (existing >= 0) metrics[existing] = point;
      else metrics.push(point);
      setAnalytics([...metrics]);
    };
    while (v.hp > 0 && hs.some(h => h.hp > 0) && round < 30) {
      round++;
      setBattle(b => ({ ...b, round }));
      addLog(`— ROUND ${round} —`, 'sys');

      // Heroes attack
      for (const h of hs) {
        if (h.hp <= 0 || v.hp <= 0) continue;
        const dmg = Math.max(2, Math.round(((h.stats.power + Math.random() * 30) / 10) * (1 + h.stats.strategy / 300)));
        v.hp = Math.max(0, v.hp - dmg);
        addLog(`${h.name} strikes for ${dmg} dmg`, 'hero');
        setCombatEffect({ actor: h.id, target: 'villain', type: 'hero-attack' });
        setBattle(b => ({ ...b, villain: { ...b.villain, hp: v.hp } }));
        await sleep(450);
      }
      if (v.hp <= 0) break;

      // Villain attacks a random living hero, weighted toward the weakest
      const alive = hs.filter(h => h.hp > 0);
      if (alive.length) {
        const target = alive[Math.floor(Math.random() * alive.length)];
        const dmg = Math.max(3, Math.round(v.power / 8 + Math.random() * 8));
        target.hp = Math.max(0, target.hp - dmg);
        addLog(`${villainName} hits ${target.name} for ${dmg} dmg`, 'villain');
        setCombatEffect({ actor: 'villain', target: target.id, type: 'villain-attack' });
        setBattle(b => ({
          ...b,
          heroes: b.heroes.map(x => x.id === target.id ? { ...x, hp: target.hp } : x),
        }));
        await sleep(450);
        recordRound();
      }
    }

    recordRound();
    const won = v.hp <= 0;
    if (missionId) onBattleEnd?.(missionId, won);
    setOutcome(won ? 'victory' : 'defeat');
    addLog(
      won
        ? `★ VICTORY — ${villainName} has been neutralized!`
        : `✖ DEFEAT — squad wiped out by ${villainName}. Reassign stronger assets.`,
      won ? 'win' : 'lose'
    );
    setRunning(false);
  };

  const heroPool = team.length ? team : AVENGERS.map(a => a.id);

  return (
    <div className={`battle ${combatEffect ? `effect-${combatEffect.type}` : ''}`}>
      <BattleMap mission={selectedMission} running={running} outcome={outcome} />

      <div className="hud-panel">
        <div className="panel-header">MISSION CONTEXT</div>
        <select
          className="mission-select"
          value={missionId}
          onChange={e => selectMission(e.target.value)}
          disabled={running}
        >
          <option value="">— CUSTOM ENGAGEMENT —</option>
          {missions.filter(m => m.status !== 'Completed').map(m => (
            <option key={m.id} value={m.id}>
              {m.codename} · {m.villain} · {(assignments[m.id] || []).length} units · {m.status}
            </option>
          ))}
        </select>
        {missionId && (
          <div className="mission-context-info">
            Deploying the units assigned to this operation. Adjust the squad below if needed.
          </div>
        )}
      </div>

      <div className="hud-panel">
        <div className="panel-header">SELECT HOSTILE TARGET</div>
        <div className="villain-select">
          {Object.entries(VILLAINS).map(([name, v]) => (
            <button
              key={name}
              className={`villain-btn ${villainName === name ? 'active' : ''}`}
              onClick={() => { setVillainName(name); resetEngagement(); }}
              disabled={running}
            >
              <div className="villain-card-copy">
                <div className="villain-name">{name}</div>
                <div className="villain-desc">{v.desc}</div>
                <div className="villain-stat">PWR {v.power} · HP {v.hp}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="hud-panel squad-setup">
        <div className="panel-header">DEPLOY SQUAD (MAX 4 — {squad.length} SELECTED)</div>
        <div className="squad-grid">
          {heroPool.map(id => {
            const h = AVENGERS.find(a => a.id === id);
            if (!h) return null;
            const sel = squad.includes(id);
            return (
              <button
                key={id}
                className={`squad-btn ${sel ? 'selected' : ''}`}
                style={{ '--hero-color': h.color }}
                onClick={() => toggleSquad(id)}
                disabled={running}
              >
                <CharacterAvatar hero={h} size="small" animate={battle && combatEffect?.actor === id} />
                <div className="squad-copy">
                  <div className="squad-name">{h.name}</div>
                  <div className="squad-pwr">{overallRating(h)} PWR</div>
                </div>
                {sel && <div className="squad-check">✓</div>}
              </button>
            );
          })}
        </div>
        <div className="engage-row">
          <button
            className="btn btn-engage"
            onClick={engage}
            disabled={running || squad.length === 0 || outcome !== null}
          >
            {running
              ? '⟳ BATTLE IN PROGRESS...'
              : outcome === 'victory'
                ? '✓ HOSTILE NEUTRALIZED'
                : outcome === 'defeat'
                  ? '✖ ENGAGEMENT FAILED'
                  : '⚔ ENGAGE'}
          </button>
          {outcome === 'defeat' && !running && (
            <button className="btn btn-small" onClick={resetEngagement}>
              ⟲ NEW ENGAGEMENT
            </button>
          )}
        </div>
        <div className="battle-hint">
          {team.length === 0
            ? 'No team assembled — showing default squad. Build a team in TEAM FORMATION.'
            : 'Using your assembled team. Pick a mission above to auto-load its assigned units.'}
        </div>
      </div>

      {battle && (
        <div className="hud-panel battle-arena">
          <div className="panel-header">LIVE COMBAT SIMULATION</div>

          {running && battle && (
            <div className="battle-clash" key={`${battle.round}-${log.length}`}>
              <div className="clash-side clash-village">
                <img src={`${import.meta.env.BASE_URL}battle/village.jpg`} alt="Village under attack" />
                <span className="clash-label">VILLAGE</span>
              </div>
              <div className="clash-impact"><span className="clash-star">✦</span></div>
              <div className="clash-side clash-avengers">
                <img src={`${import.meta.env.BASE_URL}battle/avengers.jpg`} alt="Avengers strike team" />
                <span className="clash-label">AVENGERS</span>
              </div>
            </div>
          )}

          <div className={`arena-villain ${combatEffect?.target === 'villain' ? 'target-hit' : ''}`}>
            <CharacterAvatar hero={{ id: villainName, name: villainName, color: '#ef4444' }} size="large" animate={battle && combatEffect?.target === 'villain'} />
            <div className="arena-name villain">{villainName}</div>
            <div className="hp-bar"><div className="hp-fill villain" style={{ width: `${(battle.villain.hp / battle.villain.maxHp) * 100}%` }} /></div>
            <div className="hp-text">{battle.villain.hp} / {battle.villain.maxHp} HP</div>
          </div>

          <div className="arena-squad">
            {battle.heroes.map(h => (
              <div key={h.id} className={`arena-hero ${combatEffect?.target === h.id ? 'target-hit' : ''}`} style={{ '--hero-color': h.color }}>
                <div className="arena-hero-header">
                  <CharacterAvatar hero={h} size="small" animate={battle && combatEffect?.target === h.id} />
                  <div className="arena-name">{h.name}</div>
                </div>
                <div className="hp-bar small"><div className="hp-fill hero" style={{ width: `${(h.hp / h.maxHp) * 100}%` }} /></div>
                <div className="hp-text">{Math.ceil(h.hp)} / {h.maxHp} HP</div>
              </div>
            ))}
          </div>

          <BattleAnalytics analytics={analytics} running={running} outcome={outcome} />

          <div className="battle-log" ref={logRef}>
            {log.map((l, i) => <div key={i} className={`log-line ${l.cls}`}>{l.msg}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}
