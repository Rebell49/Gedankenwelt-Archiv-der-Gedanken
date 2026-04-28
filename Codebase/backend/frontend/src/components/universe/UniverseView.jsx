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
  const [planets, setPlanets] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch planets from API
    const fetchPlanets = async () => {
      try {
        const res = await api.get('/anchors/planets')
        setPlanets(res.data.planets)
      } catch (error) {
        console.error('Error fetching planets:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlanets()
  }, [])

  useEffect(() => {
    if (!containerRef.current || planets.length === 0) return

    // Initialize Three.js scene
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000)
    camera.position.z = 50
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0xffffff, 0.8)
    pointLight.position.set(100, 100, 100)
    scene.add(pointLight)

    // Create planets
    const planetMeshes = []
    planets.forEach((planet, index) => {
      const geometry = new THREE.IcosahedronGeometry(3, 4)
      const color = new THREE.Color(planet.color)
      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.5,
        roughness: 0.5,
        emissive: color,
        emissiveIntensity: 0.2,
      })
      const mesh = new THREE.Mesh(geometry, material)

      // Position planets in a circular formation
      const angle = (index / planets.length) * Math.PI * 2
      const radius = 30
      mesh.position.x = Math.cos(angle) * radius
      mesh.position.y = Math.sin(angle) * radius
      mesh.position.z = (Math.random() - 0.5) * 20

      mesh.userData = { planetId: planet.id }
      scene.add(mesh)
      planetMeshes.push(mesh)
    })
    planetsRef.current = planetMeshes

    // Mouse interaction
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const onMouseClick = (event) => {
      mouse.x = (event.clientX / width) * 2 - 1
      mouse.y = -(event.clientY / height) * 2 + 1

      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(planetMeshes)

      if (intersects.length > 0) {
        const planetId = intersects[0].object.userData.planetId
        navigate(`/planets/${planetId}`)
      }
    }

    renderer.domElement.addEventListener('click', onMouseClick)

    // Animation loop
    let animationId
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      // Rotate planets
      planetMeshes.forEach((mesh, index) => {
        mesh.rotation.x += 0.001
        mesh.rotation.y += 0.002

        // Gentle floating animation
        const time = Date.now() * 0.001
        mesh.position.z += Math.sin(time + index) * 0.01
      })

      renderer.render(scene, camera)
    }
    animate()

    // Handle window resize
    const onWindowResize = () => {
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }
    window.addEventListener('resize', onWindowResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize)
      renderer.domElement.removeEventListener('click', onMouseClick)
      cancelAnimationFrame(animationId)
      containerRef.current?.removeChild(renderer.domElement)
      geometry.dispose()
      renderer.dispose()
    }
  }, [planets, navigate])

  if (loading) return <LoadingSpinner />

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-lg p-4 max-w-sm">
        <h3 className="font-semibold mb-2">Planets ({planets.length})</h3>
        <p className="text-sm text-slate-400">Click on a planet to explore its thoughts</p>
      </div>
    </div>
  )
}
