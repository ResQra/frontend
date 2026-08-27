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

  // Mock timeline trend for flood surge
  const timelineTrend = [
    { time: '06:00', water_m: 2.1, sos: 1 },
    { time: '08:00', water_m: 2.8, sos: 2 },
    { time: '10:00', water_m: 3.6, sos: 4 },
    { time: '12:00', water_m: 4.5, sos: 6 },
    { time: '14:00', water_m: 4.85, sos: 7 },
  ]

  const BAR_COLORS = ['#52525b', '#a1a1aa', '#ffffff']

  return (
    <div className="grid gap-3 font-sans sm:grid-cols-2 lg:grid-cols-4">
      {/* KPI Card 1: Active Incidents */}
      <Card className="bg-[#09090b]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[11px] text-zinc-400">Distress Signals</CardTitle>
          <AlertTriangle className="size-4 text-white" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            {incidents.length}
          </div>
          <p className="mt-1 text-[11px] font-mono text-zinc-400">
            <b>{summary?.high_priority ?? 0}</b> flagged critical (score ≥8)
          </p>
        </CardContent>
      </Card>

      {/* KPI Card 2: Rescue Fleet */}
      <Card className="bg-[#09090b]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[11px] text-zinc-400">Fleet Readiness</CardTitle>
          <Ship className="size-4 text-white" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            {summary?.teams_ready ?? 0} / {teams.length}
          </div>
          <p className="mt-1 text-[11px] font-mono text-zinc-400">
            Total boat capacity: <b>{teams.reduce((acc, t) => acc + (t.capacity || 0), 0)}</b> seats
          </p>
        </CardContent>
      </Card>

      {/* KPI Card 3: Citizens At Risk */}
      <Card className="bg-[#09090b]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[11px] text-zinc-400">Citizens In Danger</CardTitle>
          <Users className="size-4 text-white" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            {summary?.people_reported ?? 0}
          </div>
          <p className="mt-1 text-[11px] font-mono text-zinc-400">
            <b>{summary?.rescued_total ?? 0}</b> confirmed safe evacuations
          </p>
        </CardContent>
      </Card>

      {/* KPI Card 4: River Gauge Peak */}
      <Card className="bg-[#09090b]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[11px] text-zinc-400">Peak River Surge</CardTitle>
          <TrendingUp className="size-4 text-white" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black font-mono text-white tracking-tight">
            4.85m
          </div>
          <p className="mt-1 text-[11px] font-mono text-zinc-400">
            Bagmati River Balkhu gauge (+1.85m danger)
          </p>
        </CardContent>
      </Card>

      {/* Embedded Chart 1: Priority Distribution */}
      <Card className="col-span-full lg:col-span-2 bg-[#09090b]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[11px]">Incident Priority Math Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-[140px] pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityDist} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#000000', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
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

      {/* Embedded Chart 2: River Surge vs SOS Ingestion */}
      <Card className="col-span-full lg:col-span-2 bg-[#09090b]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[11px]">Water Gauge Level vs SOS Surge</CardTitle>
        </CardHeader>
        <CardContent className="h-[140px] pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#000000', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Area type="monotone" dataKey="water_m" stroke="#ffffff" fillOpacity={1} fill="url(#colorWater)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
