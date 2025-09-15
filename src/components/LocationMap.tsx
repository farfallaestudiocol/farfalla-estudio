import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const map = useRef<google.maps.Map | null>(null);
  const marker = useRef<google.maps.Marker | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const initializeMap = async () => {
    if (!mapContainer.current) return;

    try {
      setIsLoading(true);
      
      // Get Google Maps API key from Supabase edge function
      const { data, error: configError } = await supabase.functions.invoke('google-maps-config');

      if (configError || !data?.apiKey) {
        throw new Error('No se pudo obtener la configuración de Google Maps');
      }

      const loader = new Loader({
        apiKey: data.apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry'],
      });

      await loader.load();
      
      const mapOptions: google.maps.MapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
      };

      map.current = new google.maps.Map(mapContainer.current, mapOptions);

      // Add marker
      marker.current = new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map.current,
        draggable: true,
        title: 'Ubicación seleccionada'
      });

      // Handle marker drag
      marker.current.addListener('dragend', () => {
        const position = marker.current?.getPosition();
        if (position && onLocationSelect) {
          onLocationSelect(position.lat(), position.lng());
        }
      });

      // Handle map click
      map.current.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          
          marker.current?.setPosition({ lat, lng });
          if (onLocationSelect) {
            onLocationSelect(lat, lng);
          }
        }
      });

      setIsInitialized(true);
      setError('');
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Error al cargar Google Maps. Verifica la configuración de la API.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize map on component mount
  useEffect(() => {
    initializeMap();
  }, []);

  // Update marker position when coordinates change
  useEffect(() => {
    if (marker.current && map.current && isInitialized) {
      const newPosition = { lat: latitude, lng: longitude };
      marker.current.setPosition(newPosition);
      map.current.setCenter(newPosition);
    }
  }, [latitude, longitude, isInitialized]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Cargando mapa...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Configuración del Mapa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
          <p className="text-sm text-muted-foreground">
            Asegúrate de que la clave de la API de Google Places esté configurada correctamente.
          </p>
          <Button onClick={() => initializeMap()} size="sm">
            Reintentar
          </Button>
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