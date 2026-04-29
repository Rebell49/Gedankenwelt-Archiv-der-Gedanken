import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useAuthStore } from '../store/auth.store'

const ThoughtItem = React.memo(({ thought }) => (
  <div className="thought-bubble">
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="font-semibold">{thought.author.displayName}</p>
        <p className="text-xs text-slate-400">@{thought.author.username}</p>
      </div>
      <span className="text-xs text-slate-400">
        {new Date(thought.createdAt).toLocaleDateString()}
      </span>
    </div>
    <p className="mb-4">{thought.content}</p>
    <div className="flex space-x-4 text-sm text-slate-400">
      <button className="hover:text-blue-400">💚 {thought.likes}</button>
      {thought.status === 'PENDING' && (
        <span className="text-yellow-400">Awaiting moderation...</span>
      )}
    </div>
  </div>
))

export default function PlanetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [planet, setPlanet] = useState(null)
  const [thoughts, setThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [thoughtContent, setThoughtContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false,
  })

  useEffect(() => {
    const abortController = new AbortController()

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [planetRes, thoughtsRes] = await Promise.all([
          api.get(`/anchors/planets/${id}`, { signal: abortController.signal }),
          api.get(`/anchors/planets/${id}/thoughts`, {
            params: { limit: pagination.limit, offset: pagination.offset },
            signal: abortController.signal
          })
        ])
        setPlanet(planetRes.data)
        setThoughts(thoughtsRes.data.thoughts)
        setPagination(prev => ({
          ...prev,
          total: thoughtsRes.data.total,
          hasMore: thoughtsRes.data.thoughts.length === prev.limit,
        }))
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching data:', error)
          setError('Failed to load planet data')
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => abortController.abort()
  }, [id, pagination.limit, pagination.offset])

  const handleSubmitThought = useCallback(async (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post(`/anchors/planets/${id}/thoughts`, {
        content: thoughtContent
      })
      setThoughts(prev => [res.data, ...prev])
      setThoughtContent('')
    } catch (error) {
      console.error('Error submitting thought:', error)
      setError('Failed to submit thought')
    } finally {
      setSubmitting(false)
    }
  }, [user, id, thoughtContent, navigate])

  const memoizedThoughts = useMemo(() =>
    thoughts.map(thought => (
      <ThoughtItem key={thought.id} thought={thought} />
    )), [thoughts]
  )

  if (loading) return <LoadingSpinner />

  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-400">{error}</p>
    </div>
  )

  if (!planet) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400">Planet not found</p>
    </div>
  )

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Planet Header */}
        <div
          className="rounded-xl p-8 mb-8 border"
          style={{
            backgroundColor: `${planet.color}15`,
            borderColor: planet.color
          }}
        >
          <h1 className="text-4xl font-bold mb-2">{planet.name}</h1>
          <p className="text-slate-400 mb-4">{planet.description}</p>
          <div className="flex space-x-6 text-sm">
            <div>
              <span className="text-slate-400">Creator:</span>
              <p className="font-semibold">{planet.creator.displayName}</p>
            </div>
            <div>
              <span className="text-slate-400">Thoughts:</span>
              <p className="font-semibold">{planet._count.thoughts}</p>
            </div>
          </div>
        </div>

        {/* Submit Thought Form */}
        {user && (
          <form onSubmit={handleSubmitThought} className="planet-card mb-8">
            <h3 className="text-lg font-semibold mb-4">Share a Thought</h3>
            <textarea
              value={thoughtContent}
              onChange={(e) => setThoughtContent(e.target.value)}
              placeholder="What's on your mind?"
              className="input-base mb-4 min-h-24"
              required
            />
            <button
              type="submit"
              disabled={submitting || !thoughtContent.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post Thought'}
            </button>
          </form>
        )}

        {/* Thoughts List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Thoughts ({pagination.total})</h3>
          {memoizedThoughts}
          {thoughts.length === 0 && (
            <p className="text-slate-400 text-center py-8">No thoughts yet. Be the first!</p>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={() => setPagination(prev => ({
                  ...prev,
                  offset: Math.max(0, prev.offset - prev.limit)
                }))}
                disabled={pagination.offset === 0}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-slate-400 self-center">
                Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              <button
                onClick={() => setPagination(prev => ({
                  ...prev,
                  offset: prev.offset + prev.limit
                }))}
                disabled={!pagination.hasMore}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
