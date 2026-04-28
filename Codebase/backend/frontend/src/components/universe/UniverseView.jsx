import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

export default function UniverseView() {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const planetsRef = useRef([])
  const isVisibleRef = useRef(true)

  const animationRef = useRef(null)

  const [planets, setPlanets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  /**
   * FETCH PLANETS (SAFE)
   */
  useEffect(() => {
    let isMounted = true

    const fetchPlanets = async () => {
      try {
        const res = await api.get('/anchors/planets')
        if (isMounted) setPlanets(res.data.planets)
      } catch (err) {
        console.error('Error fetching planets:', err)
        if (isMounted) setError('Failed to load planets')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchPlanets()

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * THREE.JS SCENE
   */
  useEffect(() => {
    if (!containerRef.current || planets.length === 0) return

    const container = containerRef.current

    const width = container.clientWidth
    const height = container.clientHeight

    /**
     * CLEAN OLD SCENE (IMPORTANT FIX)
     */
    if (rendererRef.current) {
      cancelAnimationFrame(animationRef.current)
      container.removeChild(rendererRef.current.domElement)
      rendererRef.current.dispose()
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000)
    camera.position.z = 50
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    /**
     * LIGHTS
     */
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))

    const pointLight = new THREE.PointLight(0xffffff, 0.8)
    pointLight.position.set(100, 100, 100)
    scene.add(pointLight)

    /**
     * PLANETS
     */
    const planetMeshes = []

    const geometry = new THREE.IcosahedronGeometry(3, 4)

    planets.forEach((planet, index) => {
      const color = new THREE.Color(planet.color)

      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.5,
        roughness: 0.5,
        emissive: color,
        emissiveIntensity: 0.2,
      })

      const mesh = new THREE.Mesh(geometry, material)

      const angle = (index / planets.length) * Math.PI * 2
      const radius = 30

      const baseZ = (Math.random() - 0.5) * 20
      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        baseZ
      )

      mesh.userData = {
        planetId: planet.id,
        baseZ,
      }

      scene.add(mesh)
      planetMeshes.push(mesh)
    })

    planetsRef.current = planetMeshes

    /**
     * CLICK HANDLER (FIXED COORDINATES)
     */
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()

      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(planetMeshes)

      if (intersects.length > 0) {
        navigate(`/planets/${intersects[0].object.userData.planetId}`)
      }
    }

    renderer.domElement.addEventListener('click', onClick)

    /**
     * ANIMATION LOOP (SAFE)
     */
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)

      const time = Date.now() * 0.001

      planetMeshes.forEach((mesh, i) => {
        mesh.rotation.x += 0.001
        mesh.rotation.y += 0.002
        mesh.position.z = mesh.userData.baseZ + Math.sin(time + i) * 0.5
      })

      renderer.render(scene, camera)
    }

    animate()

    /**
     * RESIZE HANDLER
     */
    const onResize = () => {
      if (!containerRef.current) return

      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight

      camera.aspect = w / h
      camera.updateProjectionMatrix()

      renderer.setSize(w, h)
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false
        cancelAnimationFrame(animationRef.current)
      } else if (!isVisibleRef.current) {
        isVisibleRef.current = true
        animate()
      }
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibilityChange)

    /**
     * CLEANUP (FIXED + SAFE)
     */
    return () => {
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('click', onClick)

      cancelAnimationFrame(animationRef.current)

      planetMeshes.forEach(mesh => {
        scene.remove(mesh)
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose())
        } else if (mesh.material) {
          mesh.material.dispose()
        }
      })

      geometry.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('resize', onResize)

      renderer.dispose()
    }
  }, [planets, navigate])

  /**
   * UI STATES
   */
  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg p-4 max-w-sm">
        <h3 className="font-semibold mb-2">
          Planets ({planets.length})
        </h3>
        <p className="text-sm text-slate-400">
          Click on a planet to explore its thoughts
        </p>
      </div>
    </div>
  )
}