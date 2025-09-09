import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Monitor,
  Search
} from 'lucide-react';

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

const Banner = () => {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSlides, setFilteredSlides] = useState<BannerSlide[]>([]);

  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    const filtered = slides.filter(slide =>
      slide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slide.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slide.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSlides(filtered);
  }, [slides, searchTerm]);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_slides')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error('Error fetching slides:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las slides del banner',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slideId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta slide?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('banner_slides')
        .delete()
        .eq('id', slideId);

      if (error) throw error;

      setSlides(slides.filter(slide => slide.id !== slideId));
      toast({
        title: 'Éxito',
        description: 'Slide eliminada correctamente',
      });
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la slide',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (slideId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('banner_slides')
        .update({ is_active: !currentStatus })
        .eq('id', slideId);

      if (error) throw error;

      setSlides(slides.map(slide =>
        slide.id === slideId
          ? { ...slide, is_active: !currentStatus }
          : slide
      ));

      toast({
        title: 'Éxito',
        description: `Slide ${!currentStatus ? 'activada' : 'desactivada'} correctamente`,
      });
    } catch (error) {
      console.error('Error updating slide status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la slide',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <Monitor className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando slides del banner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-farfalla-teal/10 rounded-lg">
                <Monitor className="h-6 w-6 text-farfalla-teal" />
              </div>
              <div>
                <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                  Gestión de Banner
                </h1>
                <p className="text-muted-foreground mt-2">
                  {filteredSlides.length} slides encontradas
                </p>
              </div>
            </div>
            <Button asChild className="farfalla-btn-primary">
              <Link to="/admin/banner/new" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                <span>Nueva Slide</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar slides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Slides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlides.map((slide) => (
            <Card key={slide.id} className="farfalla-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-poppins text-farfalla-ink line-clamp-2">
                      {slide.title}
                    </CardTitle>
                    {slide.subtitle && (
                      <CardDescription className="mt-1">
                        {slide.subtitle}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge 
                      variant={slide.is_active ? "default" : "secondary"}
                      className={slide.is_active ? "farfalla-badge-nuevo" : ""}
                    >
                      {slide.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <img
                    src={convertGoogleDriveUrlToBase64(slide.image_url)}
                    alt={slide.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {slide.description || 'Sin descripción'}
                  </p>
                  {slide.button_text && (
                    <div className="text-sm mt-2">
                      <span className="font-medium">Botón:</span> {slide.button_text}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Orden: {slide.display_order}</span>
                  <span>
                    {new Date(slide.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(slide.id, slide.is_active)}
                    className="flex-1"
                  >
                    {slide.is_active ? (
                      <EyeOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {slide.is_active ? 'Ocultar' : 'Mostrar'}
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/admin/banner/edit/${slide.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(slide.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSlides.length === 0 && !loading && (
          <div className="text-center py-12">
            <Monitor className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-farfalla-ink mb-2">
              No se encontraron slides
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primera slide al banner'}
            </p>
            <Button asChild className="farfalla-btn-primary">
              <Link to="/admin/banner/new" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                <span>Crear Slide</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Banner;