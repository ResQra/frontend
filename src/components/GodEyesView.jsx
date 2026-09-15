// God Eyes 3D — Nepal-Locked Spatial Intelligence & Digital Twin (Rautahat Sector)
//
// Native high-performance WebGL 3D Tactical Digital Twin built with Three.js.
// Renders the Rautahat flood basin, Bagmati & Lalbakaiya river corridors, 3D terrain elevation,
// live distress beacons, rescue fleet tracking, water gauge telemetry, and tactical CCTV / UAV feeds.
// Also maintains an optional bridge to upstream GEV if served on port 4173.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  Eye,
  Globe,
  Compass,
  Layers,
  Video,
  RotateCcw,
  Crosshair,
  AlertTriangle,
  Waves,
  X,
  Play,
  Pause,
  ExternalLink,
  Maximize2,
  Check,
} from 'lucide-react'

// Sector coordinate bounds: Rautahat District, Nepal
const RAUTAHAT_CENTER = { lat: 26.85, lng: 85.28 }
const LAT_SCALE = 160
const LNG_SCALE = 160

function coordTo3D(lat, lng, y = 0) {
  const x = (lng - RAUTAHAT_CENTER.lng) * LNG_SCALE
  const z = -(lat - RAUTAHAT_CENTER.lat) * LAT_SCALE
  return new THREE.Vector3(x, y, z)
}

const TACTICAL_CAMERAS = [
  {
    id: 'cam_bagmati_breach',
    name: 'Bagmati East Embankment Breach',
    location: 'Gaur Ward 4 Embankment Breach',
    lat: 26.762,
    lng: 85.276,
    type: 'Optical 4K Flood Cam',
    status: 'LIVE',
    elevation: '74m MSL',
    bearing: '142° SE',
    telemetry: 'Water Depth: 1.85m | Flow: 3.2 m/s',
  },
  {
    id: 'cam_tikuliya_ghat',
    name: 'Tikuliya Ghat River Monitor',
    location: 'Lalbakaiya River Embankment',
    lat: 26.784,
    lng: 85.241,
    type: 'IR Night & Hydrology Cam',
    status: 'LIVE',
    elevation: '79m MSL',
    bearing: '285° WNW',
    telemetry: 'Water Depth: 2.10m | Status: OVERFLOW',
  },
  {
    id: 'cam_gaur_customs',
    name: 'Gaur Customs & Border Outpost',
    location: 'APF Border Checkpoint / Bairgania Road',
    lat: 26.767,
    lng: 85.292,
    type: 'PTZ Perimeter Security',
    status: 'LIVE',
    elevation: '72m MSL',
    bearing: '180° S',
    telemetry: 'Road: PARTIALLY SUBMERGED',
  },
  {
    id: 'cam_bagmati_bridge',
    name: 'Bagmati Main Highway Bridge',
    location: 'Bagmati Gaur Crossing',
    lat: 26.775,
    lng: 85.285,
    type: 'Hydrologic Gauge Cam',
    status: 'LIVE',
    elevation: '76m MSL',
    bearing: '090° E',
    telemetry: 'Gauge: 6.80m / Danger 4.50m (CRITICAL)',
  },
  {
    id: 'cam_garuda_hub',
    name: 'Garuda Relief & Triage Hub',
    location: 'Garuda Municipality Center',
    lat: 26.965,
    lng: 85.315,
    type: 'Wide-Angle Staging Cam',
    status: 'LIVE',
    elevation: '92m MSL',
    bearing: '045° NE',
    telemetry: 'Capacity: 450 / Occupancy: 382',
  },
  {
    id: 'cam_chandrapur_corridor',
    name: 'Chandrapur Highway Corridor',
    location: 'East-West Highway Evacuation Route',
    lat: 27.125,
    lng: 85.34,
    type: 'Traffic & Weather Cam',
    status: 'LIVE',
    elevation: '148m MSL',
    bearing: '010° N',
    telemetry: 'Highway: CLEAR | Evacuation Staging OK',
  },
  {
    id: 'cam_uav_scout_alpha',
    name: 'UAV Drone Scout Alpha',
    location: 'Aerial Recon (Gaur Sector Patrol)',
    lat: 26.77,
    lng: 85.265,
    type: 'Airborne FLIR Thermal UAV',
    status: 'AIRBORNE',
    elevation: '240m AGL',
    bearing: 'ORBITING',
    telemetry: 'Battery: 78% | FLIR Hotspots: 4 Detected',
  },
]

const RIVER_GAUGES = [
  {
    station: 'Bagmati Gaur Bridge',
    lat: 26.775,
    lng: 85.285,
    level_m: 6.8,
    danger_level_m: 4.5,
    status: 'DANGER_OVERFLOW',
    trend: '+0.15m/hr',
  },
  {
    station: 'Lalbakaiya Tikuliya',
    lat: 26.784,
    lng: 85.241,
    level_m: 5.4,
    danger_level_m: 3.8,
    status: 'EMBANKMENT_BREACH',
    trend: '+0.22m/hr',
  },
  {
    station: 'Jhanjh River Basin',
    lat: 26.83,
    lng: 85.26,
    level_m: 3.1,
    danger_level_m: 3.0,
    status: 'HIGH_ALERT',
    trend: '+0.05m/hr',
  },
]

