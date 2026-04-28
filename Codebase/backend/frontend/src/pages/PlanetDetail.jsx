import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { useAuthStore } from '../store/auth.store'

export default function PlanetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [planet, setPlanet] = useState(null)
  const [thoughts, setThoughts] = useState([])
  const [loading, setLoading] = useState(true)
  const [thoughtContent, setThoughtContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planetRes, thoughtsRes] = await Promise.all([
          api.get(`/anchors/planets/${id}`),
          api.get(`/anchors/planets/${id}/thoughts`)
        ])
        setPlanet(planetRes.data)
        setThoughts(thoughtsRes.data.thoughts)
      } catch (error) {
        console.error('Error fetching data:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, navigate])

  const handleSubmitThought = async (e) => {
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
      setThoughts([res.data, ...thoughts])
      setThoughtContent('')
    } catch (error) {
      console.error('Error submitting thought:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  if (!planet) return <div>Planet not found</div>

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
          <h3 className="text-lg font-semibold">Thoughts ({thoughts.length})</h3>
          {thoughts.map(thought => (
            <div key={thought.id} className="thought-bubble">
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
          ))}
          {thoughts.length === 0 && (
            <p className="text-slate-400 text-center py-8">No thoughts yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  )
}
