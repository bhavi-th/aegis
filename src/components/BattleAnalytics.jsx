const WIDTH = 720;
const HEIGHT = 240;
const MARGIN = { top: 18, right: 24, bottom: 30, left: 42 };

function linePoints(points, valueKey) {
  if (points.length < 2) return '';
  const maxIndex = Math.max(points.length - 1, 1);
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  return points.map((point, index) => {
    const x = MARGIN.left + (index / maxIndex) * plotWidth;
    const y = MARGIN.top + plotHeight - point[valueKey] * plotHeight;
    return `${x},${y}`;
  }).join(' ');
}

export default function BattleAnalytics({ analytics = [], running, outcome }) {
  const first = analytics[0];
  const last = analytics[analytics.length - 1];
  const series = analytics.map(point => ({
    ...point,
    heroIntegrity: first?.heroHp ? point.heroHp / first.heroHp : 0,
    villainIntegrity: first?.villainHp ? point.villainHp / first.villainHp : 0,
  }));
  const squadPoints = linePoints(series, 'heroIntegrity');
  const villainPoints = linePoints(series, 'villainIntegrity');
  const damageDealt = first && last ? first.villainHp - last.villainHp : 0;
  const damageTaken = first && last ? first.heroHp - last.heroHp : 0;
  const roundLabelStep = Math.max(1, Math.ceil((last?.round || 0) / 6));

  return (
    <div className={`battle-analytics ${running ? 'is-live' : ''} ${outcome ? `is-${outcome}` : ''}`}>
      <div className="analytics-head">
        <div>
          <div className="analytics-title">COMBAT ANALYTICS</div>
          <div className="analytics-sub">Squad and hostile integrity by round</div>
        </div>
        <div className="analytics-status">{running ? 'LIVE TELEMETRY' : outcome ? outcome.toUpperCase() : 'STANDBY'}</div>
      </div>

      {!first ? (
        <div className="analytics-empty">ENGAGE A BATTLE TO GENERATE TELEMETRY</div>
      ) : (
        <>
          <svg className="analytics-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Battle analytics graph">
            {[0, 0.25, 0.5, 0.75, 1].map(value => {
              const y = MARGIN.top + (HEIGHT - MARGIN.top - MARGIN.bottom) * (1 - value);
              return (
                <g key={value}>
                  <line className="analytics-grid" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y} y2={y} />
                  <text className="analytics-axis" x={MARGIN.left - 8} y={y + 4} textAnchor="end">{Math.round(value * 100)}%</text>
                </g>
              );
            })}
            {series.map((point, index) => point.round % roundLabelStep === 0 && (
              <text
                key={point.round}
                className="analytics-axis"
                x={MARGIN.left + (index / Math.max(series.length - 1, 1)) * (WIDTH - MARGIN.left - MARGIN.right)}
                y={HEIGHT - 8}
                textAnchor="middle"
              >
                R{point.round}
              </text>
            ))}
            <polyline className="analytics-line villain" points={villainPoints} />
            <polyline className="analytics-line hero" points={squadPoints} />
            {series.length > 1 && series.map((point, index) => {
              const x = MARGIN.left + (index / Math.max(series.length - 1, 1)) * (WIDTH - MARGIN.left - MARGIN.right);
              const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
              return (
                <g key={`${point.round}-${index}`}>
                  <circle className="analytics-dot villain" cx={x} cy={MARGIN.top + plotHeight * (1 - point.villainIntegrity)} r="2.5" />
                  <circle className="analytics-dot hero" cx={x} cy={MARGIN.top + plotHeight * (1 - point.heroIntegrity)} r="2.5" />
                </g>
              );
            })}
          </svg>

          <div className="analytics-summary">
            <div className="analytics-legend">
              <span><i className="legend-dot cyan" />SQUAD INTEGRITY</span>
              <span><i className="legend-dot red" />HOSTILE INTEGRITY</span>
            </div>
            <div className="analytics-stats">
              <span>ROUNDS <b>{last.round}</b></span>
              <span>DAMAGE DEALT <b>{Math.max(0, Math.round(damageDealt))}</b></span>
              <span>DAMAGE TAKEN <b>{Math.max(0, Math.round(damageTaken))}</b></span>
              <span>FINAL SQUAD <b>{Math.round((last.heroHp / first.heroHp) * 100)}%</b></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
