/** Reusable background system: gradient mesh + faint dot grid + soft blurred orbs. Purely decorative. */
export function BackgroundSystem({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const dark = tone === 'dark'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className={`absolute inset-0 ${dark ? 'bg-hero-gradient' : 'bg-gradient-to-b from-white to-surface-alt'}`}
      />
      <div
        className="absolute -left-24 top-10 h-80 w-80 rounded-full blur-3xl"
        style={{ background: dark ? 'rgba(20,184,216,0.22)' : 'rgba(20,184,216,0.12)' }}
      />
      <div
        className="absolute -right-16 bottom-0 h-96 w-96 rounded-full blur-3xl"
        style={{ background: dark ? 'rgba(15,118,110,0.45)' : 'rgba(15,118,110,0.10)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,0.14)' : 'rgba(11,37,69,0.08)'} 1px, transparent 1px)`,
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
    </div>
  )
}
