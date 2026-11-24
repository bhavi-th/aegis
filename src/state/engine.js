// AEGIS deterministic command engine.
// All state transitions are pure functions of (state, action) so every
// user action and scenario injection produces reproducible telemetry,
// alert and event-log updates.

export const PLAYBOOKS = [
  { id: 'ISOLATE', label: 'ISOLATE', desc: 'Sever node from network. Threat drops, readiness cost.' },
  { id: 'REROUTE', label: 'REROUTE', desc: 'Shift traffic to redundant paths. Restores latency.' },
  { id: 'CONTAIN', label: 'CONTAIN', desc: 'Seal the node. Eliminates threat, keeps it offline.' },
  { id: 'DIAGNOSE', label: 'DIAGNOSE', desc: 'Deep-scan and repair integrity.' },
  { id: 'ACKNOWLEDGE', label: 'ACKNOWLEDGE', desc: 'Acknowledge alert — log only, no mitigation.' },
];

export const NODES = [
  { id: 'n-core',    name: 'AEGIS CORE',            sector: 'COMMAND',     kind: 'CORE',     integrity: 99, load: 34, latency: 4,  threat: 0.0, status: 'NOMINAL' },
  { id: 'n-comms',   name: 'GLOBAL COMMS RELAY',    sector: 'COMMAND',     kind: 'RELAY',    integrity: 96, load: 41, latency: 12, threat: 0.0, status: 'NOMINAL' },
  { id: 'n-vault',   name: 'DATA VAULT · CHEYENNE', sector: 'DATA',        kind: 'VAULT',    integrity: 98, load: 22, latency: 8,  threat: 0.0, status: 'NOMINAL' },
  { id: 'n-sat',     name: 'SATELLITE UPLINK',      sector: 'DATA',        kind: 'UPLINK',   integrity: 94, load: 58, latency: 210, threat: 0.0, status: 'NOMINAL' },
  { id: 'n-power',   name: 'POWER GRID NODE',       sector: 'INFRA',       kind: 'POWER',    integrity: 97, load: 63, latency: 15, threat: 0.0, status: 'NOMINAL' },
  { id: 'n-array',   name: 'SURVEILLANCE ARRAY',    sector: 'INFRA',       kind: 'SENSOR',   integrity: 95, load: 47, latency: 19, threat: 0.0, status: 'NOMINAL' },
  { id: 'n-ops',     name: 'FIELD OPS NODE',        sector: 'FIELD',       kind: 'OPS',      integrity: 91, load: 38, latency: 44, threat: 0.0, status: 'NOMINAL' },
  { id: 'n-bio',     name: 'BIO/QUARANTINE LAB',    sector: 'FIELD',       kind: 'LAB',      integrity: 93, load: 29, latency: 26, threat: 0.0, status: 'NOMINAL' },
  { id: 'n-relay',   name: 'QUANTUM RELAY',         sector: 'NETWORK',     kind: 'RELAY',    integrity: 90, load: 52, latency: 88, threat: 0.0, status: 'NOMINAL' },
];

