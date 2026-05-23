import { useState } from 'react'
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  Moon,
  Sun,
  Shield,
  Building,
  Phone
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { toggleTheme, isDark } = useTheme()

  // Profile Form State
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    avatar_url: user?.avatar_url || ''
  })
  const [profileLoading, setProfileLoading] = useState(false)

  // Password Form State
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passLoading, setPassLoading] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    try {
      const res = await authApi.updateProfile(profile)
      updateUser(res.data.user)
      toast.success('Profile details updated!')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwords.current_password || !passwords.new_password) {
      toast.error('Please enter all password fields')
      return
    }
    if (passwords.new_password !== passwords.confirm_password) {
      toast.error('Passwords do not match')
      return
    }

    setPassLoading(true)
    try {
      await authApi.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password
      })
      toast.success('Password updated successfully!')
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Password update failed'
      toast.error(message)
    } finally {
      setPassLoading(false)
    }
  }

  return (
    <div className="space-y-8 page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'rgb(var(--text-primary))' }}>
          Account Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>
          Manage your user profile details, update authorization credentials, and configure themes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar/Shortcuts */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h4 className="text-sm font-black flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
              <Shield size={16} className="text-indigo-400" /> Account Security
            </h4>
            <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
              Logged in as:<br />
              <strong className="text-slate-300 font-semibold">{user?.email}</strong>
            </p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-secondary))' }}>
              Privilege Level:<br />
              <strong className="text-indigo-400 capitalize font-bold">{user?.role}</strong>
            </p>
          </div>

          <div className="card p-5 space-y-4">
            <h4 className="text-sm font-black flex items-center gap-2" style={{ color: 'rgb(var(--text-primary))' }}>
              <Sun size={16} className="text-indigo-400" /> Preferences
            </h4>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'rgb(var(--text-primary))' }}>Dark Mode Theme</span>
              <button
                onClick={toggleTheme}
                className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-[11px]"
              >
                {isDark ? <Sun size={13} /> : <Moon size={13} />} Toggle Theme
              </button>
            </div>
          </div>
        </div>

        {/* Content forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="card p-6">
            <h3 className="text-base font-black mb-6" style={{ color: 'rgb(var(--text-primary))' }}>Personal Profile</h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-400">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      className="input pl-9 py-2"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-400">Phone Contact</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      className="input pl-9 py-2"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-400">Department</label>
                  <div className="relative">
                    <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      className="input pl-9 py-2"
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-400">Profile Image URL</label>
                  <input
                    type="text"
                    className="input py-2"
                    placeholder="https://example.com/avatar.jpg"
                    value={profile.avatar_url}
                    onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="btn-primary py-2.5 px-5 text-xs flex items-center gap-1.5 mt-2"
              >
                <Save size={14} /> Update Details
              </button>
            </form>
          </div>

          {/* Password Form */}
          <div className="card p-6">
            <h3 className="text-base font-black mb-6" style={{ color: 'rgb(var(--text-primary))' }}>Update Authorization Credentials</h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-slate-400">Current Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className="input pl-9 py-2"
                    value={passwords.current_password}
                    onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-400">New Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="input pl-9 py-2"
                      value={passwords.new_password}
                      onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-400">Confirm New Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      className="input pl-9 py-2"
                      value={passwords.confirm_password}
                      onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="btn-primary py-2.5 px-5 text-xs flex items-center gap-1.5 mt-2"
              >
                <Save size={14} /> Update Credentials
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
