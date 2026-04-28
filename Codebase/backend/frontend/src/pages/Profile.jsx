import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/auth.store'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, updateProfile } = useAuthStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    avatar: user?.avatar || '',
    bio: user?.bio || '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(formData)
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }

    setFormData({
      displayName: user.displayName || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
    })
  }, [user, navigate])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        <div className="planet-card">
          <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-slate-600">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.displayName}</h2>
              <p className="text-slate-400">@{user.username}</p>
              <p className="text-slate-400 text-sm">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                disabled={!editing}
                className={`input-base ${!editing && 'opacity-50 cursor-not-allowed'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!editing}
                placeholder="Tell us about yourself"
                className={`input-base ${!editing && 'opacity-50 cursor-not-allowed'}`}
                rows={4}
              />
            </div>

            <div className="flex space-x-4">
              {!editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn-primary"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        displayName: user.displayName,
                        avatar: user.avatar || '',
                        bio: user.bio || '',
                      })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-slate-600 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-400">0</p>
              <p className="text-slate-400 text-sm">Thoughts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">0</p>
              <p className="text-slate-400 text-sm">Planets Created</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-400">0</p>
              <p className="text-slate-400 text-sm">Likes Received</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