const GEV_URL = (import.meta.env.VITE_GEV_URL || 'http://127.0.0.1:4173').replace(/\/$/, '')
const RESQRA_API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function GodEyesView(props) {
  const {
    incidents = [],
    teams = [],
    shelters = [],
    selectedIncidentId,
    onIncidentSelect,
  } = props

  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  const reqIdRef = useRef(null)
  const interactiveObjectsRef = useRef([])

  // Mode: 'sector' (Rautahat 3D Terrain) vs 'globe' (Macro Orbit) vs 'upstream' (iframe if online)
  const [viewMode, setViewMode] = useState('sector')
  const [mapStyle, setMapStyle] = useState('satellite') // 'satellite', 'dark', 'thermal'
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraDrawerOpen, setCameraDrawerOpen] = useState(false)
  const [layerMenuOpen, setLayerMenuOpen] = useState(false)
  const [activeCamera, setActiveCamera] = useState(null)
  const [cameraFilter, setCameraFilter] = useState('')
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [upstreamAvailable, setUpstreamAvailable] = useState(false)
  const [gisData, setGisData] = useState(null)
  const [layers, setLayers] = useState({
    incidents: true,
    teams: true,
    shelters: true,
    rivers: true,
    floodExtent: true,
    gauges: true,
    districtBoundary: true,
    grid: true,
  })

  // Fetch real GIS digital twin features
  useEffect(() => {
    let active = true
    async function loadGis() {
      try {
        const res = await fetch('/api/public/twin-layers')
        if (res.ok) {
          const data = await res.json()
          if (active) setGisData(data)
        }
      } catch {
        // Fallback to built-in parametric vectors
      }
    }
    loadGis()
    return () => {
      active = false
    }
  }, [])

  // Check if upstream GEV is actually running on port 4173 in the background
  useEffect(() => {
    let active = true
    async function probe() {
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 2000)
        await fetch(`${GEV_URL}/`, { mode: 'no-cors', signal: ctrl.signal })
        clearTimeout(timer)
        if (active) setUpstreamAvailable(true)
      } catch {
        if (active) setUpstreamAvailable(false)
      }
    }
    probe()
    const interval = setInterval(probe, 10000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  // Camera animation target
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0))
  const currentLookAtRef = useRef(new THREE.Vector3(0, 0, 0))

  // Mouse interaction state
  const isDraggingRef = useRef(false)
  const previousMousePositionRef = useRef({ x: 0, y: 0 })
  const sphericalRef = useRef({ radius: 75, theta: Math.PI / 4, phi: Math.PI / 3.5 })

  // Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || Math.max(window.innerHeight - 80, 550)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(mapStyle === 'satellite' ? 0x050b14 : 0x020617)
    scene.fog = new THREE.FogExp2(mapStyle === 'satellite' ? 0x050b14 : 0x020617, 0.007)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 2000)
    camera.position.set(0, 55, 55)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4)
    sunLight.position.set(60, 100, 40)
    sunLight.castShadow = true
    scene.add(sunLight)

    const tacticalCyanLight = new THREE.PointLight(0x00f2fe, 1.2, 200)
    tacticalCyanLight.position.set(-30, 40, -20)
    scene.add(tacticalCyanLight)

    const alertRedLight = new THREE.PointLight(0xff3b30, 0.8, 150)
    alertRedLight.position.set(10, 20, 20)
    scene.add(alertRedLight)

    // Build 3D Rautahat Sector Digital Twin
    const sectorGroup = new THREE.Group()
    sectorGroup.name = 'sectorGroup'
    scene.add(sectorGroup)

    // 1. Terrain Mesh
    const terrainGeo = new THREE.PlaneGeometry(80, 70, 64, 64)
    terrainGeo.rotateX(-Math.PI / 2)

    // Sculpt terrain: higher in north (Chandrapur hills), low river basin in south (Gaur)
    const posAttr = terrainGeo.attributes.position
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i)
      const vz = posAttr.getZ(i)
      // Elevation gradient: higher towards north (negative z)
      let elev = Math.max(0, -vz * 0.15)
      // Slight hilly undulation
      elev += Math.sin(vx * 0.15) * Math.cos(vz * 0.12) * 1.5
      // Carve out Bagmati river gorge around x = 8 to 15
      const bagmatiDist = Math.abs(vx - (8 + vz * 0.1))
      if (bagmatiDist < 4) {
        elev -= (4 - bagmatiDist) * 1.2
      }
      // Carve out Lalbakaiya river around x = -10 to -15
      const lalbakaiyaDist = Math.abs(vx - (-12 + vz * 0.05))
      if (lalbakaiyaDist < 3.5) {
        elev -= (3.5 - lalbakaiyaDist) * 1.0
      }
      posAttr.setY(i, Math.max(elev, -0.5))
    }
    terrainGeo.computeVertexNormals()

    // Terrain material with texture / contour styling
    const terrainMat = new THREE.MeshStandardMaterial({
      color: mapStyle === 'dark' ? 0x0f172a : mapStyle === 'thermal' ? 0x1e1b4b : 0x1e293b,
      roughness: 0.85,
      metalness: 0.15,
      flatShading: true,
    })
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat)
    terrainMesh.receiveShadow = true
    sectorGroup.add(terrainMesh)

    // 2. Wireframe / Contour Grid Overlay
    const wireMat = new THREE.LineBasicMaterial({
      color: mapStyle === 'thermal' ? 0x6366f1 : 0x38bdf8,
      transparent: true,
      opacity: 0.18,
    })
    const wireGeo = new THREE.WireframeGeometry(terrainGeo)
    const wireframe = new THREE.LineSegments(wireGeo, wireMat)
    wireframe.position.y += 0.05
    sectorGroup.add(wireframe)

    // 3. Bagmati & Lalbakaiya River 3D Ribbons
    const makeRiverMesh = (points, color, width) => {
      const curve = new THREE.CatmullRomCurve3(points)
      const riverGeo = new THREE.TubeGeometry(curve, 40, width, 8, false)
      const riverMat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.2,
        metalness: 0.8,
        emissive: color,
        emissiveIntensity: 0.25,
      })
      return new THREE.Mesh(riverGeo, riverMat)
    }

    // Bagmati River curve (East)
    const bagmatiPoints = [
      new THREE.Vector3(12, 1.2, -35),
      new THREE.Vector3(10, 0.4, -20),
      new THREE.Vector3(11, -0.1, -5),
      new THREE.Vector3(9, -0.4, 12),
      new THREE.Vector3(8, -0.5, 30),
    ]
    const bagmatiRiver = makeRiverMesh(bagmatiPoints, 0x0284c7, 0.9)
    sectorGroup.add(bagmatiRiver)

    // Lalbakaiya River curve (West)
    const lalbakaiyaPoints = [
      new THREE.Vector3(-14, 1.0, -35),
      new THREE.Vector3(-13, 0.2, -18),
      new THREE.Vector3(-12, -0.2, -2),
      new THREE.Vector3(-11, -0.4, 14),
      new THREE.Vector3(-10, -0.5, 30),
    ]
    const lalbakaiyaRiver = makeRiverMesh(lalbakaiyaPoints, 0x0ea5e9, 0.7)
    sectorGroup.add(lalbakaiyaRiver)

    // 4. Inundated Flood Water Layer (Volumetric animated water plane)
    const floodGeo = new THREE.PlaneGeometry(45, 35)
    floodGeo.rotateX(-Math.PI / 2)
    const floodMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.6,
      emissive: 0x0369a1,
      emissiveIntensity: 0.2,
    })
    const floodMesh = new THREE.Mesh(floodGeo, floodMat)
    floodMesh.position.set(0, 0.15, 14) // Centered over Gaur southern flood zone
    floodMesh.name = 'floodLayer'
    sectorGroup.add(floodMesh)

    // 5. Starfield & Space Background (for Macro Globe mode)
    const globeGroup = new THREE.Group()
    globeGroup.name = 'globeGroup'
    globeGroup.visible = false
    scene.add(globeGroup)

    const earthGeo = new THREE.SphereGeometry(18, 64, 64)
    // Procedural Earth surface canvas texture
    const earthCanvas = document.createElement('canvas')
    earthCanvas.width = 1024
    earthCanvas.height = 512
    const ctx = earthCanvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#081426'
      ctx.fillRect(0, 0, 1024, 512)
      ctx.fillStyle = '#1e3a5f'
      ctx.beginPath()
      ctx.ellipse(650, 240, 180, 120, -0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(660, 210, 60, 20)
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(690, 222, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    const earthTex = new THREE.CanvasTexture(earthCanvas)
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.6,
      metalness: 0.2,
    })
    const earthMesh = new THREE.Mesh(earthGeo, earthMat)
    globeGroup.add(earthMesh)

    // Atmosphere glow ring
    const atmosGeo = new THREE.SphereGeometry(18.6, 32, 32)
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    })
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat)
    globeGroup.add(atmosMesh)

    // Nepal target pin on globe
    const pinGeo = new THREE.CylinderGeometry(0.2, 0.05, 3, 8)
    pinGeo.rotateX(Math.PI / 2)
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xef4444 })
    const pinMesh = new THREE.Mesh(pinGeo, pinMat)
    pinMesh.position.set(6.8, 8.2, 14.5)
    pinMesh.lookAt(0, 0, 0)
    globeGroup.add(pinMesh)

    // 6. Stars background particles
    const starGeo = new THREE.BufferGeometry()
    const starCount = 600
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 600
      starPos[i + 1] = Math.random() * 300 + 20
      starPos[i + 2] = (Math.random() - 0.5) * 600
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.7 })
    const starPoints = new THREE.Points(starGeo, starMat)
    scene.add(starPoints)

    // Mouse Controls (Orbit / Zoom / Pan)
    const onMouseDown = (e) => {
      isDraggingRef.current = true
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return

      const deltaX = e.clientX - previousMousePositionRef.current.x
      const deltaY = e.clientY - previousMousePositionRef.current.y

      sphericalRef.current.theta -= deltaX * 0.007
      sphericalRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI / 2.05, sphericalRef.current.phi + deltaY * 0.006)
      )

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => {
      isDraggingRef.current = false
    }

    const onWheel = (e) => {
      e.preventDefault()
      sphericalRef.current.radius = Math.max(
        15,
        Math.min(180, sphericalRef.current.radius + e.deltaY * 0.06)
      )
    }

    // Raycast on click to select entities
    const onClick = (e) => {
      const rect = canvasRef.current.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, cameraRef.current)
      const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, true)

      if (intersects.length > 0) {
        let hit = intersects[0].object
        while (hit && !hit.userData?.entity && hit.parent) {
          hit = hit.parent
        }
        if (hit && hit.userData?.entity) {
          const ent = hit.userData.entity
          setSelectedEntity(ent)
          if (ent.type === 'incident' && onIncidentSelect) {
            onIncidentSelect(ent.data)
          }
          if (ent.type === 'camera') {
            setActiveCamera(ent.data)
          }
        }
      }
    }

    const canvasEl = canvasRef.current
    canvasEl.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    canvasEl.addEventListener('wheel', onWheel, { passive: false })
    canvasEl.addEventListener('click', onClick)

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect
        if (w > 0 && h > 0) {
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
      }
    })
    resizeObserver.observe(container)

    // Animation Loop
    let clock = new THREE.Clock()
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      // Auto rotation if active
      if (autoRotate) {
        sphericalRef.current.theta += 0.003
      }

      // Compute camera position from spherical coords
      const s = sphericalRef.current
      const camX = targetLookAtRef.current.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta)
      const camY = targetLookAtRef.current.y + s.radius * Math.cos(s.phi)
      const camZ = targetLookAtRef.current.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta)

      // Smooth camera interpolation
      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.08)
      currentLookAtRef.current.lerp(targetLookAtRef.current, 0.08)
      camera.lookAt(currentLookAtRef.current)

      // Subtle water wave breathing effect
      if (floodMesh) {
        floodMesh.position.y = 0.15 + Math.sin(elapsedTime * 1.5) * 0.08
      }

      // Animate interactive beacons (pulsing scale & emissive)
      interactiveObjectsRef.current.forEach((obj) => {
        if (obj.userData?.pulse) {
          const scale = 1 + Math.sin(elapsedTime * 4 + obj.userData.phase) * 0.15
          obj.scale.set(scale, scale, scale)
        }
      })

      // Globe slow spin if visible
      if (globeGroup.visible) {
        earthMesh.rotation.y += 0.002
      }

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(reqIdRef.current)
      resizeObserver.disconnect()
      canvasEl.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      canvasEl.removeEventListener('wheel', onWheel)
      canvasEl.removeEventListener('click', onClick)
      renderer.dispose()
    }
  }, [mapStyle, autoRotate, onIncidentSelect])

  // Switch between Sector 3D mode and Macro Globe mode
  useEffect(() => {
    if (!sceneRef.current) return
    const sectorGroup = sceneRef.current.getObjectByName('sectorGroup')
    const globeGroup = sceneRef.current.getObjectByName('globeGroup')

    if (viewMode === 'sector') {
      if (sectorGroup) sectorGroup.visible = true
      if (globeGroup) globeGroup.visible = false
      targetLookAtRef.current.set(0, 0, 10)
      sphericalRef.current.radius = 65
      sphericalRef.current.phi = Math.PI / 3.2
    } else if (viewMode === 'globe') {
      if (sectorGroup) sectorGroup.visible = false
      if (globeGroup) globeGroup.visible = true
      targetLookAtRef.current.set(0, 0, 0)
      sphericalRef.current.radius = 48
      sphericalRef.current.phi = Math.PI / 2.2
    }
  }, [viewMode])

  // Render Real GeoJSON boundaries if loaded
  useEffect(() => {
    if (!gisData || !sceneRef.current) return
    const sectorGroup = sceneRef.current.getObjectByName('sectorGroup')
    if (!sectorGroup) return

    const priorGis = sectorGroup.getObjectByName('gisVectorLayers')
    if (priorGis) sectorGroup.remove(priorGis)

    const gisGroup = new THREE.Group()
    gisGroup.name = 'gisVectorLayers'
    sectorGroup.add(gisGroup)

    // District Boundary Line
    if (layers.districtBoundary && gisData.district?.features) {
      gisData.district.features.forEach((feat) => {
        const coords = feat.geometry?.coordinates?.[0] || []
        if (coords.length > 0) {
          const points = coords.map((c) => coordTo3D(c[1], c[0], 0.2))
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
          const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2, transparent: true, opacity: 0.6 })
          gisGroup.add(new THREE.Line(lineGeo, lineMat))
        }
      })
    }

    // Municipalities Boundaries
    if (gisData.municipalities?.features) {
      gisData.municipalities.features.forEach((feat) => {
        const coords = feat.geometry?.coordinates?.[0] || []
        if (coords.length > 0) {
          const points = coords.map((c) => coordTo3D(c[1], c[0], 0.1))
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
          const lineMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.35 })
          gisGroup.add(new THREE.Line(lineGeo, lineMat))
        }
      })
    }
  }, [gisData, layers.districtBoundary])

  // Populate Interactive 3D Objects (Incidents, Teams, Shelters, Cameras, Gauges)
  useEffect(() => {
    if (!sceneRef.current) return
    const sectorGroup = sceneRef.current.getObjectByName('sectorGroup')
    if (!sectorGroup) return

    // Remove prior dynamic markers
    const priorMarkers = sectorGroup.getObjectByName('dynamicMarkers')
    if (priorMarkers) {
      sectorGroup.remove(priorMarkers)
    }

    const markersGroup = new THREE.Group()
    markersGroup.name = 'dynamicMarkers'
    sectorGroup.add(markersGroup)

    const interactiveList = []

    // 1. Distress Incident Beacons
    if (layers.incidents) {
      incidents.forEach((inc, idx) => {
        const lat = inc.location?.lat ? parseFloat(inc.location.lat) : RAUTAHAT_CENTER.lat - 0.08 + (idx % 3) * 0.03
        const lng = inc.location?.lng ? parseFloat(inc.location.lng) : RAUTAHAT_CENTER.lng - 0.02 + (idx % 2) * 0.04
        const pos = coordTo3D(lat, lng, 0.4)

        const isCritical = inc.urgency === 'HIGH' || inc.priority?.level === 'CRITICAL' || inc.people >= 5
        const color = isCritical ? 0xef4444 : 0xf59e0b

        const incGroup = new THREE.Group()
        incGroup.position.copy(pos)

        // Vertical laser beacon pillar
        const pillarGeo = new THREE.CylinderGeometry(0.2, 0.08, 14, 8)
        pillarGeo.translate(0, 7, 0)
        const pillarMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.75,
        })
        const pillar = new THREE.Mesh(pillarGeo, pillarMat)
        incGroup.add(pillar)

        // Floating diamond head
        const headGeo = new THREE.OctahedronGeometry(0.9, 0)
        headGeo.translate(0, 14, 0)
        const headMat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        })
        const head = new THREE.Mesh(headGeo, headMat)
        head.userData = { pulse: true, phase: idx * 0.5 }
        incGroup.add(head)

        // Radial alert ring on ground
        const ringGeo = new THREE.RingGeometry(1.2, 2.0, 16)
        ringGeo.rotateX(-Math.PI / 2)
        const ringMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        })
        const ring = new THREE.Mesh(ringGeo, ringMat)
        ring.position.y = 0.05
        incGroup.add(ring)

        incGroup.userData = {
          entity: {
            type: 'incident',
            id: inc.id,
            title: inc.location_text || inc.location?.label || `Distress Alert ${inc.id}`,
            data: inc,
          },
        }

        markersGroup.add(incGroup)
        interactiveList.push(incGroup)
      })
    }

    // 2. Rescue Fleet Units (Boats / Amphibious Teams)
    if (layers.teams) {
      teams.forEach((tm, idx) => {
        const lat = tm.location?.lat ? parseFloat(tm.location.lat) : RAUTAHAT_CENTER.lat - 0.09 + idx * 0.02
        const lng = tm.location?.lng ? parseFloat(tm.location.lng) : RAUTAHAT_CENTER.lng - 0.01 + idx * 0.015
        const pos = coordTo3D(lat, lng, 0.5)

        const teamGroup = new THREE.Group()
        teamGroup.position.copy(pos)

        // Sleek Boat hull shape
        const hullGeo = new THREE.ConeGeometry(0.8, 2.2, 5)
        hullGeo.rotateX(-Math.PI / 2)
        const hullMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.6,
          roughness: 0.3,
        })
        const hull = new THREE.Mesh(hullGeo, hullMat)
        teamGroup.add(hull)

        // Team Status Halo
        const haloGeo = new THREE.RingGeometry(1.5, 2.0, 16)
        haloGeo.rotateX(-Math.PI / 2)
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0x22c55e,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        })
        const halo = new THREE.Mesh(haloGeo, haloMat)
        halo.position.y = 0.05
        teamGroup.add(halo)

        teamGroup.userData = {
          entity: {
            type: 'team',
            id: tm.id,
            title: tm.name,
            data: tm,
          },
        }

        markersGroup.add(teamGroup)
        interactiveList.push(teamGroup)
      })
    }

    // 3. Shelters & Health Safe Havens
    if (layers.shelters) {
      shelters.forEach((sh, idx) => {
        const lat = sh.location?.lat ? parseFloat(sh.location.lat) : RAUTAHAT_CENTER.lat - 0.05 + idx * 0.04
        const lng = sh.location?.lng ? parseFloat(sh.location.lng) : RAUTAHAT_CENTER.lng + 0.02 + idx * 0.02
        const pos = coordTo3D(lat, lng, 0.4)

        const shelterGroup = new THREE.Group()
        shelterGroup.position.copy(pos)

        // Safe Dome
        const domeGeo = new THREE.SphereGeometry(1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2)
        const domeMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: 0x059669,
          emissiveIntensity: 0.4,
          roughness: 0.2,
        })
        const dome = new THREE.Mesh(domeGeo, domeMat)
        shelterGroup.add(dome)

        shelterGroup.userData = {
          entity: {
            type: 'shelter',
            id: sh.id,
            title: sh.name,
            data: sh,
          },
        }

        markersGroup.add(shelterGroup)
        interactiveList.push(shelterGroup)
      })
    }

    // 4. Tactical CCTV & Drone Cameras
    TACTICAL_CAMERAS.forEach((cam) => {
      const pos = coordTo3D(cam.lat, cam.lng, 0.4)
      const camGroup = new THREE.Group()
      camGroup.position.copy(pos)

      // Mast
      const mastGeo = new THREE.CylinderGeometry(0.12, 0.12, 6, 8)
      mastGeo.translate(0, 3, 0)
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
      const mast = new THREE.Mesh(mastGeo, mastMat)
      camGroup.add(mast)

      // Camera Head & Optical cone
      const camHeadGeo = new THREE.BoxGeometry(0.8, 0.5, 1.2)
      camHeadGeo.translate(0, 6, 0)
      const camHeadMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.5,
      })
      const camHead = new THREE.Mesh(camHeadGeo, camHeadMat)
      camGroup.add(camHead)

      camGroup.userData = {
        entity: {
          type: 'camera',
          id: cam.id,
          title: cam.name,
          data: cam,
        },
      }

      markersGroup.add(camGroup)
      interactiveList.push(camGroup)
    })

    // 5. River Water Level Gauges
    if (layers.gauges) {
      RIVER_GAUGES.forEach((rg) => {
        const pos = coordTo3D(rg.lat, rg.lng, 0.4)
        const gaugeGroup = new THREE.Group()
        gaugeGroup.position.copy(pos)

        // Gauge Staff
        const staffGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 8)
        staffGeo.translate(0, 4, 0)
        const staffMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
        const staff = new THREE.Mesh(staffGeo, staffMat)
        gaugeGroup.add(staff)

        // Warning Top Beacon
        const beaconGeo = new THREE.SphereGeometry(0.7, 12, 12)
        beaconGeo.translate(0, 8.5, 0)
        const beaconMat = new THREE.MeshStandardMaterial({
          color: rg.status === 'DANGER_OVERFLOW' ? 0xef4444 : 0xf59e0b,
          emissive: rg.status === 'DANGER_OVERFLOW' ? 0xdc2626 : 0xd97706,
          emissiveIntensity: 0.9,
        })
        const beacon = new THREE.Mesh(beaconGeo, beaconMat)
        beacon.userData = { pulse: true, phase: 1.0 }
        gaugeGroup.add(beacon)

        gaugeGroup.userData = {
          entity: {
            type: 'gauge',
            id: rg.station,
            title: `Gauge: ${rg.station}`,
            data: rg,
          },
        }

        markersGroup.add(gaugeGroup)
        interactiveList.push(gaugeGroup)
      })
    }

    interactiveObjectsRef.current = interactiveList
  }, [incidents, teams, shelters, layers])

  // Sync selectedIncidentId with camera position
  useEffect(() => {
    if (!selectedIncidentId || !incidents.length) return
    const inc = incidents.find((i) => i.id === selectedIncidentId)
    if (inc && inc.location) {
      const lat = parseFloat(inc.location.lat)
      const lng = parseFloat(inc.location.lng)
      const targetPos = coordTo3D(lat, lng, 0)
      targetLookAtRef.current.copy(targetPos)
      sphericalRef.current.radius = 35
      sphericalRef.current.phi = Math.PI / 3.6
    }
  }, [selectedIncidentId, incidents])

  // Camera Presets
  const flyToPreset = (presetKey) => {
    setViewMode('sector')
    switch (presetKey) {
      case 'gaur':
        targetLookAtRef.current.set(0, 0, 14)
        sphericalRef.current.radius = 38
        sphericalRef.current.phi = Math.PI / 3.4
        break
      case 'bagmati':
        targetLookAtRef.current.set(10, 0, 10)
        sphericalRef.current.radius = 32
        sphericalRef.current.phi = Math.PI / 3.8
        break
      case 'tikuliya':
        targetLookAtRef.current.set(-12, 0, 12)
        sphericalRef.current.radius = 32
        sphericalRef.current.phi = Math.PI / 3.8
        break
      case 'chandrapur':
        targetLookAtRef.current.set(8, 2, -26)
        sphericalRef.current.radius = 36
        sphericalRef.current.phi = Math.PI / 3.5
        break
      case 'reset':
      default:
        targetLookAtRef.current.set(0, 0, 10)
        sphericalRef.current.radius = 65
        sphericalRef.current.phi = Math.PI / 3.2
        break
    }
  }

  // Toggle layer
  const toggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  // Filter visible cameras in drawer
  const visibleCameras = useMemo(() => {
    const q = cameraFilter.trim().toLowerCase()
    if (!q) return TACTICAL_CAMERAS
    return TACTICAL_CAMERAS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q)
    )
  }, [cameraFilter])

  return (
    <div className="relative flex flex-col w-full h-[calc(100vh-64px)] min-h-[640px] bg-slate-950 overflow-hidden select-none border border-slate-800 rounded-xl shadow-2xl">
      {/* ── TOP HUD HEADER ───────────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Tactical Badge & Active Defcon */}
        <div className="flex items-center gap-2.5 bg-slate-950/90 border border-slate-800 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl pointer-events-auto">
          <div className="relative flex items-center justify-center size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Eye className="size-4.5" />
            <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black tracking-wider text-white">
                GOD EYES 3D
              </span>
              <span className="bg-red-500/20 border border-red-500/40 text-red-300 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded">
                DEFCON 1 RED ALERT
              </span>
            </div>
            <p className="font-mono text-[10px] text-slate-400">
              Rautahat Digital Twin · Gaur–Bagmati Basin (26.85°N, 85.28°E)
            </p>
          </div>
        </div>

        {/* Center: Live Hydrological River Gauges */}
        <div className="hidden lg:flex items-center gap-4 bg-slate-950/90 border border-slate-800 backdrop-blur-md px-4 py-1.5 rounded-xl shadow-xl pointer-events-auto font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <Waves className="size-3.5 text-sky-400 animate-pulse" />
            <span className="text-slate-400 font-medium">Bagmati Gaur:</span>
            <span className="text-red-400 font-black font-mono">6.80m</span>
            <span className="text-[10px] text-red-500 font-bold bg-red-950/60 px-1 py-0.5 rounded border border-red-800">
              ▲ +2.3m OVER DANGER
            </span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-amber-400" />
            <span className="text-slate-400 font-medium">Lalbakaiya Tikuliya:</span>
            <span className="text-amber-400 font-black font-mono">5.40m</span>
            <span className="text-[10px] text-amber-500 font-bold bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800">
              EMBANKMENT BREACH
            </span>
          </div>
        </div>

        {/* Right: Quick View Switchers & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Macro Globe vs Sector Toggle */}
          <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-lg p-0.5 shadow-lg backdrop-blur">
            <button
              onClick={() => setViewMode('sector')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-bold transition ${
                viewMode === 'sector'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="size-3.5" />
              <span>SECTOR 3D</span>
            </button>
            <button
              onClick={() => setViewMode('globe')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-xs font-bold transition ${
                viewMode === 'globe'
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="size-3.5" />
              <span>MACRO GLOBE</span>
            </button>
          </div>

          {/* Layer Selector Button */}
          <div className="relative">
            <button
              onClick={() => setLayerMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold shadow-lg backdrop-blur transition ${
                layerMenuOpen
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Layers className="size-3.5 text-sky-400" />
              <span>LAYERS</span>
            </button>

            {layerMenuOpen && (
              <div className="absolute right-0 top-10 z-50 w-52 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 font-mono text-xs space-y-1">
                {[
                  ['incidents', 'Distress Beacons'],
                  ['teams', 'Rescue Fleet'],
                  ['shelters', 'Safe Havens'],
                  ['rivers', 'Bagmati & Lalbakaiya'],
                  ['floodExtent', '2024 Flood Extent'],
                  ['gauges', 'Hydrology Gauges'],
                  ['districtBoundary', 'District GIS Bounds'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleLayer(key)}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg hover:bg-slate-900 text-left transition"
                  >
                    <span className={layers[key] ? 'text-white' : 'text-slate-500'}>{label}</span>
                    {layers[key] && <Check className="size-3.5 text-emerald-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CCTV Cameras Drawer Button */}
          <button
            onClick={() => setCameraDrawerOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs font-bold shadow-lg backdrop-blur transition ${
              cameraDrawerOpen
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Video className="size-3.5 text-indigo-400" />
            <span>CCTV NETWORK ({TACTICAL_CAMERAS.length})</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-white shadow-lg transition"
          >
            <Maximize2 className="size-3.5" />
          </button>

          {/* Upstream GEV Bridge Status */}
          {upstreamAvailable && (
            <button
              onClick={() => setViewMode((v) => (v === 'upstream' ? 'sector' : 'upstream'))}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-xs font-bold transition ${
                viewMode === 'upstream'
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-slate-950/90 border-purple-500/40 text-purple-300 hover:bg-purple-950/60'
              }`}
            >
              <ExternalLink className="size-3.5" />
              <span>UPSTREAM GEV</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3D CANVAS VIEWPORT ───────────────────────────────────────────── */}
      {viewMode !== 'upstream' ? (
        <div ref={containerRef} className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing">
          <canvas ref={canvasRef} className="block w-full h-full" />

          {/* ── NAVIGATION / PRESETS DOCK (BOTTOM LEFT) ──────────────────── */}
          <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
            <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 p-1.5 rounded-xl shadow-2xl backdrop-blur">
              <span className="font-mono text-[10px] font-black text-slate-400 px-2 uppercase">
                Fly-To:
              </span>
              <button
                onClick={() => flyToPreset('gaur')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[11px] text-white font-bold transition"
              >
                Gaur HQ
              </button>
              <button
                onClick={() => flyToPreset('bagmati')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[11px] text-sky-400 font-bold transition"
              >
                Bagmati Breach
              </button>
              <button
                onClick={() => flyToPreset('tikuliya')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[11px] text-amber-400 font-bold transition"
              >
                Tikuliya Ghat
              </button>
              <button
                onClick={() => flyToPreset('chandrapur')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[11px] text-emerald-400 font-bold transition"
              >
                Chandrapur Hwy
              </button>
              <button
                onClick={() => flyToPreset('reset')}
                title="Reset Camera View"
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          </div>

          {/* ── DISPLAY MODES & MAP STYLES (BOTTOM RIGHT) ─────────────────── */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
            {/* Auto-Rotation Toggle */}
            <button
              onClick={() => setAutoRotate((prev) => !prev)}
              title="Surveillance Orbit Patrol"
              className={`p-2 rounded-xl border backdrop-blur shadow-xl font-mono text-xs font-bold transition ${
                autoRotate
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-slate-950/90 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {autoRotate ? <Pause className="size-4" /> : <Play className="size-4" />}
            </button>

            {/* Shading Style */}
            <div className="flex items-center bg-slate-950/90 border border-slate-800 p-1 rounded-xl shadow-2xl backdrop-blur font-mono text-[11px]">
              {['satellite', 'dark', 'thermal'].map((style) => (
                <button
                  key={style}
                  onClick={() => setMapStyle(style)}
                  className={`px-2.5 py-1 rounded-lg uppercase font-bold transition ${
                    mapStyle === style
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── UPSTREAM GEV IFRAME VIEW (IF RUNNING) ────────────────────────── */
        <div className="relative flex-1 w-full h-full bg-black">
          <iframe
            src={`${GEV_URL}/?resqra=1&resqraApi=${RESQRA_API}`}
            title="Upstream God's Eye View Globe"
            className="w-full h-full border-0"
            allow="geolocation; microphone; camera; autoplay; fullscreen"
          />
          <button
            onClick={() => setViewMode('sector')}
            className="absolute top-16 left-4 z-30 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 font-mono text-xs text-white font-bold hover:bg-slate-900 shadow-2xl"
          >
            ← Return to Native 3D Twin
          </button>
        </div>
      )}

      {/* ── ALL-CAMERAS TACTICAL DRAWER (FLYOUT) ─────────────────────────── */}
      {cameraDrawerOpen && (
        <div className="absolute top-16 left-4 z-40 w-84 max-w-[90vw] max-h-[calc(100%-80px)] flex flex-col bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden font-sans">
          <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Video className="size-4 text-indigo-400" />
              <span className="font-mono text-xs font-black tracking-wider text-white">
                TACTICAL CCTV & UAV
              </span>
            </div>
            <button
              onClick={() => setCameraDrawerOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-2 border-b border-slate-800">
            <input
              type="text"
              placeholder="Filter camera by name / location…"
              value={cameraFilter}
              onChange={(e) => setCameraFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {visibleCameras.map((cam) => (
              <div
                key={cam.id}
                onClick={() => {
                  setActiveCamera(cam)
                  const targetPos = coordTo3D(cam.lat, cam.lng, 0)
                  targetLookAtRef.current.copy(targetPos)
                  sphericalRef.current.radius = 28
                }}
                className={`p-2.5 rounded-xl border cursor-pointer transition ${
                  activeCamera?.id === cam.id
                    ? 'bg-indigo-950/70 border-indigo-500 text-white'
                    : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-white truncate">
                    {cam.name}
                  </span>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                    {cam.status}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-slate-400 truncate">{cam.location}</p>
                <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-indigo-300">
                  <span>{cam.type}</span>
                  <span>{cam.elevation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LIVE TACTICAL CAMERA FEED MODAL ──────────────────────────────── */}
      {activeCamera && (
        <div className="absolute top-16 right-4 z-40 w-96 max-w-[92vw] bg-slate-950/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden font-mono">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-black text-white tracking-wider">LIVE FEED // {activeCamera.name}</span>
            </div>
            <button
              onClick={() => setActiveCamera(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Tactical Video HUD Canvas Simulation */}
          <div className="relative w-full h-52 bg-black flex items-center justify-center overflow-hidden border-b border-slate-800">
            {/* Scanline & Grid Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40 z-10" />
            <div className="absolute inset-0 border border-emerald-500/20 pointer-events-none z-10" />

            {/* Target Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="size-16 border border-emerald-400/40 rounded-full flex items-center justify-center">
                <Crosshair className="size-8 text-emerald-400/70" />
              </div>
            </div>

            {/* Animated Simulated Imagery Canvas */}
            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-center p-4">
              <Waves className="size-12 text-sky-500/50 animate-pulse mb-2" />
              <p className="text-xs font-bold text-sky-300">{activeCamera.telemetry}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                COORDS: {activeCamera.lat.toFixed(4)}°N, {activeCamera.lng.toFixed(4)}°E · BRG: {activeCamera.bearing}
              </p>
            </div>

            {/* HUD Overlays */}
            <div className="absolute top-2 left-2.5 z-20 text-[10px] text-emerald-400 font-bold">
              REC ● 1080p 60FPS
            </div>
            <div className="absolute top-2 right-2.5 z-20 text-[10px] text-emerald-400 font-bold">
              {new Date().toISOString().substring(11, 19)} UTC
            </div>
            <div className="absolute bottom-2 left-2.5 z-20 text-[10px] text-slate-300">
              ELEV: {activeCamera.elevation}
            </div>
            <div className="absolute bottom-2 right-2.5 z-20 text-[10px] text-emerald-400">
              ZOOM: 2.4X [OPTICAL]
            </div>
          </div>

          <div className="p-3 bg-slate-950/90 text-xs text-slate-300 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Location:</span>
              <span className="text-white font-bold">{activeCamera.location}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Sensor Type:</span>
              <span className="text-indigo-300 font-bold">{activeCamera.type}</span>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  const targetPos = coordTo3D(activeCamera.lat, activeCamera.lng, 0)
                  targetLookAtRef.current.copy(targetPos)
                  sphericalRef.current.radius = 24
                }}
                className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-center text-xs transition"
              >
                Center 3D View
              </button>
              <button
                onClick={() => setActiveCamera(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SELECTED ENTITY INSPECTOR CARD (BOTTOM SHEET / POPUP) ───────── */}
      {selectedEntity && (
        <div className="absolute bottom-16 left-4 z-40 w-96 max-w-[92vw] bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-3.5 font-sans">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="font-mono text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                {selectedEntity.type} INSPECTION
              </span>
              <h3 className="font-mono text-sm font-bold text-white leading-tight">
                {selectedEntity.title}
              </h3>
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="size-4" />
            </button>
          </div>

          {selectedEntity.type === 'incident' && (
            <div className="space-y-2 font-mono text-xs">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-slate-300">
                <p className="line-clamp-2 text-[11px] italic">
                  "{selectedEntity.data.raw_text || 'Distress signal received'}"
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">PEOPLE IN PERIL</span>
                  <span className="text-red-400 font-bold text-sm">
                    {selectedEntity.data.people || 1} Persons
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">WATER RISING</span>
                  <span
                    className={`font-bold text-sm ${
                      selectedEntity.data.water_rising ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedEntity.data.water_rising ? 'YES (CRITICAL)' : 'STABLE'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedEntity.type === 'team' && (
            <div className="space-y-2 font-mono text-xs">
              <p className="text-slate-400 text-[11px]">
                Specialization: <span className="text-white">{selectedEntity.data.specialization}</span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">RESCUE CAPACITY</span>
                  <span className="text-sky-400 font-bold text-sm">
                    {selectedEntity.data.capacity} seats
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">STATUS</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {selectedEntity.data.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedEntity.type === 'shelter' && (
            <div className="space-y-2 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">TOTAL CAPACITY</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {selectedEntity.data.capacity || 500} beds
                  </span>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">OCCUPANCY</span>
                  <span className="text-amber-400 font-bold text-sm">
                    {selectedEntity.data.current_occupancy || 0} accommodated
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                if (selectedEntity.data?.location) {
                  const targetPos = coordTo3D(
                    parseFloat(selectedEntity.data.location.lat),
                    parseFloat(selectedEntity.data.location.lng),
                    0
                  )
                  targetLookAtRef.current.copy(targetPos)
                  sphericalRef.current.radius = 26
                }
              }}
              className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-mono text-xs font-bold text-white transition"
            >
              Focus 3D Beacon
            </button>
          </div>
        </div>
      )}
    </div>
  )
}