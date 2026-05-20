import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

function Section({ title, description, children }) {
  return (
    <div className="card">
      <div className="border-b border-gray-100 pb-4 mb-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transition-all
      ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
      {type === 'success' ? '✓' : '✕'} {msg}
    </div>
  )
}

export default function Settings() {
  const { user, login, logout } = useAuth()

  const [profile, setProfile] = useState({ full_name: user?.full_name || '', email: user?.email || '' })
  const [profileSaving, setProfileSaving] = useState(false)

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })

  const [toast, setToast] = useState({ msg: '', type: 'success' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  const handleProfileSave = async e => {
    e.preventDefault()
    setProfileSaving(true)
    try {
      const { data } = await api.put('/auth/profile', profile)
      localStorage.setItem('user', JSON.stringify({ ...user, ...data }))
      showToast('Profile updated successfully')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error')
    } finally { setProfileSaving(false) }
  }

  const handlePasswordChange = async e => {
    e.preventDefault()
    if (passwords.new_password !== passwords.confirm_password)
      return showToast('New passwords do not match', 'error')
    if (passwords.new_password.length < 6)
      return showToast('Password must be at least 6 characters', 'error')

    setPwSaving(true)
    try {
      await api.put('/auth/password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password
      })
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
      showToast('Password changed successfully')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error')
    } finally { setPwSaving(false) }
  }

  const pwStrength = pw => {
    if (!pw) return null
    if (pw.length < 6) return { label: 'Too short', color: 'bg-red-400', width: '20%' }
    if (pw.length < 8) return { label: 'Weak', color: 'bg-orange-400', width: '40%' }
    if (!/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label: 'Fair', color: 'bg-yellow-400', width: '60%' }
    if (pw.length >= 10) return { label: 'Strong', color: 'bg-green-500', width: '100%' }
    return { label: 'Good', color: 'bg-blue-400', width: '80%' }
  }
  const strength = pwStrength(passwords.new_password)

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <Section title="Profile" description="Update your display name and email address">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {(profile.full_name || user?.username || 'A')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile.full_name || user?.username}</p>
            <p className="text-sm text-gray-400">@{user?.username}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              placeholder="Your full name"
              value={profile.full_name}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              className="input"
              type="email"
              placeholder="your@email.com"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Username</label>
            <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={user?.username} disabled />
            <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={profileSaving}>
              {profileSaving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Section>

      {/* Password Section */}
      <Section title="Change Password" description="Choose a strong password to keep your account secure">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPw.current ? 'text' : 'password'}
                placeholder="Enter current password"
                value={passwords.current_password}
                onChange={e => setPasswords(p => ({ ...p, current_password: e.target.value }))}
                required
              />
              <button type="button" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                {showPw.current ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPw.new ? 'text' : 'password'}
                placeholder="Enter new password"
                value={passwords.new_password}
                onChange={e => setPasswords(p => ({ ...p, new_password: e.target.value }))}
                required
              />
              <button type="button" onClick={() => setShowPw(s => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                {showPw.new ? 'Hide' : 'Show'}
              </button>
            </div>
            {strength && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Strength: <span className="font-medium text-gray-600">{strength.label}</span></p>
              </div>
            )}
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPw.confirm ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={passwords.confirm_password}
                onChange={e => setPasswords(p => ({ ...p, confirm_password: e.target.value }))}
                required
              />
              <button type="button" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                {showPw.confirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {passwords.confirm_password && passwords.new_password !== passwords.confirm_password && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
            {passwords.confirm_password && passwords.new_password === passwords.confirm_password && passwords.new_password && (
              <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={pwSaving}>
              {pwSaving ? 'Changing…' : 'Change Password'}
            </button>
          </div>
        </form>
      </Section>

      {/* App Info */}
      <Section title="About" description="Fish Farm Management System">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Application</span>
            <span className="font-medium">Fish Farm Manager</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Backend</span>
            <span className="font-medium">Node.js + Express</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Database</span>
            <span className="font-medium">SQLite</span>
          </div>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="Session" description="Manage your active session">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Sign out of all devices</p>
            <p className="text-xs text-gray-400">You will be logged out and redirected to login</p>
          </div>
          <button
            onClick={() => { if (window.confirm('Sign out?')) { logout(); window.location.href = '/login' } }}
            className="btn-danger text-sm"
          >
            Sign Out
          </button>
        </div>
      </Section>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  )
}