export const SCENARIOS = {
  nominal: {
    id: 'nominal',
    label: 'NOMINAL OPS',
    desc: 'Baseline posture — all nodes green, no active alerts.',
    build: () => ({
      clock: 0,
      nodes: NODES.map(n => ({ ...n })),
      alerts: [],
      events: [
        { kind: 'system', severity: 'INFO', target: 'AEGIS CORE', message: 'SYSTEM NOMINAL — all sectors reporting green', simTime: 0 },
        { kind: 'system', severity: 'INFO', target: 'SURVEILLANCE ARRAY', message: 'Perimeter sweep complete — no anomalies detected', simTime: 6 },
      ],
    }),
  },

  escalating: {
    id: 'escalating',
    label: 'ESCALATING ANOMALY',
    desc: 'Telemetry drift on uplink + power grid — warnings rising.',
    build: () => ({
      clock: 95,
      nodes: NODES.map(n => {
        if (n.id === 'n-sat')  return { ...n, status: 'DEGRADED', integrity: 71, load: 84, latency: 640, threat: 4.2 };
        if (n.id === 'n-power') return { ...n, status: 'DEGRADED', integrity: 82, load: 78, latency: 55, threat: 2.8 };
        if (n.id === 'n-relay') return { ...n, status: 'DEGRADED', integrity: 85, load: 66, latency: 190, threat: 2.1 };
        return { ...n };
      }),
      alerts: [
        { id: 'a-e1', title: 'SAT-LINK LATENCY SPIKE', severity: 'WARNING', nodeId: 'n-sat', playbook: 'DIAGNOSE', status: 'ACTIVE', detail: 'Uplink latency 640ms — 4σ above baseline. Possible atmospheric interference or spoofed handshake.', simTime: 60 },
        { id: 'a-e2', title: 'POWER GRID LOAD SURGE', severity: 'WARNING', nodeId: 'n-power', playbook: 'REROUTE', status: 'ACTIVE', detail: 'Draw exceeding thermal envelope by 22%. Reroute non-critical loads before brownout.', simTime: 78 },
        { id: 'a-e3', title: 'RELAY QUEUE SATURATION', severity: 'INFO', nodeId: 'n-relay', playbook: 'DIAGNOSE', status: 'ACTIVE', detail: 'Quantum relay buffers at 91%. Monitoring — no degradation confirmed.', simTime: 92 },
      ],
      events: [
        { kind: 'system', severity: 'INFO', target: 'SURVEILLANCE ARRAY', message: 'Baseline sweep complete — posture nominal', simTime: 0 },
        { kind: 'detect', severity: 'WARNING', target: 'SATELLITE UPLINK', message: 'Anomalous latency detected — 640ms vs 210ms baseline', simTime: 60 },
        { kind: 'detect', severity: 'WARNING', target: 'POWER GRID NODE', message: 'Load surge +22% over thermal envelope', simTime: 78 },
        { kind: 'detect', severity: 'INFO', target: 'QUANTUM RELAY', message: 'Queue depth rising — buffers at 91%', simTime: 92 },
        { kind: 'alert', severity: 'WARNING', target: 'AEGIS CORE', message: 'ALERTS RAISED — 3 anomalies require operator attention', simTime: 95 },
      ],
    }),
  },

  cascading: {
    id: 'cascading',
    label: 'CASCADING BREACH',
    desc: 'Coordinated intrusion — vault breach propagating through relay and grid.',
    build: () => ({
      clock: 210,
      nodes: NODES.map(n => {
        if (n.id === 'n-vault')  return { ...n, status: 'CRITICAL', integrity: 34, load: 96, latency: 320, threat: 9.4 };
        if (n.id === 'n-relay')  return { ...n, status: 'CRITICAL', integrity: 41, load: 97, latency: 740, threat: 8.6 };
        if (n.id === 'n-power')  return { ...n, status: 'CRITICAL', integrity: 48, load: 99, latency: 210, threat: 8.1 };
        if (n.id === 'n-sat')    return { ...n, status: 'DEGRADED', integrity: 62, load: 88, latency: 980, threat: 5.5 };
        if (n.id === 'n-comms')  return { ...n, status: 'DEGRADED', integrity: 66, load: 81, latency: 260, threat: 4.9 };
        if (n.id === 'n-array')  return { ...n, status: 'DEGRADED', integrity: 70, load: 74, latency: 140, threat: 3.2 };
        return { ...n };
      }),
      alerts: [
        { id: 'a-c1', title: 'VAULT BREACH — UNAUTHORIZED ACCESS', severity: 'EMERGENCY', nodeId: 'n-vault', playbook: 'CONTAIN', status: 'ACTIVE', detail: 'Encrypted shards exfiltrating. Attacker has root on vault controller. Seal immediately.', simTime: 120 },
        { id: 'a-c2', title: 'LATERAL MOVEMENT VIA QUANTUM RELAY', severity: 'CRITICAL', nodeId: 'n-relay', playbook: 'ISOLATE', status: 'ACTIVE', detail: 'Intrusion pivoting through relay fabric. Isolate to cut the attack path.', simTime: 155 },
        { id: 'a-c3', title: 'GRID INSTABILITY — CASCADE RISK', severity: 'CRITICAL', nodeId: 'n-power', playbook: 'REROUTE', status: 'ACTIVE', detail: 'Load shed failing. If grid node fails, vault + relay lose power mid-incident.', simTime: 180 },
        { id: 'a-c4', title: 'SAT-LINK DEGRADED — UPLINK SPOOF', severity: 'WARNING', nodeId: 'n-sat', playbook: 'DIAGNOSE', status: 'ACTIVE', detail: 'Handshake spoofing detected on satellite segment.', simTime: 195 },
        { id: 'a-c5', title: 'COMMS INTEGRITY COMPROMISED', severity: 'CRITICAL', nodeId: 'n-comms', playbook: 'CONTAIN', status: 'ACTIVE', detail: 'Relay traffic shows injected frames — possible disinformation channel.', simTime: 205 },
        { id: 'a-c6', title: 'SENSOR BLIND SPOTS EMERGING', severity: 'WARNING', nodeId: 'n-array', playbook: 'DIAGNOSE', status: 'ACTIVE', detail: 'Coverage gaps over sector FIELD — attacker may be masking movement.', simTime: 208 },
      ],
      events: [
        { kind: 'system', severity: 'INFO', target: 'AEGIS CORE', message: 'Routine posture check — all sectors nominal', simTime: 0 },
        { kind: 'detect', severity: 'WARNING', target: 'SURVEILLANCE ARRAY', message: 'Motion anomaly at vault perimeter — possible probe', simTime: 60 },
        { kind: 'detect', severity: 'CRITICAL', target: 'DATA VAULT · CHEYENNE', message: 'BREACH — vault controller root access obtained', simTime: 120 },
        { kind: 'detect', severity: 'CRITICAL', target: 'QUANTUM RELAY', message: 'Lateral movement detected — attacker traversing relay fabric', simTime: 155 },
        { kind: 'detect', severity: 'CRITICAL', target: 'POWER GRID NODE', message: 'Grid instability — load shed at 99%, cascade risk', simTime: 180 },
        { kind: 'detect', severity: 'WARNING', target: 'SATELLITE UPLINK', message: 'Uplink handshake spoofed — telemetry untrusted', simTime: 195 },
        { kind: 'detect', severity: 'CRITICAL', target: 'GLOBAL COMMS RELAY', message: 'Injected frames on comms — disinformation channel open', simTime: 205 },
        { kind: 'alert', severity: 'EMERGENCY', target: 'AEGIS CORE', message: 'CASCADING BREACH — 6 active alerts, containment required', simTime: 210 },
      ],
    }),
  },
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function applyPlaybook(node, playbook) {
  const n = { ...node };
  switch (playbook) {
    case 'ISOLATE':
      n.status = 'ISOLATED';
      n.integrity = clamp(n.integrity - 6, 5, 100);
      n.load = 0;
      n.threat = 0;
      n.latency = 0;
      break;
    case 'CONTAIN':
      n.status = 'CONTAINED';
      n.integrity = clamp(n.integrity - 4, 5, 100);
      n.load = 0;
      n.threat = 0;
      n.latency = 0;
      break;
    case 'REROUTE':
      n.status = n.integrity < 55 ? 'DEGRADED' : 'NOMINAL';
      n.load = clamp(n.load - 25, 5, 100);
      n.latency = clamp(Math.round(n.latency * 0.35), 2, 9999);
      n.threat = clamp(n.threat - 1.5, 0, 10);
      break;
    case 'DIAGNOSE':
      n.integrity = clamp(n.integrity + 14, 5, 100);
      n.load = clamp(n.load - 12, 5, 100);
      n.latency = clamp(Math.round(n.latency * 0.6), 2, 9999);
      n.threat = clamp(n.threat - 0.8, 0, 10);
      if (n.threat === 0 && n.integrity >= 80) n.status = 'NOMINAL';
      else if (n.status === 'NOMINAL' && n.integrity < 85) n.status = 'DEGRADED';
      break;
    default:
      break;
  }
  // a fully healed, unloaded node returns to nominal
  if (n.threat === 0 && n.integrity >= 90 && n.load < 70 && (n.status === 'DEGRADED' || n.status === 'CONTAINED')) {
    if (n.status === 'CONTAINED') { /* contained stays contained until reset */ }
    else n.status = 'NOMINAL';
  }
  return n;
}

function pushEvents(state, specs) {
  const events = [...state.events];
  let clock = state.clock;
  for (const s of specs) {
    events.push({
      id: `ev-${clock}-${events.length}`,
      seq: events.length + 1,
      simTime: s.simTime ?? clock,
      kind: s.kind || 'system',
      severity: s.severity || 'INFO',
      target: s.target || 'AEGIS CORE',
      message: s.message,
      mitigation: s.mitigation || null,
    });
    clock = Math.max(clock, (s.simTime ?? clock) + 6);
  }
  return { events, clock };
}

export function initialState() {
  const s = SCENARIOS.nominal.build();
  const { events, clock } = pushEvents({ events: [], clock: 0 }, s.events);
  return { clock, nodes: s.nodes, alerts: s.alerts, events, scenario: 'nominal', selected: null, notice: null };
}

export function engineReducer(state, action) {
  switch (action.type) {
    case 'SCENARIO': {
      const s = SCENARIOS[action.id].build();
      const { events, clock } = pushEvents({ events: [], clock: 0 }, s.events);
      return {
        clock,
        nodes: s.nodes,
        alerts: s.alerts,
        events,
        scenario: action.id,
        selected: null,
        notice: `SCENARIO INJECTED — ${SCENARIOS[action.id].label}`,
      };
    }

    case 'RESET':
      return { ...initialState(), notice: 'SYSTEM RESET — nominal posture restored' };

    case 'SELECT':
      return { ...state, selected: action.selected };

    case 'ACKNOWLEDGE': {
      const alert = state.alerts.find(a => a.id === action.alertId);
      if (!alert || alert.status !== 'ACTIVE') return state;
      const alerts = state.alerts.map(a => a.id === action.alertId ? { ...a, status: 'ACKNOWLEDGED' } : a);
      const { events, clock } = pushEvents(state, [{
        kind: 'mitigate', severity: 'INFO', target: alert.title,
        message: `Alert acknowledged by operator — ${alert.title}`,
        mitigation: 'ACKNOWLEDGE',
      }]);
      return { ...state, alerts, events, clock, notice: `ACKNOWLEDGED — ${alert.title}` };
    }

    case 'MITIGATE': {
      const { nodeId, alertId, playbook } = action;
      const node = state.nodes.find(n => n.id === nodeId);
      const alert = alertId ? state.alerts.find(a => a.id === alertId) : null;
      if (!node) return state;
      if (playbook === 'ACKNOWLEDGE') {
        if (!alert) return state;
        return engineReducer(state, { type: 'ACKNOWLEDGE', alertId: alert.id });
      }

      const wasCritical = node.status === 'CRITICAL';
      const updated = applyPlaybook(node, playbook);
      const nodes = state.nodes.map(n => n.id === nodeId ? updated : n);
      const alerts = alert
        ? state.alerts.map(a => a.id === alert.id ? { ...a, status: 'RESOLVED' } : a)
        : state.alerts;

      const eff = playbook === 'ISOLATE' ? 'node severed from network fabric'
        : playbook === 'CONTAIN' ? 'node sealed — threat eliminated'
        : playbook === 'REROUTE' ? 'traffic rerouted — load shed 25%'
        : 'deep diagnostic complete — integrity repaired';

      const { events, clock } = pushEvents(state, [{
        kind: 'mitigate',
        severity: wasCritical ? 'CRITICAL' : 'INFO',
        target: node.name,
        message: `${playbook} executed on ${node.name} — ${eff}`,
        mitigation: playbook,
      }]);

      const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;
      const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
      return {
        ...state,
        nodes,
        alerts,
        events,
        clock,
        selected: state.selected?.id === nodeId ? { type: 'node', id: nodeId } : state.selected,
        notice: `${playbook} → ${node.name}${alert ? ` · alert ${resolvedCount > 0 ? 'RESOLVED' : ''}` : ''} · ${activeCount} alert${activeCount === 1 ? '' : 's'} active`,
      };
    }

    default:
      return state;
  }
}

// ---- derived telemetry (pure, deterministic) ----

export function deriveMetrics(state) {
  const active = state.alerts.filter(a => a.status === 'ACTIVE');
  const criticalAlerts = active.filter(a => a.severity === 'CRITICAL' || a.severity === 'EMERGENCY');
  const nodes = state.nodes;
  const online = nodes.filter(n => n.status !== 'ISOLATED' && n.status !== 'CONTAINED');

  const threatIndex = clamp(
    active.reduce((acc, a) => {
      const w = a.severity === 'EMERGENCY' ? 3.2 : a.severity === 'CRITICAL' ? 2.4 : a.severity === 'WARNING' ? 1.4 : 0.6;
      return acc + w;
    }, 0) + nodes.reduce((acc, n) => acc + n.threat, 0) * 0.35,
    0, 10
  );

  const readiness = online.length === 0 ? 0 : clamp(
    online.reduce((acc, n) => acc + n.integrity * (1 - n.load / 250), 0) / online.length,
    0, 100
  );

  const systemStatus =
    criticalAlerts.length > 0 || threatIndex >= 7 ? 'CRITICAL' :
    active.some(a => a.severity === 'WARNING') || threatIndex >= 4 ? 'ELEVATED' :
    active.length > 0 ? 'GUARDED' : 'NOMINAL';

  return {
    threatIndex: threatIndex.toFixed(1),
    threatRaw: threatIndex,
    readiness: Math.round(readiness),
    activeAlerts: active.length,
    acknowledged: state.alerts.filter(a => a.status === 'ACKNOWLEDGED').length,
    resolved: state.alerts.filter(a => a.status === 'RESOLVED').length,
    isolated: nodes.filter(n => n.status === 'ISOLATED' || n.status === 'CONTAINED').length,
    degraded: nodes.filter(n => n.status === 'DEGRADED' || n.status === 'CRITICAL').length,
    systemStatus,
  };
}

export function fmtClock(simSec) {
  const m = Math.floor(simSec / 60);
  const s = simSec % 60;
  return `T+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---- incident brief export ----

export function buildIncidentBrief(state) {
  const m = deriveMetrics(state);
  const nodeById = Object.fromEntries(state.nodes.map(n => [n.id, n]));
  const L = [];
  L.push('# AEGIS // INCIDENT BRIEF');
  L.push(`Generated: ${new Date().toISOString()} · Scenario: ${SCENARIOS[state.scenario]?.label || state.scenario}`);
  L.push('');
  L.push('## System Status');
  L.push(`- Posture: **${m.systemStatus}**`);
  L.push(`- Threat index: **${m.threatIndex}** / 10`);
  L.push(`- Readiness: **${m.readiness}%**`);
  L.push(`- Active alerts: **${m.activeAlerts}** (${m.resolved} resolved, ${m.acknowledged} acknowledged)`);
  L.push(`- Nodes degraded/isolated: ${m.degraded + m.isolated} / ${state.nodes.length}`);
  L.push('');
  L.push('## Active / Recent Alerts');
  if (state.alerts.length === 0) L.push('_None._');
  for (const a of state.alerts) {
    const node = nodeById[a.nodeId];
    L.push(`- [${a.severity}/${a.status}] **${a.title}** — ${node ? node.name : 'network'} · playbook: ${a.playbook}`);
    L.push(`  - ${a.detail}`);
  }
  L.push('');
  L.push('## Node Posture');
  for (const n of state.nodes) {
    L.push(`- **${n.name}** (${n.sector}) — ${n.status} · integrity ${n.integrity}% · load ${n.load}% · threat ${n.threat.toFixed(1)}`);
  }
  L.push('');
  L.push('## Event Timeline');
  for (const e of state.events) {
    L.push(`- ${fmtClock(e.simTime)} · [${e.severity}] ${e.target}: ${e.message}${e.mitigation ? ` _(mitigation: ${e.mitigation})_` : ''}`);
  }
  return L.join('\n');
}
