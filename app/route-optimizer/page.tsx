'use client'

import React, { useEffect, useState, useRef } from "react";
import dynamic from 'next/dynamic';

const OptimizedTrafficTool = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [routeDetails, setRouteDetails] = useState<{
    fastest: { distance?: number; travelTime?: number; startCoord?: [number, number]; stopCoord?: [number, number]; waypoints?: [number, number][] };
    shortest: { distance?: number; travelTime?: number; startCoord?: [number, number]; stopCoord?: [number, number]; waypoints?: [number, number][] };
  }>({ fastest: {}, shortest: {} });
  const [summary, setSummary] = useState<string>("");
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const [tt, setTt] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      Promise.all([
        import('mapbox-gl'),
        import('@tomtom-international/web-sdk-services')
      ]).then(([mapboxglModule, ttModule]) => {
        setMapboxgl(mapboxglModule.default);
        setTt(ttModule.default);
      });
    }
  }, []);

  useEffect(() => {
    if (mapboxgl && tt && typeof window !== 'undefined') {
      try {
        mapboxgl.accessToken = 'pk.eyJ1Ijoic3VicGFwcmVldCIsImEiOiJja3RlYW11Y2YyZm9pM3B6MDQ5dXRuZDNlIn0.DHhyM5tV4mrVZ6dxIqThvA';
        if (!map.current && mapContainer.current) {
          map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: "mapbox://styles/mapbox/streets-v11",
            center: [77.5946, 12.9716], // Center on Bengaluru
            zoom: 12,
          });

          map.current.addControl(new mapboxgl.NavigationControl());

          tt.services
            .fuzzySearch({
              key: '9ddViCepPxfLnXAkp7xRjpXPMEXbSUuv',
              query: "Bengaluru",
            })
            .catch((error: Error) => console.error("Error initializing TomTom services:", error));
        }
      } catch (error) {
        console.warn("Error initializing map:", error);
      }
    }
  }, [mapboxgl, tt]);

  const addWaypoint = () => {
    const newWaypoint = `waypoint-${waypoints.length}`;
    setWaypoints((prev) => [...prev, newWaypoint]);
  };

  const geocodeLocation = (location: string): Promise<[number, number]> => {
    return new Promise((resolve, reject) => {
      if (!tt) {
        reject("TomTom services not initialized");
        return;
      }
      tt.services
        .fuzzySearch({
          key: '9ddViCepPxfLnXAkp7xRjpXPMEXbSUuv',
          query: location,
        })
        .then((response: any) => {
          if (response.results && response.results.length > 0) {
            const position = response.results[0].position;
            if (position && position.lng !== undefined && position.lat !== undefined) {
              resolve([position.lng, position.lat]);
            } else {
              reject("Position is undefined");
            }
          } else {
            reject("Location not found");
          }
        })
        .catch(reject);
    });
  };

  const calculateRoute = (
    startCoord: [number, number],
    stopCoord: [number, number],
    waypointCoords: [number, number][],
    routeType: "fastest" | "shortest",
    color: string
  ) => {
    if (!tt) {
      console.error("TomTom services not initialized");
      return Promise.reject("TomTom services not initialized");
    }

    const locations = [startCoord, ...waypointCoords, stopCoord];

    return tt.services
      .calculateRoute({
        key: '9ddViCepPxfLnXAkp7xRjpXPMEXbSUuv',
        locations: locations,
        routeType: routeType,
        traffic: true,
      })
      .then((result: any) => {
        if (result.routes && result.routes.length > 0) {
          const routeSummary = result.routes[0].summary;
          const distance = routeSummary.lengthInMeters / 1000;
          const travelTime = Math.round(routeSummary.travelTimeInSeconds / 60);
          setRouteDetails((prev) => ({
            ...prev,
            [routeType]: { distance, travelTime, startCoord, stopCoord, waypoints: waypointCoords },
          }));
          updateMapLayer(`${routeType}-route`, result.toGeoJson(), color);
        } else {
          alert("No route found. Please try different locations.");
        }
      })
      .catch((error: Error) => {
        console.error("Error calculating route:", error);
        alert("Error calculating route. Please check the console for details.");
      });
  };

  const findRoute = () => {
    const startLocation = (document.getElementById("startLocation") as HTMLInputElement)?.value;
    const stopLocation = (document.getElementById("stopLocation") as HTMLInputElement)?.value;

    if (!startLocation || !stopLocation) {
      alert("Please enter both start and stop locations.");
      return;
    }

    const waypointInputs = document.querySelectorAll<HTMLInputElement>(".waypoint");
    const waypointAddresses = Array.from(waypointInputs)
      .map((input) => input.value)
      .filter(Boolean);

    const geocodePromises = waypointAddresses.map(geocodeLocation);

    Promise.all([
      geocodeLocation(startLocation),
      geocodeLocation(stopLocation),
      ...geocodePromises,
    ])
      .then((locations) => {
        const startCoord = locations[0] as [number, number];
        const stopCoord = locations[1] as [number, number];
        const waypointCoords = locations.slice(2) as [number, number][];

        clearRoute();

        if (map.current) {
          addCustomMarker(startCoord, "start");
          addCustomMarker(stopCoord, "stop");
          waypointCoords.forEach((coord) => {
            addCustomMarker(coord, "waypoint");
          });
        }

        setRouteDetails({ fastest: {}, shortest: {} });
        calculateRoute(startCoord, stopCoord, waypointCoords, "fastest", "purple");
        calculateRoute(startCoord, stopCoord, waypointCoords, "shortest", "green");
      })
      .catch((error) => {
        console.error("Error geocoding locations:", error);
        alert("Error finding locations. Please check the console for details.");
      });
  };

  const addCustomMarker = (coordinate: [number, number], type: string) => {
    if (!mapboxgl || !map.current) return;

    const markerColor = type === "start" ? "green" : type === "stop" ? "red" : "blue";
    new mapboxgl.Marker({ color: markerColor })
      .setLngLat(coordinate)
      .addTo(map.current);
  };

  const clearRoute = () => {
    const layers = map.current?.getStyle().layers || [];
    layers.forEach((layer: any) => {
      if (layer.id.includes("route")) {
        if (map.current?.getLayer(layer.id)) {
          map.current.removeLayer(layer.id);
          map.current.removeSource(layer.id);
        }
      }
    });
    setSummary("");
  };

  const updateMapLayer = (layerId: string, geojson: any, color: string) => {
    if (!map.current) return;

    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
      map.current.removeSource(layerId);
    }

    map.current.addSource(layerId, {
      type: "geojson",
      data: geojson,
    });
    map.current.addLayer({
      id: layerId,
      type: "line",
      source: layerId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": color,
        "line-width": 8,
      },
    });
  };

  const navigateShortestRoute = () => {
    if (!routeDetails.shortest.distance) {
      alert("Shortest route is not calculated yet.");
      return;
    }

    const startLocation = (document.getElementById("startLocation") as HTMLInputElement)?.value;
    const stopLocation = (document.getElementById("stopLocation") as HTMLInputElement)?.value;
    const waypoints = (routeDetails.shortest.waypoints || []) as [number, number][];
    const waypointsParam = waypoints
      .map((coord) => `${coord[1]},${coord[0]}`)
      .join("|");
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startLocation)}&destination=${encodeURIComponent(stopLocation)}&waypoints=${waypointsParam}`;

    if (typeof window !== 'undefined') {
      window.open(googleMapsUrl, "_blank");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Optimized Traffic Tool</h1>
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-1/3 lg:pr-4 mb-4">
          <input type="text" id="startLocation" placeholder="Start Location" className="w-full p-2 mb-2 border rounded" aria-label="Start Location" />
          <input type="text" id="stopLocation" placeholder="Stop Location" className="w-full p-2 mb-2 border rounded" aria-label="Stop Location" />
          {waypoints.map((waypoint, index) => (
            <input key={index} type="text" className="waypoint w-full p-2 mb-2 border rounded" placeholder={`Waypoint ${index + 1}`} aria-label={`Waypoint ${index + 1}`} />
          ))}
          <button onClick={addWaypoint} className="w-full bg-blue-500 text-white py-2 rounded mb-2">Add Waypoint</button>
          <button onClick={findRoute} className="w-full bg-green-500 text-white py-2 rounded mb-2">Find Route</button>
          <button onClick={navigateShortestRoute} className="w-full bg-red-500 text-white py-2 rounded">Navigate Shortest Route</button>
          <div className="mt-4 text-lg" aria-live="polite">{summary}</div>
        </div>
        <div className="lg:w-2/3 h-96" ref={mapContainer} aria-label="Map showing optimized routes" />
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(OptimizedTrafficTool), { ssr: false });