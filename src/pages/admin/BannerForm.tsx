import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Monitor } from 'lucide-react';

interface BannerSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  button_text?: string;
  button_link?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const BannerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    button_text: '',
    button_link: '',
    is_active: true,
    display_order: 1
  });

  useEffect(() => {
    if (isEditing && id) {
      fetchSlide(id);
    } else {
      fetchNextDisplayOrder();
    }
  }, [id, isEditing]);

  const fetchSlide = async (slideId: string) => {
    try {
      const { data, error } = await supabase
        .from('banner_slides')
        .select('*')
        .eq('id', slideId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          subtitle: data.subtitle || '',
          description: data.description || '',
          image_url: data.image_url,
          button_text: data.button_text || '',
          button_link: data.button_link || '',
          is_active: data.is_active,
          display_order: data.display_order
        });
      }
    } catch (error) {
      console.error('Error fetching slide:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la slide',
        variant: 'destructive',
      });
      navigate('/admin/banner');
    } finally {
      setLoading(false);
    }
  };

  const fetchNextDisplayOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_slides')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);

      if (error) throw error;

      const nextOrder = data && data.length > 0 ? data[0].display_order + 1 : 1;
      setFormData(prev => ({ ...prev, display_order: nextOrder }));
    } catch (error) {
      console.error('Error fetching display order:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (isEditing && id) {
        const { error } = await supabase
          .from('banner_slides')
          .update(formData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banner_slides')
          .insert([formData]);

        if (error) throw error;
      }

      toast({
        title: 'Éxito',
        description: `Slide ${isEditing ? 'actualizada' : 'creada'} correctamente`,
      });

      navigate('/admin/banner');
    } catch (error) {
      console.error('Error saving slide:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la slide',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <Monitor className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando slide...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/banner')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-farfalla-teal/10 rounded-lg">
              <Monitor className="h-6 w-6 text-farfalla-teal" />
            </div>
            <div>
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                {isEditing ? 'Editar Slide' : 'Nueva Slide'}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? 'Modifica los datos de la slide' : 'Agrega una nueva slide al banner'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="farfalla-card">
          <CardHeader>
            <CardTitle>Información de la Slide</CardTitle>
            <CardDescription>
              Completa los datos para la slide del banner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Título principal"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtítulo</Label>
                  <Input
                    id="subtitle"
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => handleInputChange('subtitle', e.target.value)}
                    placeholder="Subtítulo opcional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción de la slide"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL de la Imagen *</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://drive.google.com/..."
                  required
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <img
                      src={convertGoogleDriveUrlToBase64(formData.image_url)}
                      alt="Vista previa"
                      className="w-full max-w-md h-32 object-cover rounded-lg"
                      onError={(e) => {
                        console.log('Error loading image preview');
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="button_text">Texto del Botón</Label>
                  <Input
                    id="button_text"
                    type="text"
                    value={formData.button_text}
                    onChange={(e) => handleInputChange('button_text', e.target.value)}
                    placeholder="Ver Más"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_link">URL del Botón</Label>
                  <Input
                    id="button_link"
                    type="text"
                    value={formData.button_link}
                    onChange={(e) => handleInputChange('button_link', e.target.value)}
                    placeholder="/productos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Slide activa</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_order">Orden de visualización</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="1"
                    value={formData.display_order}
                    onChange={(e) => handleInputChange('display_order', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/banner')}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="farfalla-btn-primary"
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BannerForm;