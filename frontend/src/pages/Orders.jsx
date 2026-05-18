import { useEffect, useState } from 'react'
import api from '../api/axios'
import Modal from '../components/Modal'

const FISH_TYPES = ['Rohu', 'Catla', 'Tilapia', 'Pomfret', 'Salmon', 'Tuna', 'Mackerel', 'Hilsa', 'Other']
const STATUSES = ['pending', 'confirmed', 'delivered', 'cancelled']

const EMPTY = { customer_id: '', fish_type: 'Rohu', quantity: '', unit: 'kg', price_per_unit: '', order_date: new Date().toISOString().split('T')[0], status: 'pending', notes: '' }

function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN') }

function StatusBadge({ status }) {
  const cls = { pending: 'badge-yellow', confirmed: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red' }
  return <span className={cls[status] || 'badge'}>{status}</span>
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({ status: '', customer_id: '' })
  const [deleteId, setDeleteId] = useState(null)

  const load = () =>
    Promise.all([
      api.get('/orders', { params: { status: filter.status || undefined, customer_id: filter.customer_id || undefined } }),
      api.get('/customers')
    ]).then(([o, c]) => { setOrders(o.data); setCustomers(c.data) })
    .finally(() => setLoading(false))

  useEffect(() => { setLoading(true); load() }, [filter])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setModalOpen(true) }
  const openEdit = o => {
    setEditing(o)
    setForm({ customer_id: o.customer_id, fish_type: o.fish_type, quantity: o.quantity, unit: o.unit, price_per_unit: o.price_per_unit, order_date: o.order_date, status: o.status, notes: o.notes || '' })
    setError(''); setModalOpen(true)
  }

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editing) await api.put(`/orders/${editing.id}`, form)
      else await api.post('/orders', form)
      setModalOpen(false); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await api.delete(`/orders/${deleteId}`); setDeleteId(null); load() }
    catch (err) { alert(err.response?.data?.message || 'Delete failed') }
  }

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_value, 0)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-gray-500 text-sm">{orders.length} orders · Revenue: {fmt(totalRevenue)}</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ New Order</button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex gap-4 flex-wrap">
        <select className="input w-auto" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="input w-auto" value={filter.customer_id} onChange={e => setFilter(f => ({ ...f, customer_id: e.target.value }))}>
          <option value="">All Customers</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(filter.status || filter.customer_id) && (
          <button className="btn-secondary text-sm" onClick={() => setFilter({ status: '', customer_id: '' })}>Clear filters</button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📦</p>
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Fish Type</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Qty</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Price/unit</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{o.id}</td>
                  <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                  <td className="px-4 py-3">{o.fish_type}</td>
                  <td className="px-4 py-3 text-right">{o.quantity} {o.unit}</td>
                  <td className="px-4 py-3 text-right">{fmt(o.price_per_unit)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ocean-700">{fmt(o.total_value)}</td>
                  <td className="px-4 py-3">{o.order_date}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="btn-secondary text-xs px-2 py-1" onClick={() => openEdit(o)}>Edit</button>
                      <button className="btn-danger text-xs px-2 py-1" onClick={() => setDeleteId(o.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Order' : 'New Order'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Customer <span className="text-red-500">*</span></label>
            <select className="input" value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} required>
              <option value="">Select customer…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fish Type <span className="text-red-500">*</span></label>
              <select className="input" value={form.fish_type} onChange={e => setForm(f => ({ ...f, fish_type: e.target.value }))}>
                {FISH_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Order Date <span className="text-red-500">*</span></label>
              <input className="input" type="date" value={form.order_date} onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))} required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Quantity <span className="text-red-500">*</span></label>
              <input className="input" type="number" min="0" step="0.1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                {['kg', 'g', 'ton', 'piece'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price/Unit (₹) <span className="text-red-500">*</span></label>
              <input className="input" type="number" min="0" step="0.01" value={form.price_per_unit} onChange={e => setForm(f => ({ ...f, price_per_unit: e.target.value }))} required />
            </div>
          </div>
          {form.quantity && form.price_per_unit && (
            <div className="bg-ocean-50 rounded-lg px-4 py-2 text-sm text-ocean-800 font-medium">
              Total: {fmt(parseFloat(form.quantity) * parseFloat(form.price_per_unit) || 0)}
            </div>
          )}
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Order">
        <p className="text-gray-600 mb-6">Are you sure you want to delete this order?</p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  )
}
