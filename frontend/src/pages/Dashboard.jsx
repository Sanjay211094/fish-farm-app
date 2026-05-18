import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../api/axios'

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

function StatCard({ label, value, sub, icon, color = 'ocean' }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`text-3xl p-3 rounded-xl bg-${color}-50`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [monthly, setMonthly] = useState([])
  const [chartTab, setChartTab] = useState('daily')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/daily?days=14'),
      api.get('/analytics/monthly?months=6'),
    ]).then(([s, d, m]) => {
      setSummary(s.data)
      setDaily(d.data)
      setMonthly(m.data.map(r => ({ ...r, month: r.month.slice(0, 7) })))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin text-4xl">🐟</div>
    </div>
  )

  const chartData = chartTab === 'daily' ? daily : monthly
  const xKey = chartTab === 'daily' ? 'date' : 'month'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-0.5">Overview of your fish farm operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={fmt(summary.totalRevenue)} icon="💰" />
        <StatCard label="Total Orders" value={summary.totalOrders} sub="Delivered + confirmed" icon="📦" />
        <StatCard label="Customers" value={summary.totalCustomers} icon="👥" />
        <StatCard label="Pending Orders" value={summary.pendingOrders} icon="⏳" color="yellow" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue trend */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Revenue Trend</h3>
            <div className="flex gap-1">
              {['daily', 'monthly'].map(t => (
                <button
                  key={t}
                  onClick={() => setChartTab(t)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    chartTab === t ? 'bg-ocean-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={v => '₹' + (v/1000).toFixed(0) + 'k'} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top fish */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Revenue by Fish Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={summary.topFish} dataKey="revenue" nameKey="fish_type" cx="50%" cy="50%" outerRadius={80} label={({ fish_type }) => fish_type}>
                {summary.topFish.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top customers */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Top Customers</h3>
          <div className="space-y-3">
            {summary.topCustomers.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.orders} orders</p>
                </div>
                <span className="text-sm font-semibold text-ocean-700">{fmt(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Orders bar chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Orders (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
