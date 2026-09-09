import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  Flame,
  Radio,
  Ship,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx'

export function KpiDashboard({ incidents = [], teams = [], summary = {} }) {
  // Compute priority score distribution (0-3, 4-7, 8-10)
  const priorityDist = useMemo(() => {
    const counts = { 'Low (0-3)': 0, 'Elevated (4-7)': 0, 'Critical (8-10)': 0 }
    incidents.forEach((inc) => {
      const s = inc.priority?.score ?? 0
      if (s >= 8) counts['Critical (8-10)']++
      else if (s >= 4) counts['Elevated (4-7)']++
      else counts['Low (0-3)']++
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [incidents])

  // Compute team readiness
  const teamStatusDist = useMemo(() => {
    const statusCounts = {}
    teams.forEach((t) => {
      const st = t.status || 'AVAILABLE'
      statusCounts[st] = (statusCounts[st] || 0) + 1
    })
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  }, [teams])

  // SOS ingestion per hour, derived from real incident timestamps —
  // never mock data on an ops dashboard.
  const timelineTrend = useMemo(() => {
    const buckets = {}
    incidents.forEach((inc) => {
      const ts = Number(inc.created_at) || 0
      if (!ts) return
      const d = new Date(ts)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:00`
      buckets[key] = (buckets[key] || 0) + 1
    })
    return Object.entries(buckets)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([time, sos]) => ({ time: time.slice(11), sos }))
  }, [incidents])

  const BAR_COLORS = ['#94a3b8', '#f59e0b', '#dc2626']

  return (
    <div className="grid gap-4 font-sans sm:grid-cols-2 lg:grid-cols-4">
      {/* KPI Card 1: Active Incidents */}
      <Card className="bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Distress Signals</CardTitle>
          <span className="grid size-8 place-items-center rounded-xl bg-red-50 border border-red-100">
            <AlertTriangle className="size-4 text-red-600" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="tnum text-2xl font-black font-mono text-slate-900 tracking-tight">
            {incidents.length}
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-500">
            <b>{summary?.high_priority ?? 0}</b> flagged critical (score ≥8)
          </p>
        </CardContent>
      </Card>

      {/* KPI Card 2: Rescue Fleet */}
      <Card className="bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Team Readiness</CardTitle>
          <span className="grid size-8 place-items-center rounded-xl bg-slate-900">
            <Ship className="size-4 text-white" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="tnum text-2xl font-black font-mono text-slate-900 tracking-tight">
            {summary?.teams_ready ?? 0} / {teams.length}
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-500">
            Total team capacity: <b>{teams.reduce((acc, t) => acc + (t.capacity || 0), 0)}</b> seats
          </p>
        </CardContent>
      </Card>

      {/* KPI Card 3: Citizens At Risk */}
      <Card className="bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Citizens In Danger</CardTitle>
          <span className="grid size-8 place-items-center rounded-xl bg-amber-50 border border-amber-100">
            <Users className="size-4 text-amber-600" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="tnum text-2xl font-black font-mono text-slate-900 tracking-tight">
            {summary?.people_reported ?? 0}
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-500">
            <b>{summary?.rescued_total ?? 0}</b> confirmed safe evacuations
          </p>
        </CardContent>
      </Card>

      {/* KPI Card 4: River Gauge Peak */}
      <Card className="bg-white border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Peak River Surge (DEMO)</CardTitle>
          <span className="grid size-8 place-items-center rounded-xl bg-sky-50 border border-sky-100">
            <TrendingUp className="size-4 text-sky-600" />
          </span>
        </CardHeader>
        <CardContent>
          <div className="tnum text-2xl font-black font-mono text-slate-900 tracking-tight">
            4.85m
          </div>
          <p className="mt-1 text-[11px] font-mono text-slate-500">
            Bagmati River Gaur gauge (+1.85m danger) — demo baseline
          </p>
        </CardContent>
      </Card>

      {/* Embedded Chart 1: Priority Distribution */}
      <Card className="col-span-full lg:col-span-2 bg-white border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-[11px]">Incident Priority Math Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[140px] pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityDist} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {priorityDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Embedded Chart 2: SOS ingestion by hour (live board data) */}
      <Card className="col-span-full lg:col-span-2 bg-white border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-[11px]">SOS Ingestion by Hour</CardTitle>
        </CardHeader>
        <CardContent className="h-[140px] pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Area type="monotone" dataKey="sos" stroke="#059669" fillOpacity={1} fill="url(#colorWater)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
