import React, { useState } from 'react';
import { Plus, MapPin, Edit2, Trash2, Star, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GooglePlacesAutocomplete } from '@/components/GooglePlacesAutocomplete';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { useAuth } from '@/hooks/useAuth';

interface AddressFormData {
  name: string;
  full_address: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
}

export default function UserAddresses() {
  const { user } = useAuth();
  const {
    addresses,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    setPrimaryAddress
  } = useUserAddresses();

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>({
    name: '',
    full_address: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Colombia'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      full_address: '',
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Colombia'
    });
    setEditingAddress(null);
  };

  const handlePlaceSelect = (placeData: any) => {
    setFormData(prev => ({
      ...prev,
      full_address: placeData.full_address,
      street_address: placeData.street_address,
      city: placeData.city,
      state: placeData.state,
      postal_code: placeData.postal_code || '',
      country: placeData.country,
      latitude: placeData.latitude,
      longitude: placeData.longitude,
      place_id: placeData.place_id
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.full_address.trim()) {
      return;
    }

    const success = editingAddress
      ? await updateAddress(editingAddress, formData)
      : await createAddress(formData);

    if (success) {
      setShowForm(false);
      resetForm();
    }
  };

  const handleEdit = (address: any) => {
    setFormData({
      name: address.name,
      full_address: address.full_address,
      street_address: address.street_address,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code || '',
      country: address.country,
      latitude: address.latitude,
      longitude: address.longitude,
      place_id: address.place_id
    });
    setEditingAddress(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await deleteAddress(id);
  };

  const handleSetPrimary = async (id: string) => {
    await setPrimaryAddress(id);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inicia sesión</h3>
              <p className="text-muted-foreground">
                Debes iniciar sesión para gestionar tus direcciones
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Direcciones</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus direcciones de entrega
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          variant={showForm ? "outline" : "default"}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showForm ? 'Cancelar' : 'Nueva Dirección'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la dirección</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Casa, Trabajo, Oficina"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Dirección</Label>
                <GooglePlacesAutocomplete
                  onPlaceSelect={handlePlaceSelect}
                  value={formData.full_address}
                  onChange={(value) => setFormData(prev => ({ ...prev, full_address: value }))}
                  placeholder="Buscar dirección..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ciudad"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Departamento</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="Departamento"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal_code">Código Postal</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="Código postal (opcional)"
                  />
                </div>
                <div>
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="País"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAddress ? 'Actualizar' : 'Guardar'} Dirección
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full mb-1"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes direcciones guardadas</h3>
              <p className="text-muted-foreground mb-4">
                Añade tu primera dirección para facilitar tus compras
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Dirección
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className={address.is_primary ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{address.name}</h3>
                      {address.is_primary && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{address.full_address}</p>
                        <p className="text-sm">
                          {address.city}, {address.state}
                          {address.postal_code && ` ${address.postal_code}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {!address.is_primary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetPrimary(address.id)}
                        title="Establecer como principal"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar dirección?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La dirección será eliminada permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(address.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}