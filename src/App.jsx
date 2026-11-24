import { useState, useEffect } from 'react';
import { AVENGERS, MISSIONS } from './data';
import Dashboard from './components/Dashboard';
import Database from './components/Database';
import TeamBuilder from './components/TeamBuilder';
import MissionControl from './components/MissionControl';
import Battle from './components/Battle';

const TABS = [
  { id: 'dashboard', label: 'COMMAND', icon: '◈' },
  { id: 'database', label: 'AVENGERS DB', icon: '◉' },
  { id: 'team', label: 'TEAM FORMATION', icon: '⬡' },
  { id: 'missions', label: 'MISSION CONTROL', icon: '◎' },
  { id: 'battle', label: 'BATTLE SIM', icon: '⚔' },
];

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [missions, setMissions] = useState(() => {
    const saved = load('aegis-missions', null);
    if (!saved) return MISSIONS;
    // merge saved statuses onto the canonical mission data
    return MISSIONS.map(m => ({ ...m, status: saved.find(s => s.id === m.id)?.status || 'Pending' }));
  });
  const [team, setTeam] = useState(() => load('aegis-team', []));
  const [assignments, setAssignments] = useState(() => load('aegis-assignments', {}));
  const [clock, setClock] = useState(new Date());
  const [battlePreset, setBattlePreset] = useState(null);

  // page background image per tab
  useEffect(() => {
    document.body.classList.toggle('bg-home', tab === 'dashboard');
    document.body.classList.toggle('bg-other', tab !== 'dashboard');
  }, [tab]);

  // live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // persist state
  useEffect(() => { localStorage.setItem('aegis-missions', JSON.stringify(missions)); }, [missions]);
  useEffect(() => { localStorage.setItem('aegis-team', JSON.stringify(team)); }, [team]);
  useEffect(() => { localStorage.setItem('aegis-assignments', JSON.stringify(assignments)); }, [assignments]);

  const toggleHero = (id) => {
    setTeam(t => {
      if (t.includes(id)) {
        // removing a hero also unassigns them from every mission
        setAssignments(a => Object.fromEntries(
          Object.entries(a).map(([m, ids]) => [m, ids.filter(x => x !== id)])
        ));
        return t.filter(x => x !== id);
      }
      return [...t, id];
    });
  };

  // deploy the assembled team to a mission: heroes are assigned, team resets to 0,
  // mission goes In Progress and the battle sim opens
  const deployTeam = (missionId) => {
    if (team.length < 4) return;
    setAssignments(a => ({ ...a, [missionId]: team.slice(0, 4) }));
    setTeam([]);
    setMissions(ms => ms.map(m => m.id === missionId && m.status === 'Pending' ? { ...m, status: 'In Progress' } : m));
    setBattlePreset(missionId);
    setTab('battle');
  };

  // reopen the battle sim for an operation already in progress
  const resumeMission = (missionId) => {
    setBattlePreset(missionId);
    setTab('battle');
  };

  // battle concluded: deployed heroes stand down and become available again
  const handleBattleEnd = (missionId, won) => {
    if (!missionId) return;
    setAssignments(a => ({ ...a, [missionId]: [] }));
    setMissions(ms => ms.map(m => {
      if (m.id !== missionId) return m;
      if (won) return m.status === 'Completed' ? m : { ...m, status: 'Completed' };
      return m.status === 'In Progress' ? { ...m, status: 'Pending' } : m;
    }));
  };

  // quick deploy from dashboard: add hero to the assembly pool
  const quickDeploy = (heroId) => {
    setTeam(t => t.includes(heroId) ? t : [...t, heroId]);
  };

  const resetSystem = () => {
    localStorage.removeItem('aegis-missions');
    localStorage.removeItem('aegis-team');
    localStorage.removeItem('aegis-assignments');
    setMissions(MISSIONS);
    setTeam([]);
    setAssignments({});
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          <span className="logo-emblem" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
              <path d="M12 2 4.5 5v6c0 4.6 3.2 8 7.5 10 4.3-2 7.5-5.4 7.5-10V5L12 2Z" />
              <path d="m8.8 11.8 2.2 2.2 4.2-4.4" />
            </svg>
          </span>
          <div>
            <div className="logo-title">S.H.I.E.L.D.</div>
            <div className="logo-sub">STRATEGIC HOMELAND INTERVENTION · ENFORCEMENT &amp; LOGISTICS</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="clock">{clock.toLocaleTimeString()} UTC</div>
          <div className="clearance">LEVEL 10 CLEARANCE</div>
          <button className="btn btn-small btn-reset" onClick={resetSystem}>⟲ RESET SYSTEM</button>
        </div>
      </header>

      <nav className="navbar">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <span className="nav-icon">{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'dashboard' && (
          <Dashboard missions={missions} team={team} assignMission={quickDeploy} onSelectMission={() => setTab('missions')} />
        )}
        {tab === 'database' && <Database team={team} onToggleHero={toggleHero} />}
        {tab === 'team' && (
          <TeamBuilder
            missions={missions}
            team={team}
            toggleHero={toggleHero}
            launchMission={deployTeam}
          />
        )}
        {tab === 'missions' && (
          <MissionControl
            missions={missions}
            assignments={assignments}
            team={team}
            onLaunch={deployTeam}
            onResume={resumeMission}
          />
        )}
        {tab === 'battle' && (
          <Battle
            key={battlePreset || 'custom'}
            team={team}
            missions={missions}
            assignments={assignments}
            initialMission={battlePreset}
            onBattleEnd={handleBattleEnd}
          />
        )}
      </main>

      <footer className="footer">
        <span>AEGIS COMMAND SYSTEM v3.7</span>
        <span>CLASSIFIED // EYES ONLY</span>
        <span>{AVENGERS.length} HEROES INDEXED · {missions.filter(m => m.status !== 'Completed').length} ACTIVE THREATS</span>
      </footer>
    </div>
  );
}
