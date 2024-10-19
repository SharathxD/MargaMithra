"use client"

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import tt from '@tomtom-international/web-sdk-maps'
import '@tomtom-international/web-sdk-maps/dist/maps.css'

export default function OptimizedTrafficTool() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [waypoints, setWaypoints] = useState([])
  const [routeDetails, setRouteDetails] = useState({ fastest: {}, shortest: {} })
  const [summary, setSummary] = useState('')

  useEffect(() => {
    if (map.current) return // initialize map only once
    mapboxgl.accessToken = 'pk.eyJ1Ijoic3ViaGFtcHJlZXQiLCJhIjoiY2toY2IwejF1MDdodzJxbWRuZHAweDV6aiJ9.Ys8MP5kVTk5P9V2TDvnuDg'
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [77.5946, 12.9716], // Center on Bengaluru
      zoom: 12
    })
    map.current.addControl(new mapboxgl.NavigationControl())
  }, [])

  const addWaypoint = () => {
    const newWaypoint = `waypoint-${waypoints.length}`
    setWaypoints([...waypoints, newWaypoint])
  }

  const geocodeLocation = (location) => {
    return new Promise((resolve, reject) => {
      tt.services.fuzzySearch({
        key: '9ddViCepPxfLnXAkp7xRjpXPMEXbSUuv',
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
      key: '9ddViCepPxfLnXAkp7xRjpXPMEXbSUuv',
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
            [routeType]: { distance, travelTime }
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
          addCustomMarker(coord, `waypoint-${index + 1}`)
        })

        setRouteDetails({ fastest: {}, shortest: {} })

        const fastestRoutePromise = calculateRoute(startCoord, stopCoord, waypointCoords, 'fastest', 'orange')
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
      <h2 class="text-xl font-bold mb-2">Route Comparison</h2>
      <table class="w-full border-collapse">
        <tr>
          <th class="border border-gray-400 p-2">Route Type</th>
          <th class="border border-gray-400 p-2">Distance (km)</th>
          <th class="border border-gray-400 p-2">Estimated Time (mins)</th>
        </tr>
        <tr>
          <td class="border border-gray-400 p-2">Fastest</td>
          <td class="border border-gray-400 p-2">${routeDetails.fastest.distance ? routeDetails.fastest.distance.toFixed(2) : 'N/A'}</td>
          <td class="border border-gray-400 p-2">${routeDetails.fastest.travelTime ? routeDetails.fastest.travelTime : 'N/A'}</td>
        </tr>
        <tr>
          <td class="border border-gray-400 p-2">Shortest</td>
          <td class="border border-gray-400 p-2">${routeDetails.shortest.distance ? routeDetails.shortest.distance.toFixed(2) : 'N/A'}</td>
          <td class="border border-gray-400 p-2">${routeDetails.shortest.travelTime ? routeDetails.shortest.travelTime : 'N/A'}</td>
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
        'line-width': 4
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
      key: '9ddViCepPxfLnXAkp7xRjpXPMEXbSUuv',
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
              className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Waypoints
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