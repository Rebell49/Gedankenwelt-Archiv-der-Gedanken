import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'

export function useThreeScene(containerRef, planets, onPlanetClick) {
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const planetMeshesRef = useRef([])
  const animationIdRef = useRef(null)

  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())

  const geometryRef = useRef(null)
  const lightsRef = useRef({})

  /**
   * CLEANUP (100% SAFE)
   */
  const cleanup = useCallback(() => {
    cancelAnimationFrame(animationIdRef.current)
    animationIdRef.current = null

    const scene = sceneRef.current
    const renderer = rendererRef.current

    // Dispose meshes
    planetMeshesRef.current.forEach(mesh => {
      mesh.geometry?.dispose()
      mesh.material?.dispose()
      scene?.remove(mesh)
    })
    planetMeshesRef.current = []

    // Dispose shared geometry
    geometryRef.current?.dispose()
    geometryRef.current = null

    // Dispose lights
    if (scene) {
      Object.values(lightsRef.current).forEach(light => scene.remove(light))
      lightsRef.current = {}
    }

    // Remove renderer
    if (renderer && containerRef.current?.contains(renderer.domElement)) {
      containerRef.current.removeChild(renderer.domElement)
      renderer.dispose()
    }

    sceneRef.current = null
    cameraRef.current = null
    rendererRef.current = null
  }, [containerRef])

  /**
   * INIT SCENE
   */
  const initScene = useCallback(() => {
    if (!containerRef.current || planets.length === 0) return

    cleanup()

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // SCENE
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0f172a)
    sceneRef.current = scene

    // CAMERA
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 10000)
    camera.position.z = 50
    cameraRef.current = camera

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // LIGHTS (cached)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    const pointLight = new THREE.PointLight(0xffffff, 0.8)
    pointLight.position.set(100, 100, 100)

    scene.add(ambientLight, pointLight)
    lightsRef.current = { ambientLight, pointLight }

    // SHARED GEOMETRY (BIG PERFORMANCE WIN)
    const geometry = new THREE.IcosahedronGeometry(3, 4)
    geometryRef.current = geometry

    // PLANETS
    const meshes = planets.map((planet, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(planet.color),
        metalness: 0.5,
        roughness: 0.5,
        emissive: new THREE.Color(planet.color),
        emissiveIntensity: 0.2,
      })

      const mesh = new THREE.Mesh(geometry, material)

      const angle = (index / planets.length) * Math.PI * 2
      const radius = 30

      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (Math.random() - 0.5) * 20
      )

      mesh.userData.planetId = planet.id

      scene.add(mesh)
      return mesh
    })

    planetMeshesRef.current = meshes

    /**
     * CLICK HANDLER
     */
    const onClick = (event) => {
      const rect = renderer.domElement.getBoundingClientRect()

      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, camera)

      const intersects = raycasterRef.current.intersectObjects(meshes)

      if (intersects.length > 0) {
        onPlanetClick?.(intersects[0].object.userData.planetId)
      }
    }

    renderer.domElement.addEventListener('click', onClick)

    /**
     * ANIMATION LOOP
     */
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)

      const time = Date.now() * 0.001

      meshes.forEach((mesh, i) => {
        mesh.rotation.x += 0.001
        mesh.rotation.y += 0.002
        mesh.position.z += Math.sin(time + i) * 0.01
      })

      renderer.render(scene, camera)
    }

    animate()

    /**
     * RESIZE
     */
    const onResize = () => {
      if (!containerRef.current) return

      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight

      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', onResize)

    /**
     * CLEAN RETURN
     */
    return () => {
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('click', onClick)
      cleanup()
    }
  }, [containerRef, planets, onPlanetClick, cleanup])

  /**
   * REBUILD WHEN DATA CHANGES
   */
  useEffect(() => {
    const cleanupFn = initScene()
    return cleanupFn
  }, [initScene])

  return {
    sceneRef,
    cameraRef,
    rendererRef,
  }
}