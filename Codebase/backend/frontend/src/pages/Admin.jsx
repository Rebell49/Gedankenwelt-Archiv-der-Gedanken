import React, { useEffect, useState } from 'react'
import api from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { CheckCircle, XCircle } from 'lucide-react'

export default function Admin() {
  const [stats, setStats] = useState(null)
  const [pendingThoughts, setPendingThoughts] = useState([])
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stats')
  const [pagination, setPagination] = useState({
    users: { limit: 20, offset: 0, total: 0 },
    logs: { limit: 20, offset: 0, total: 0 },
  })

  useEffect(() => {
    const abortController = new AbortController()

    const fetchData = async () => {
      try {
        const [statsRes, pendingRes, usersRes, logsRes] = await Promise.all([
          api.get('/admin/stats', { signal: abortController.signal }),
          api.get('/admin/moderation/pending', { signal: abortController.signal }),
          api.get('/admin/users', {
            params: { limit: pagination.users.limit, offset: pagination.users.offset },
            signal: abortController.signal
          }),
          api.get('/admin/logs', {
            params: { limit: pagination.logs.limit, offset: pagination.logs.offset },
            signal: abortController.signal
          })
        ])
        if (!abortController.signal.aborted) {
          setStats(statsRes.data)
          setPendingThoughts(pendingRes.data.thoughts)
          setUsers(usersRes.data.users)
          setPagination(prev => ({
            users: { ...prev.users, total: usersRes.data.total },
            logs: { ...prev.logs, total: logsRes.data.total },
          }))
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching admin data:', error)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }
    fetchData()

    return () => abortController.abort()
  }, [pagination.users.offset, pagination.logs.offset])

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
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-semibold ${activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 font-semibold ${activeTab === 'logs' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}
          >
            Logs
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

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Moderation Logs ({pagination.logs.total})</h3>
            {logs.map(log => (
              <div key={log.id} className="planet-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{log.action}</p>
                    <p className="text-sm text-slate-400">{log.targetType}: {log.targetId}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-200">{log.reason}</p>
                <p className="text-xs text-slate-400 mt-2">By: {log.admin.username}</p>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-slate-400 text-center py-8">No logs yet</p>
            )}

            {/* Pagination for logs */}
            {pagination.logs.total > pagination.logs.limit && (
              <div className="flex justify-center space-x-4 mt-8">
                <button
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    logs: { ...prev.logs, offset: Math.max(0, prev.logs.offset - prev.logs.limit) }
                  }))}
                  disabled={pagination.logs.offset === 0}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-slate-400 self-center">
                  Page {Math.floor(pagination.logs.offset / pagination.logs.limit) + 1} of {Math.ceil(pagination.logs.total / pagination.logs.limit)}
                </span>
                <button
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    logs: { ...prev.logs, offset: prev.logs.offset + prev.logs.limit }
                  }))}
                  disabled={logs.length < pagination.logs.limit}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold mb-4">Users ({pagination.users.total})</h3>
            {users.map(user => (
              <div key={user.id} className="planet-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{user.displayName} {user.isAdmin && '(Admin)'}</p>
                    <p className="text-sm text-slate-400">@{user.username} • {user.email}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex space-x-6 text-sm text-slate-400">
                  <span>Thoughts: {user._count.createdThoughts}</span>
                  <span>Planets: {user._count.createdPlanets}</span>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <p className="text-slate-400 text-center py-8">No users found</p>
            )}

            {/* Pagination for users */}
            {pagination.users.total > pagination.users.limit && (
              <div className="flex justify-center space-x-4 mt-8">
                <button
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    users: { ...prev.users, offset: Math.max(0, prev.users.offset - prev.users.limit) }
                  }))}
                  disabled={pagination.users.offset === 0}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-slate-400 self-center">
                  Page {Math.floor(pagination.users.offset / pagination.users.limit) + 1} of {Math.ceil(pagination.users.total / pagination.users.limit)}
                </span>
                <button
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    users: { ...prev.users, offset: prev.users.offset + prev.users.limit }
                  }))}
                  disabled={users.length < pagination.users.limit}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
