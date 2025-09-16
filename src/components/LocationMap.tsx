import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

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
  const safeLat = Number.isFinite(latitude) ? latitude : 4.7110;
  const safeLng = Number.isFinite(longitude) ? longitude : -74.0721;
  
  return (
    <div className="space-y-4">
      {/* Coordinates Display */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Coordenadas:</span>
          <span className="text-muted-foreground">
            {safeLat.toFixed(6)}, {safeLng.toFixed(6)}
          </span>
        </div>
      </Card>

      {/* Google Maps Embed */}
      <div className="relative">
        <iframe
          src={`https://maps.google.com/maps?q=${safeLat},${safeLng}&z=15&output=embed`}
          className="w-full rounded-lg border"
          style={{ height }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Ubicación seleccionada"
        />
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-muted-foreground">
          Ubicación seleccionada
        </div>
      </div>
    </div>
  );
}