const ICONS = {
  'iron-man': <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6l-8-4Zm0 4 5 2v4c0 3.3-2.2 5.5-5 6.8-2.8-1.3-5-3.5-5-6.8V8l5-2Zm-1 3h2v3h-2v-3Zm0 5h2v2h-2v-2Z" />,
  'captain-america': <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3.5A6.5 6.5 0 0 1 18.5 12 6.5 6.5 0 0 1 12 18.5 6.5 6.5 0 0 1 5.5 12 6.5 6.5 0 0 1 12 5.5Zm-1 2.75v3.75h2V8.25h-2Zm0 5.5v2h2v-2h-2Z" />,
  thor: <path d="M13 2 5 14h5l-2 8 8-12h-5l2-8Z" />,
  hulk: <path d="M4 13c0-5 3.5-9 8-9 2.8 0 5 1.5 6.2 4H21l-2 4h-2.5C17 15 14.8 17 12 17h-1c-.6-1.2-1.6-2-3-2.4V13H4Zm3 1h2v2H7v-2Zm5 0h2v2h-2v-2Zm-3-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2Z" />,
  'black-widow': <path d="M12 2a8 8 0 0 0-8 8c0 3.3 2 6.2 5 7.5V20h6v-2.5c3-1.3 5-4.2 5-7.5a8 8 0 0 0-8-8Zm-1 4h2v4h-2V6Zm0 6h2v2h-2v-2Z" />,
  hawkeye: <path d="m4 4 16 16M20 4 4 20M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20Zm0 4a6 6 0 0 0 0 12 6 6 0 0 0 0-12Z" />,
  falcon: <path d="M3 15 18 4l3 5-13 9-3 1 1-4Zm4-1 8 3M7 7l9 7" stroke="currentColor" strokeWidth="1.8" fill="none" />,
  vision: <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 3.2L18 8v8l-6 3.3L6 16V8l6-2.8ZM9 10h6v6H9v-6Z" />,
  'scarlet-witch': <path d="M12 2c1 4 4 7 8 8-4 1-7 4-8 8-1-4-4-7-8-8 4-1 7-4 8-8Zm0 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />,
  'doctor-strange': <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 4h2v4l3 2-1 1.7-4-2.7V6Zm0 9h2v2h-2v-2Z" />,
};

export default function CharacterAvatar({ hero, size = 'medium', className = '', animate = false }) {
  const initials = hero.name.split(' ').map(word => word[0]).join('');

  return (
    <div
      className={`character-avatar ${size} ${animate ? 'is-animated' : ''} ${className}`}
      style={{ '--hero-color': hero.color }}
      role="img"
      aria-label={`${hero.name} avatar`}
      title={hero.name}
    >
      <div className="avatar-glow" />
      {hero.image ? (
        <img className="avatar-img" src={hero.image} alt="" aria-hidden="true" />
      ) : (
        <>
          <svg className="avatar-icon" viewBox="0 0 24 24" aria-hidden="true">
            {ICONS[hero.id] || <text x="12" y="17" textAnchor="middle" fontSize="10" fontWeight="800" fill="currentColor">{initials}</text>}
          </svg>
          <span className="avatar-initials">{initials}</span>
        </>
      )}
    </div>
  );
}
