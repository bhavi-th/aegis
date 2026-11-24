import { useMemo, useState } from 'react';
import { SCENARIOS, PLAYBOOKS, fmtClock, buildIncidentBrief } from '../state/engine';

const SEV_CLASS = { INFO: 'info', WARNING: 'warning', CRITICAL: 'critical', EMERGENCY: 'emergency' };
const NODE_STATUS_CLASS = {
  NOMINAL: 'nominal', DEGRADED: 'degraded', CRITICAL: 'critical',
  ISOLATED: 'isolated', CONTAINED: 'contained',
};

function TelemetryStrip({ metrics, state }) {
  const cards = [
    { label: 'SYSTEM POSTURE', value: metrics.systemStatus, cls: metrics.systemStatus.toLowerCase() },
    { label: 'THREAT INDEX', value: metrics.threatIndex, cls: metrics.threatRaw >= 7 ? 'critical' : metrics.threatRaw >= 4 ? 'elevated' : metrics.threatRaw > 0 ? 'guarded' : 'secure' },
    { label: 'READINESS', value: `${metrics.readiness}%`, cls: metrics.readiness < 60 ? 'critical' : metrics.readiness < 85 ? 'elevated' : 'secure' },
    { label: 'ACTIVE ALERTS', value: String(metrics.activeAlerts), cls: metrics.activeAlerts > 2 ? 'critical' : metrics.activeAlerts > 0 ? 'elevated' : 'secure' },
    { label: 'NODES ISOLATED', value: String(metrics.isolated), cls: metrics.isolated > 0 ? 'elevated' : 'secure' },
    { label: 'SIM CLOCK', value: fmtClock(state.clock), cls: '' },
  ];
  return (
    <div className="telemetry-strip">
      {cards.map(c => (
        <div key={c.label} className="telemetry-cell">
          <div className="telemetry-label">{c.label}</div>
          <div className={`telemetry-value ${c.cls}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function NodeCard({ node, selected, onSelect }) {
  const linked = node.status !== 'NOMINAL' || node.threat > 0;
  return (
    <button
      className={`node-card node-${NODE_STATUS_CLASS[node.status]} ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(node)}
    >
      <div className="node-top">
        <span className="node-kind">{node.kind}</span>
        <span className={`node-status st-${NODE_STATUS_CLASS[node.status]}`}>{node.status}</span>
      </div>
      <div className="node-name">{node.name}</div>
      <div className="node-sector">{node.sector}</div>
      <div className="node-meters">
        <div className="node-meter">
          <span className="node-meter-label">INT</span>
          <div className="node-meter-track"><div className="node-meter-fill" style={{ width: `${node.integrity}%` }} /></div>
          <span className="node-meter-val">{node.integrity}</span>
        </div>
        <div className="node-meter">
          <span className="node-meter-label">LD</span>
          <div className="node-meter-track"><div className="node-meter-fill load" style={{ width: `${node.load}%` }} /></div>
          <span className="node-meter-val">{node.load}</span>
        </div>
        <div className="node-meter">
          <span className="node-meter-label">MS</span>
          <div className="node-meter-track"><div className="node-meter-fill lat" style={{ width: `${Math.min(100, node.latency / 10)}%` }} /></div>
          <span className="node-meter-val">{node.latency}</span>
        </div>
      </div>
      {node.threat > 0 && <div className="node-threat">THREAT {node.threat.toFixed(1)}</div>}
      {!linked && <div className="node-threat nominal-tag">SECURE</div>}
    </button>
  );
}

function AlertRow({ alert, node, selected, onSelect }) {
  return (
    <button
      className={`alert-row sev-${SEV_CLASS[alert.severity]} ${alert.status !== 'ACTIVE' ? 'alert-done' : ''} ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(alert, node)}
    >
      <span className={`alert-sev sev-${SEV_CLASS[alert.severity]}`}>{alert.severity}</span>
      <span className="alert-body">
        <span className="alert-title">{alert.title}</span>
        <span className="alert-sub">{node?.name || 'NETWORK'} · {alert.status}</span>
      </span>
      <span className={`alert-status as-${alert.status.toLowerCase()}`}>{alert.status}</span>
    </button>
  );
}

function Inspector({ engine }) {
  const { state, acknowledge, mitigate } = engine;
  const sel = state.selected;
  if (!sel) {
    return (
      <div className="inspector empty">
        <div className="panel-header">CONTEXTUAL INSPECTOR</div>
        <div className="inspector-hint">
          Select a node or alert on the tactical canvas to inspect posture and execute response playbooks.
        </div>
      </div>
    );
  }

  const node = state.nodes.find(n => n.id === sel.id) ||
    (sel.type === 'alert' ? state.nodes.find(n => n.id === state.alerts.find(a => a.id === sel.id)?.nodeId) : null);
  const alert = sel.type === 'alert' ? state.alerts.find(a => a.id === sel.id) : null;

  if (!node && !alert) {
    return (
      <div className="inspector empty">
        <div className="panel-header">CONTEXTUAL INSPECTOR</div>
        <div className="inspector-hint">Selection no longer exists — it may have been resolved.</div>
      </div>
    );
  }

  const nodeAlerts = node ? state.alerts.filter(a => a.nodeId === node.id) : [];
  const activeNodeAlert = nodeAlerts.find(a => a.status === 'ACTIVE');
  const terminal = node && (node.status === 'ISOLATED' || node.status === 'CONTAINED');

  return (
    <div className="inspector">
      <div className="panel-header">CONTEXTUAL INSPECTOR</div>

      {alert && (
        <div className="insp-block">
          <div className="insp-kind">ALERT · {alert.severity}</div>
          <div className="insp-title">{alert.title}</div>
          <div className="insp-detail">{alert.detail}</div>
          <div className="insp-row"><span>STATUS</span><b className={`as-${alert.status.toLowerCase()}`}>{alert.status}</b></div>
          <div className="insp-row"><span>DETECTED</span><b>{fmtClock(alert.simTime)}</b></div>
          <div className="insp-row"><span>PLAYBOOK</span><b>{alert.playbook}</b></div>
        </div>
      )}

      {node && (
        <div className="insp-block">
          <div className="insp-kind">NODE · {node.kind} — {node.sector}</div>
          <div className="insp-title">{node.name}</div>
          <div className="insp-grid">
            <div className="insp-row"><span>STATUS</span><b className={`st-${NODE_STATUS_CLASS[node.status]}`}>{node.status}</b></div>
            <div className="insp-row"><span>INTEGRITY</span><b>{node.integrity}%</b></div>
            <div className="insp-row"><span>LOAD</span><b>{node.load}%</b></div>
            <div className="insp-row"><span>LATENCY</span><b>{node.latency}ms</b></div>
            <div className="insp-row"><span>THREAT</span><b>{node.threat.toFixed(1)}</b></div>
          </div>
          {nodeAlerts.length > 0 && (
            <div className="insp-alerts">
              {nodeAlerts.map(a => (
                <div key={a.id} className={`insp-alert as-${a.status.toLowerCase()}`}>
                  {a.title} — {a.status}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {alert?.status === 'ACTIVE' && node && (
        <div className="insp-actions">
          <div className="panel-header" style={{ margin: '4px 0 8px' }}>RESPONSE PLAYBOOKS</div>
          {PLAYBOOKS.map(p => (
            <button
              key={p.id}
              className={`btn btn-playbook pb-${p.id.toLowerCase()} ${p.id === alert.playbook ? 'pb-recommended' : ''}`}
              disabled={p.id === 'ACKNOWLEDGE' ? false : terminal}
              title={p.desc}
              onClick={() => p.id === 'ACKNOWLEDGE'
                ? acknowledge(alert.id)
                : mitigate(node.id, p.id, alert.id)}
            >
              {p.id === 'ACKNOWLEDGE' ? '◦' : '▸'} {p.id}
              {p.id === alert.playbook ? ' ★' : ''}
            </button>
          ))}
          <div className="playbook-hint">★ = recommended for this alert</div>
        </div>
      )}

      {!alert && node && !terminal && (
        <div className="insp-actions">
          <div className="panel-header" style={{ margin: '4px 0 8px' }}>NODE RESPONSE</div>
          {PLAYBOOKS.filter(p => p.id !== 'ACKNOWLEDGE').map(p => (
            <button
              key={p.id}
              className={`btn btn-playbook pb-${p.id.toLowerCase()}`}
              disabled={node.status === 'NOMINAL' && (p.id === 'ISOLATE' || p.id === 'CONTAIN')}
              title={p.desc}
              onClick={() => mitigate(node.id, p.id, activeNodeAlert?.id || null)}
            >
              ▸ {p.id}
            </button>
          ))}
          <div className="playbook-hint">Actions apply to the node{activeNodeAlert ? ' and resolve its active alert' : ''}.</div>
        </div>
      )}

      {terminal && (
        <div className="inspector-hint" style={{ marginTop: 10 }}>
          Node is {node.status} — offline until system reset or scenario change.
        </div>
      )}
    </div>
  );
}

function Timeline({ state }) {
  const [viewIndex, setViewIndex] = useState(state.events.length);
  const [prevScenario, setPrevScenario] = useState(state.scenario);
  // reset scrubber to live when a new scenario is injected (render-time state adjustment)
  if (prevScenario !== state.scenario) {
    setPrevScenario(state.scenario);
    setViewIndex(state.events.length);
  }
  const atLive = viewIndex >= state.events.length;
  const sliderValue = Math.min(viewIndex, state.events.length);

  const visible = state.events.slice(0, viewIndex);
  const hidden = state.events.length - visible.length;

  return (
    <div className="timeline-panel hud-panel">
      <div className="panel-header timeline-header">
        EVENT LOG / T-MINUS → DETECTION → MITIGATION
        {!atLive && <button className="btn btn-small btn-live" onClick={() => setViewIndex(state.events.length)}>● LIVE</button>}
        {atLive && <span className="live-tag">● LIVE</span>}
      </div>

      <div className="timeline-controls">
        <span className="tl-label">SCRUB</span>
        <input
          type="range"
          className="tl-slider"
          min={0}
          max={state.events.length}
          value={sliderValue}
          onChange={e => setViewIndex(Number(e.target.value))}
          aria-label="Timeline scrubber"
        />
        <span className="tl-count tabular">{visible.length}/{state.events.length}</span>
        {hidden > 0 && <span className="tl-future">{hidden} FUTURE EVENT{hidden === 1 ? '' : 'S'} HIDDEN</span>}
      </div>

      <div className="event-feed">
        {visible.length === 0 && <div className="inspector-hint">No events in view.</div>}
        {[...visible].reverse().map(e => (
          <div key={e.id} className={`event-row kind-${e.kind} sev-${SEV_CLASS[e.severity]}`}>
            <span className="event-time">{fmtClock(e.simTime)}</span>
            <span className={`event-sev sev-${SEV_CLASS[e.severity]}`}>{e.severity}</span>
            <span className="event-target">{e.target}</span>
            <span className="event-msg">
              {e.message}
              {e.mitigation && <span className="event-mit"> ⚒ {e.mitigation}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SEV_FILTERS = ['ALL', 'EMERGENCY', 'CRITICAL', 'WARNING', 'INFO'];

export default function CommandCenter({ engine, onOpenPalette, alertFilter = 'ALL', setAlertFilter }) {
  const { state, metrics, injectScenario, reset, select, acknowledge } = engine;
  const [exported, setExported] = useState(false);

  const sectors = useMemo(() => {
    const map = {};
    for (const n of state.nodes) (map[n.sector] ||= []).push(n);
    return map;
  }, [state.nodes]);

  const nodeById = useMemo(() => Object.fromEntries(state.nodes.map(n => [n.id, n])), [state.nodes]);

  const handleExport = () => {
    const md = buildIncidentBrief(state);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aegis-incident-${state.scenario}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const selNodeId = state.selected?.type === 'node' ? state.selected.id : null;
  const selAlertId = state.selected?.type === 'alert' ? state.selected.id : null;

  const sevRank = { EMERGENCY: 0, CRITICAL: 1, WARNING: 2, INFO: 3 };
  const visibleAlerts = state.alerts
    .filter(a => alertFilter === 'ALL' || a.severity === alertFilter || (alertFilter === 'CRITICAL' && a.severity === 'EMERGENCY'))
    .sort((a, b) => sevRank[a.severity] - sevRank[b.severity] || (a.status === 'ACTIVE' ? -1 : 1));

  return (
    <div className="command-center">
      {/* demo control bar */}
      <div className="demo-bar">
        <span className="demo-bar-label">SCENARIO INJECTION</span>
        {Object.values(SCENARIOS).map(s => (
          <button
            key={s.id}
            className={`btn btn-small scenario-btn ${state.scenario === s.id ? 'active' : ''}`}
            onClick={() => injectScenario(s.id)}
            title={s.desc}
          >
            {s.label}
          </button>
        ))}
        <span className="demo-bar-spacer" />
        <button className="btn btn-small" onClick={handleExport}>
          {exported ? '✓ BRIEF EXPORTED' : '⬇ EXPORT BRIEF'}
        </button>
        <button className="btn btn-small btn-reset" onClick={reset}>⟲ RESET</button>
        <button className="btn btn-small btn-palette-hint" onClick={onOpenPalette}>
          ⌘K COMMANDS
        </button>
      </div>

      <TelemetryStrip metrics={metrics} state={state} />

      {state.notice && <div className="notice-bar">▸ {state.notice}</div>}

      <div className="cc-grid">
        {/* primary canvas: sectors + nodes */}
        <div className="cc-canvas">
          {Object.entries(sectors).map(([sector, nodes]) => (
            <div key={sector} className="sector-block">
              <div className="sector-header">{sector} SECTOR</div>
              <div className="node-grid">
                {nodes.map(n => (
                  <NodeCard
                    key={n.id}
                    node={n}
                    selected={selNodeId === n.id || state.alerts.some(a => a.id === selAlertId && a.nodeId === n.id)}
                    onSelect={(node) => select('node', node.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* alerts column */}
        <div className="cc-alerts hud-panel">
          <div className="panel-header">
            ACTIVE ALERTS
            <span className={`alert-count ${metrics.activeAlerts > 0 ? 'hot' : ''}`}>{metrics.activeAlerts}</span>
          </div>
          <div className="sev-filter-row">
            {SEV_FILTERS.map(s => (
              <button
                key={s}
                className={`sev-chip ${alertFilter === s ? 'active' : ''}`}
                onClick={() => setAlertFilter?.(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="alert-list">
            {state.alerts.length === 0 && (
              <div className="inspector-hint">No alerts on record. All sectors secure.</div>
            )}
            {visibleAlerts.map(a => (
              <AlertRow
                key={a.id}
                alert={a}
                node={nodeById[a.nodeId]}
                selected={selAlertId === a.id}
                onSelect={(alert) => select('alert', alert.id)}
              />
            ))}
            {state.alerts.length > 0 && visibleAlerts.length === 0 && (
              <div className="inspector-hint">No {alertFilter} alerts on record.</div>
            )}
          </div>
          {state.alerts.some(a => a.status === 'ACTIVE') && (
            <div className="alerts-foot">
              Quick action:{' '}
              {state.alerts.filter(a => a.status === 'ACTIVE').slice(0, 1).map(a => (
                <button
                  key={a.id}
                  className="btn btn-small btn-ack"
                  onClick={() => acknowledge(a.id)}
                >
                  ACK {a.title.split('—')[0].trim().slice(0, 22)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* contextual inspector */}
        <Inspector engine={engine} />
      </div>

      <Timeline state={state} />
    </div>
  );
}
