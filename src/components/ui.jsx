// Shared design primitives — one visual language across the resident app.

export function Card({ className = '', children, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${onClick ? 'cursor-pointer transition hover:border-slate-300 hover:shadow' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{children}</h2>
      {action}
    </div>
  )
}

export function Badge({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    sky: 'bg-sky-50 text-sky-700 ring-sky-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function PageHeader({ title, subtitle, back }) {
  return (
    <div className="flex items-center gap-3">
      {back}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, hint }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      <div className="mx-auto grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">{title}</p>
      {hint && <p className="mt-1 text-[13px] text-slate-500">{hint}</p>}
    </div>
  )
}
