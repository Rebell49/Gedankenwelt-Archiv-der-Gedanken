import React, { useEffect, useState } from 'react'
import api from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { CheckCircle, XCircle } from 'lucide-react'

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [pendingThoughts, setPendingThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stats')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/moderation/pending')
        ])
        setStats(statsRes.data)
        setPendingThoughts(pendingRes.data.thoughts)
      } catch (error) {
        console.error('Error fetching admin data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleApprove = async (thoughtId) => {
    try {
      await api.post(`/admin/moderation/approve/${thoughtId}`)
      setPendingThoughts(pending => pending.filter(t => t.id !== thoughtId))
    } catch (error) {
      console.error('Error approving thought:', error)
    }
  }

  const handleReject = async (thoughtId) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    try {
      await api.post(`/admin/moderation/reject/${thoughtId}`, { reason })
      setPendingThoughts(pending => pending.filter(t => t.id !== thoughtId))
    } catch (error) {
      console.error('Error rejecting thought:', error)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 font-semibold ${activeTab === 'stats' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-6 py-3 font-semibold ${activeTab === 'moderation' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}
          >
            Moderation
          </button>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="planet-card">
              <p className="text-slate-400 text-sm">Total Thoughts</p>
              <p className="text-3xl font-bold">{stats.totalThoughts}</p>
            </div>
            <div className="planet-card">
              <p className="text-slate-400 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-400">{stats.byStatus.approved}</p>
            </div>
            <div className="planet-card">
              <p className="text-slate-400 text-sm">Flagged</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.byStatus.flagged}</p>
            </div>
            <div className="planet-card">
              <p className="text-slate-400 text-sm">Approval Rate</p>
              <p className="text-3xl font-bold">{stats.averageApprovalRate}%</p>
            </div>
          </div>
        )}

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Pending Moderation ({pendingThoughts.length})</h3>
            {pendingThoughts.map(thought => (
              <div key={thought.id} className="planet-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold">{thought.author.displayName}</p>
                    <p className="text-sm text-slate-400">{thought.planet.name}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(thought.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mb-4 text-slate-200">{thought.content}</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(thought.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReject(thought.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
            {pendingThoughts.length === 0 && (
              <p className="text-slate-400 text-center py-8">No pending thoughts</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
