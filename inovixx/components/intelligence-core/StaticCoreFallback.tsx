export function StaticCoreFallback() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-[28%] h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full core-fallback-glow" />
      <svg
        className="absolute left-1/2 top-[28%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 opacity-40"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="200" cy="200" r="120" stroke="#7C5CFF" strokeOpacity="0.35" strokeWidth="0.6" />
        <circle cx="200" cy="200" r="150" stroke="#3E4FE0" strokeOpacity="0.25" strokeWidth="0.6" />
        <circle cx="200" cy="200" r="82" stroke="#5FE3D6" strokeOpacity="0.2" strokeWidth="0.6" />
      </svg>
    </div>
  );
}
