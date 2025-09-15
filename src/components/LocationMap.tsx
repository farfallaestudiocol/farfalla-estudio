import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin, AlertCircle } from 'lucide-react';

interface LocationMapProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
}

export function LocationMap({ 
  latitude = 4.7110, 
  longitude = -74.0721, // Default to Bogotá, Colombia
  onLocationSelect,
  height = "400px"
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [error, setError] = useState<string>('');

  const initializeMap = (token: string) => {
    if (!mapContainer.current || !token) return;

    try {
      mapboxgl.accessToken = token;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 15
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      // Add marker
      marker.current = new mapboxgl.Marker({
        draggable: true
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      // Handle marker drag
      marker.current.on('dragend', () => {
        const lngLat = marker.current?.getLngLat();
        if (lngLat && onLocationSelect) {
          onLocationSelect(lngLat.lat, lngLat.lng);
        }
      });

      // Handle map click
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.current?.setLngLat([lng, lat]);
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      });

      setError('');
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error al cargar el mapa. Verifica tu token de Mapbox.');
    }
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setIsTokenSet(true);
      initializeMap(mapboxToken.trim());
    }
  };

  // Update marker position when coordinates change
  useEffect(() => {
    if (marker.current && map.current) {
      marker.current.setLngLat([longitude, latitude]);
      map.current.setCenter([longitude, latitude]);
    }
  }, [latitude, longitude]);

  // Cleanup
  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isTokenSet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Configuración del Mapa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para mostrar el mapa, necesitas un token público de Mapbox. 
            Puedes obtenerlo en <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Ingresa tu token público de Mapbox"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              type="password"
            />
            <Button onClick={handleTokenSubmit}>
              Cargar Mapa
            </Button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg overflow-hidden border"
        style={{ height }}
      />
      <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-muted-foreground">
        Haz clic o arrastra el marcador para seleccionar una ubicación
      </div>
    </div>
  );
}