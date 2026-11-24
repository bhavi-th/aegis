import WorldMap from 'react-svg-worldmap';

const LOCATIONS = {
  m1: {
    label: 'SOKOVIA THEATER',
    country: 'RS',
    countryName: 'Serbia',
    coordinates: [19.2, 44.1],
    impactCountries: ['RS', 'HR', 'BA', 'ME'],
    impactCoordinates: [[18.7, 43.8], [16.3, 43.5], [18.1, 44.2], [19.9, 42.8]],
  },
  m2: {
    label: 'WAKANDA THEATER',
    country: 'ZA',
    countryName: 'South Africa',
    coordinates: [29.5, -22.8],
    impactCountries: ['ZA', 'NA', 'BW', 'MZ'],
    impactCoordinates: [[28.9, -22.1], [31.2, -23.4], [29.8, -21.5], [32.1, -24.2]],
  },
  m3: {
    label: 'SAN FRANCISCO THEATER',
    country: 'US',
    countryName: 'United States',
    coordinates: [-122.4, 37.8],
    impactCountries: ['US', 'MX', 'CA'],
    impactCoordinates: [[-122.8, 37.9], [-121.9, 37.2], [-124.1, 48.4], [-99.1, 19.4]],
  },
  m4: {
    label: 'PYONGYANG THEATER',
    country: 'KP',
    countryName: 'North Korea',
    coordinates: [125.7, 39],
    impactCountries: ['KP', 'KR', 'JP'],
    impactCoordinates: [[126.4, 38.5], [127.9, 36.8], [129.8, 35.6], [124.4, 40]],
  },
  m5: {
    label: 'ATLANTIS THEATER',
    country: 'ZA',
    countryName: 'South Africa',
    coordinates: [18, -35],
    impactCountries: ['ZA', 'NA', 'MZ'],
    impactCoordinates: [[18.5, -34.5], [15, -35], [13, -33]],
  },
};

const CUSTOM_LOCATION = {
  label: 'CUSTOM ENGAGEMENT AREA',
  country: null,
  countryName: null,
  coordinates: [0, 20],
  impactCountries: ['GH', 'TG', 'NG'],
  impactCoordinates: [[0, 6], [1, 7], [-1, 5], [2, 8]],
};

export default function BattleMap({ mission, running, outcome }) {
  const location = mission ? LOCATIONS[mission.id] : CUSTOM_LOCATION;
  const live = running;
  const active = running || Boolean(outcome);
  const battleCode = location.country;
  const impactCodes = new Set(location.impactCountries);
  const highlightedCodes = [...new Set([battleCode, ...location.impactCountries].filter(Boolean))];
  const mapData = highlightedCodes.map(country => ({
    country,
    value: country === battleCode ? 100 : 60,
  }));
  const pins = [
    {
      id: 'battle-location',
      coordinates: location.coordinates,
      caption: mission ? mission.codename.replace('OPERATION: ', '') : 'CUSTOM AO',
      countryCode: battleCode || undefined,
      kind: 'battle',
      priority: 100,
    },
    ...location.impactCoordinates.map((coordinates, index) => ({
      id: `impact-${index}`,
      coordinates,
      caption: '',
      countryCode: location.impactCountries[index] || undefined,
      kind: 'impact',
      priority: 40 - index,
    })),
  ];
  const mapKey = `${mission?.id || 'custom'}-${live ? 'live' : outcome || 'idle'}`;

  return (
    <div className={`hud-panel battle-map-panel ${live ? 'is-live' : ''} ${outcome ? `is-${outcome}` : ''}`}>
      <div className="panel-header">
        GLOBAL THEATER MAP
        <span>{location.label}</span>
      </div>
      <div className="battle-map">
        <WorldMap
          key={mapKey}
          data={mapData}
          size="responsive"
          title={`${location.label} battle map`}
          projection="equalEarth"
          backgroundColor="#06101f"
          borderColor="#35547a"
          strokeOpacity="0.45"
          frame={false}
          zoom={{ maxScale: 8, minScale: 1, initialScale: mission ? 2.1 : 1.2, zoomFactor: 1.5, showControls: true, showCountryLabels: false }}
          pins={pins}
          pinColor="#00d4ff"
          pinTextColor="#dbeafe"
          pinOutlineColor="#020617"
          styleFunction={(context) => {
            const code = context.countryCode;
            if (impactCodes.has(code)) {
              const fill = outcome === 'victory' ? '#14532d' : outcome === 'defeat' ? '#431407' : '#7f1d1d';
              const stroke = outcome === 'victory' ? '#22c55e' : outcome === 'defeat' ? '#f97316' : '#ef4444';
              return {
                fill,
                fillOpacity: active ? 0.9 : 0.38,
                stroke,
                strokeWidth: 1.4,
                strokeOpacity: active ? 0.95 : 0.45,
                cursor: 'pointer',
              };
            }
            if (code === battleCode) {
              return {
                fill: '#0e7490',
                fillOpacity: active ? 0.95 : 0.5,
                stroke: '#22d3ee',
                strokeWidth: 1.6,
                strokeOpacity: active ? 1 : 0.6,
                cursor: 'pointer',
              };
            }
            return {
              fill: '#12233a',
              fillOpacity: 0.82,
              stroke: '#29415f',
              strokeWidth: 0.8,
              strokeOpacity: 0.75,
              cursor: 'pointer',
            };
          }}
        />
      </div>
      <div className="map-legend">
        <span><i className="legend-dot cyan" />BATTLE LOCATION</span>
        <span><i className={`legend-dot ${outcome === 'victory' ? 'green' : outcome === 'defeat' ? 'orange' : 'red'}`} />{running ? 'ACTIVE IMPACT ZONE' : outcome ? 'RESOLVED IMPACT ZONE' : 'PROJECTED IMPACT ZONE'}</span>
      </div>
    </div>
  );
}
