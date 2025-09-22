import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Edit2, Trash2, Star, Home, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
import { LocationMap } from '@/components/LocationMap';
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
  phone: string;
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
    country: 'Colombia',
    phone: '',
    latitude: 4.7110, // Default to Bogotá
    longitude: -74.0721
  });

  const resetForm = () => {
    setFormData({
      name: '',
      full_address: '',
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Colombia',
      phone: '',
      latitude: 4.7110,
      longitude: -74.0721
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
      phone: address.phone || '',
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
      <div className="min-h-screen">
        <Header />
        <div className="farfalla-section-gradient py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-poppins font-bold text-farfalla-ink mb-4">
              Inicia sesión para gestionar tus direcciones
            </h2>
            <Link to="/auth">
              <Button className="farfalla-btn-primary">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="farfalla-section-gradient py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center text-muted-foreground hover:text-farfalla-teal transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                  Mis Direcciones
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gestiona tus direcciones de entrega
                </p>
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setShowForm(!showForm);
                }}
                variant={showForm ? "outline" : "default"}
                className={showForm ? "" : "farfalla-btn-primary"}
              >
                <Plus className="h-4 w-4 mr-2" />
                {showForm ? 'Cancelar' : 'Nueva Dirección'}
              </Button>
            </div>
          </div>

          {showForm && (
            <Card className="mb-6 farfalla-card">
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

              <div>
                <Label>Ubicación en el mapa</Label>
                <LocationMap
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationSelect={(lat, lng) => {
                    setFormData(prev => ({
                      ...prev,
                      latitude: lat,
                      longitude: lng
                    }));
                  }}
                  height="300px"
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

              <div>
                <Label htmlFor="phone">Teléfono de contacto</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Ej: +57 300 123 4567"
                  required
                />
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
                <Card key={i} className="farfalla-card">
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
            <Card className="farfalla-card">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-poppins font-semibold text-farfalla-ink mb-2">No tienes direcciones guardadas</h3>
                  <p className="text-muted-foreground mb-4">
                    Añade tu primera dirección para facilitar tus compras
                  </p>
                  <Button onClick={() => setShowForm(true)} className="farfalla-btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Dirección
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {addresses.map((address) => (
                <Card key={address.id} className={`farfalla-card ${address.is_primary ? 'ring-2 ring-farfalla-teal' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-poppins font-semibold text-farfalla-ink">{address.name}</h3>
                          {address.is_primary && (
                            <Badge className="farfalla-badge-nuevo text-xs">
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
      </div>

      <Footer />
    </div>
  );
}