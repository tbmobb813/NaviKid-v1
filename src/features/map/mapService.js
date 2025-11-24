// src/features/map/mapService.js
import { supabase } from '../../lib/supabase'

export const mapService = {
  // Get map style with safety layers
  async getMapStyle(childId = null) {
    // Get base MapLibre style
    const baseStyle = {
      version: 8,
      sources: {
        'osm': {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
    
    // Add safety locations if a child ID is provided
    if (childId) {
      const { data: safeLocations } = await supabase
        .from('safe_locations')
        .select('*')
        .eq('user_id', childId)
      
      if (safeLocations?.length) {
        // Convert to GeoJSON
        const safeLocationsGeoJSON = {
          type: 'FeatureCollection',
          features: safeLocations.map(loc => {
            // Parse the geography point to get coordinates
            const point = loc.location.replace('POINT(', '').replace(')', '').split(' ')
            return {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [parseFloat(point[0]), parseFloat(point[1])]
              },
              properties: {
                id: loc.id,
                name: loc.name,
                type: loc.location_type,
                radius: loc.radius
              }
            }
          })
        }
        
        // Add source and layers to the map style
        baseStyle.sources['safe-locations'] = {
          type: 'geojson',
          data: safeLocationsGeoJSON
        }
        
        baseStyle.layers.push({
          id: 'safe-location-circles',
          type: 'circle',
          source: 'safe-locations',
          paint: {
            'circle-radius': ['get', 'radius'],
            'circle-color': '#4CAF50',
            'circle-opacity': 0.2,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#4CAF50'
          }
        })
        
        baseStyle.layers.push({
          id: 'safe-location-symbols',
          type: 'symbol',
          source: 'safe-locations',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 12,
            'text-offset': [0, 2]
          },
          paint: {
            'text-color': '#333',
            'text-halo-color': '#fff',
            'text-halo-width': 1
          }
        })
      }
    }
    
    return baseStyle
  }
}