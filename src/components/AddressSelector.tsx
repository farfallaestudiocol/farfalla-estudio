import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Star, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { useAuth } from '@/hooks/useAuth';

interface AddressSelectorProps {
  selectedAddressId?: string;
  onAddressSelect: (addressId: string) => void;
  required?: boolean;
}

export function AddressSelector({ selectedAddressId, onAddressSelect, required = true }: AddressSelectorProps) {
  const { user } = useAuth();
  const { addresses, isLoading } = useUserAddresses();

  if (!user) {
    return (
      <Card className="farfalla-card">
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-poppins font-semibold text-farfalla-ink mb-2">
            Inicia sesión para seleccionar dirección
          </h3>
          <p className="text-muted-foreground mb-4">
            Necesitas una cuenta para gestionar tus direcciones de entrega
          </p>
          <Link to="/auth">
            <Button className="farfalla-btn-primary">
              Iniciar Sesión
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="farfalla-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Dirección de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (addresses.length === 0) {
    return (
      <Card className="farfalla-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Dirección de Entrega
            {required && <Badge variant="destructive" className="text-xs">Requerida</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-poppins font-semibold text-farfalla-ink mb-2">
            No tienes direcciones guardadas
          </h3>
          <p className="text-muted-foreground mb-4">
            Agrega una dirección para continuar con tu pedido
          </p>
          <Link to="/mis-direcciones">
            <Button className="farfalla-btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Dirección
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="farfalla-card w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Dirección de Entrega
            {required && <Badge variant="destructive" className="text-xs">Requerida</Badge>}
          </CardTitle>
          <Link to="/mis-direcciones">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="w-full overflow-hidden">
        <RadioGroup 
          value={selectedAddressId} 
          onValueChange={onAddressSelect}
          className="space-y-4 w-full"
        >
          {addresses.map((address) => (
            <div key={address.id} className="relative w-full">
              <Label
                htmlFor={address.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 w-full ${
                  selectedAddressId === address.id 
                    ? 'border-farfalla-teal bg-farfalla-teal/5' 
                    : 'border-border'
                }`}
              >
                <RadioGroupItem 
                  value={address.id} 
                  id={address.id}
                  className="mt-0.5 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-poppins font-semibold text-farfalla-ink truncate">
                      {address.name}
                    </h4>
                    {address.is_primary && (
                      <Badge className="farfalla-badge-nuevo text-xs flex-shrink-0">
                        <Star className="h-3 w-3 mr-1" />
                        Principal
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="break-words">{address.full_address}</p>
                    <p className="break-words">
                      {address.city}, {address.state}
                      {address.postal_code && ` ${address.postal_code}`}
                    </p>
                    {address.phone && (
                      <p className="font-medium break-words">Tel: {address.phone}</p>
                    )}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}