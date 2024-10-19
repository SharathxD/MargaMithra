"use client"

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import tt from '@tomtom-international/web-sdk-services'
import '@tomtom-international/web-sdk-maps/dist/maps.css'

const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic3ViaGFtcHJlZXQiLCJhIjoiY2toY2IwejF1MDdodzJxbWRuZHAweDV6aiJ9.Ys8MP5kVTk5P9V2TDvnuDg'
const TOMTOM_API_KEY = '9ddViCepPxfLnXAkp7xRjpXPMEXbSUuv'

export default function OptimizedTrafficTool() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [waypoints, setWaypoints] = useState([])
  const [routeDetails, setRouteDetails] = useState({ fastest: {}, shortest: {} })
  const [summary, setSummary] = useState('')

  useEffect(() => {
    if (map.current) return // initialize map only once
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [77.5946, 12.9716], // Center on Bengaluru
      zoom: 12
    })
    map.current.addControl(new mapboxgl.NavigationControl())

    // Initialize TomTom services
    tt.services.fuzzySearch({
      key: TOMTOM_API_KEY,
      query: 'Bengaluru'
    }).catch(error => console.error('Error initializing TomTom services:', error))
  }, [])

  const addWaypoint = () => {
    const newWaypoint = `waypoint-${waypoints.length}`
    setWaypoints([...waypoints, newWaypoint])
  }

  const geocodeLocation = (location) => {
    return new Promise((resolve, reject) => {
      tt.services.fuzzySearch({
        key: TOMTOM_API_KEY,
        query: location
      })
        .then(response => {
          if (response.results && response.results.length > 0) {
            const position = response.results[0].position
            resolve([position.lng, position.lat])
          } else {
            reject('Location not found')
          }
        })
        .catch(error => {
          reject(error)
        })
    })
  }

  const calculateRoute = (startCoord, stopCoord, waypointCoords, routeType, color) => {
    const locations = [startCoord, ...waypointCoords, stopCoord]

    return tt.services.calculateRoute({
      key: TOMTOM_API_KEY,
      locations: locations,
      routeType: routeType,
      traffic: true
    })
      .then(result => {
        if (result.routes && result.routes.length > 0) {
          const routeSummary = result.routes[0].summary
          const distance = routeSummary.lengthInMeters / 1000
          const travelTime = Math.round(routeSummary.travelTimeInSeconds / 60)

          setRouteDetails(prev => ({
            ...prev,
            [routeType]: { 
              distance, 
              travelTime,
              startCoord,
              stopCoord,
              waypoints: waypointCoords
            }
          }))

          updateMapLayer(`${routeType}-route`, result.toGeoJson(), color)
        } else {
          console.error('No routes found in the result.')
          alert('No route found. Please try different locations.')
        }
      })
      .catch(error => {
        console.error('Error calculating route:', error)
        alert('Error calculating route. Please check the console for details.')
      })
  }

  const findRoute = () => {
    const startLocation = document.getElementById('startLocation')?.value
    const stopLocation = document.getElementById('stopLocation')?.value

    if (!startLocation || !stopLocation) {
      alert("Please enter both start and stop locations.")
      return
    }

    const waypointInputs = document.querySelectorAll('.waypoint')
    const waypointAddresses = Array.from(waypointInputs).map(input => input.value).filter(Boolean)

    const geocodePromises = waypointAddresses.map(geocodeLocation)

    Promise.all([geocodeLocation(startLocation), geocodeLocation(stopLocation), ...geocodePromises])
      .then(locations => {
        const startCoord = locations[0]
        const stopCoord = locations[1]
        const waypointCoords = locations.slice(2)

        clearRoute()
        addCustomMarker(startCoord, 'start')
        addCustomMarker(stopCoord, 'stop')

        waypointCoords.forEach((coord, index) => {
          addCustomMarker(coord, 'waypoint')
        })

        setRouteDetails({ fastest: {}, shortest: {} })

        const fastestRoutePromise = calculateRoute(startCoord, stopCoord, waypointCoords, 'fastest', 'purple')
        const shortestRoutePromise = calculateRoute(startCoord, stopCoord, waypointCoords, 'shortest', 'green')

        Promise.all([fastestRoutePromise, shortestRoutePromise])
          .then(() => {
            displayRouteComparison()
          })
          .catch(error => {
            console.error('Error calculating one or both routes:', error)
          })
      })
      .catch(error => {
        console.error('Error geocoding locations:', error)
        alert('Error finding locations. Please check the console for details.')
      })
  }

  const displayRouteComparison = () => {
    const summaryContent = `
      <h2>Route Comparison</h2>
      <table style="width:100%; border-collapse: collapse;">
        <tr>
          <th style="border: 1px solid black; padding: 8px;">Route Type</th>
          <th style="border: 1px solid black; padding: 8px;">Distance (km)</th>
          <th style="border: 1px solid black; padding: 8px;">Estimated Time (mins)</th>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px;">General</td>
          <td style="border: 1px solid black; padding: 8px;">${routeDetails.fastest.distance ? routeDetails.fastest.distance.toFixed(2) : 'N/A'}</td>
          <td style="border: 1px solid black; padding: 8px;">${routeDetails.fastest.travelTime ? routeDetails.fastest.travelTime : 'N/A'}</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px;">Shortest</td>
          <td style="border: 1px solid black; padding: 8px;">${routeDetails.shortest.distance ? routeDetails.shortest.distance.toFixed(2) : 'N/A'}</td>
          <td style="border: 1px solid black; padding: 8px;">${routeDetails.shortest.travelTime ? routeDetails.shortest.travelTime : 'N/A'}</td>
        </tr>
      </table>
    `
    setSummary(summaryContent)
  }

  const addCustomMarker = (coordinate, type) => {
    let markerColor
    if (type === 'start') markerColor = 'green'
    else if (type === 'stop') markerColor = 'red'
    else markerColor = 'blue'

    new mapboxgl.Marker({ color: markerColor })
      .setLngLat(coordinate)
      .addTo(map.current)
  }

  const clearRoute = () => {
    const layers = map.current.getStyle().layers.filter(layer => layer.id.includes('route'))
    layers.forEach(layer => {
      if (map.current.getLayer(layer.id)) {
        map.current.removeLayer(layer.id)
        map.current.removeSource(layer.id)
      }
    })
    setSummary('')
  }

  const updateMapLayer = (layerId, geojson, color) => {
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId)
      map.current.removeSource(layerId)
    }

    map.current.addSource(layerId, {
      type: 'geojson',
      data: geojson
    })

    map.current.addLayer({
      id: layerId,
      type: 'line',
      source: layerId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': color,
        'line-width': 8
      }
    })
  }

  const autocomplete = (inputId) => {
    const inputElement = document.getElementById(inputId)
    const suggestionsElement = document.getElementById(`${inputId}Suggestions`)
    if (!inputElement || !suggestionsElement) return

    suggestionsElement.innerHTML = ''

    if (inputElement.value.length < 2) return

    tt.services.fuzzySearch({
      key: TOMTOM_API_KEY,
      query: inputElement.value,
      limit: 5
    })
      .then(response => {
        suggestionsElement.innerHTML = ''
        response.results.forEach(result => {
          const li = document.createElement('li')
          li.textContent = result.address.freeformAddress
          li.onclick = function () {
            inputElement.value = result.address.freeformAddress
            suggestionsElement.innerHTML = ''
          }
          suggestionsElement.appendChild(li)
        })
      })
      .catch(error => {
        console.error('Error fetching autocomplete results:', error)
      })
  }

  const clearWaypoints = () => {
    setWaypoints([])
    setRouteDetails({ fastest: {}, shortest: {} })
    setSummary('')
  }

  const navigateShortestRoute = () => {
    if (!routeDetails.shortest.distance) {
      alert("Shortest route is not calculated yet.")
      return
    }

    const startLocation = document.getElementById('startLocation')?.value
    const stopLocation = document.getElementById('stopLocation')?.value

    const waypoints = routeDetails.shortest.waypoints || []
    const waypointsParam = waypoints.map(coord => `${coord[1]},${coord[0]}`).join('|')

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startLocation)}&destination=${encodeURIComponent(stopLocation)}&waypoints=${waypointsParam}`

    window.open(googleMapsUrl, '_blank')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Optimized Traffic Tool</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <input
              type="text"
              id="startLocation"
              placeholder="Start Location"
              className="w-full p-2 mb-2 border rounded"
              onKeyUp={() => autocomplete('startLocation')}
            />
            <ul id="startSuggestions" className="suggestions"></ul>

            <input
              type="text"
              id="stopLocation"
              placeholder="Stop Location"
              className="w-full p-2 mb-2 border rounded"
              onKeyUp={() => autocomplete('stopLocation')}
            />
            <ul id="stopSuggestions" className="suggestions"></ul>

            <div id="waypoints">
              {waypoints.map((waypoint, index) => (
                <input
                  key={waypoint}
                  type="text"
                  id={waypoint}
                  placeholder={`Waypoint ${index + 1}`}
                  className="w-full p-2 mb-2 border rounded waypoint"
                  onKeyUp={() => autocomplete(waypoint)}
                />
              ))}
            </div>
            <button
              onClick={addWaypoint}
              className="w-full p-2 mb-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Waypoint
            </button>
            <button
              onClick={findRoute}
              className="w-full p-2 mb-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Find Optimized Route
            </button>
            <button
              onClick={clearWaypoints}
              className="w-full p-2 mb-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Waypoints
            </button>
            <button
              onClick={navigateShortestRoute}
              className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Navigate Shortest Route
            </button>
          </div>
        </div>
        <div className="lg:w-2/3">
          <div ref={mapContainer} className="h-[720px] rounded-lg shadow-md" />
        </div>
      </div>
      <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
        <div id="summary" dangerouslySetInnerHTML={{ __html: summary }}></div>
        <div id="incident-notifications"></div>
      </div>
    </div>
  )
}