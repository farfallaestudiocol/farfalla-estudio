import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useThemes } from '@/hooks/useThemes';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Palette,
  Upload,
  Settings
} from 'lucide-react';
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

const Themes = () => {
  const navigate = useNavigate();
  const { themes, loading, updateTheme, deleteTheme } = useThemes();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredThemes = themes.filter(theme =>
    theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theme.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleThemeStatus = async (themeId: string, currentStatus: boolean) => {
    await updateTheme(themeId, { is_active: !currentStatus });
  };

  const handleDelete = async (themeId: string) => {
    await deleteTheme(themeId);
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <Palette className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando temas...</p>
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
            <div>
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                Gestión de Temas
              </h1>
              <p className="text-muted-foreground mt-2">
                {filteredThemes.length} temas encontrados
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="farfalla-btn-secondary">
                <Link to="/admin/themes/bulk-upload" className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Carga CSV</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="farfalla-btn-secondary">
                <Link to="/admin/themes/image-bulk-upload" className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Carga por Imágenes</span>
                </Link>
              </Button>
              <Button asChild className="farfalla-btn-primary">
                <Link to="/admin/themes/new" className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Nuevo Tema</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar temas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredThemes.map((theme) => (
            <Card key={theme.id} className="farfalla-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-poppins text-farfalla-ink line-clamp-2">
                      {theme.name}
                    </CardTitle>
                    {theme.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {theme.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge 
                    variant={theme.is_active ? "default" : "secondary"}
                    className={theme.is_active ? "farfalla-badge-nuevo" : ""}
                  >
                    {theme.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {theme.image_url && (
                  <div className="mb-4">
                    <img
                      src={convertGoogleDriveUrlToBase64(theme.image_url)}
                      alt={theme.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/theme-elements/${theme.id}`)}
                    className="flex-1"
                    title="Gestionar elementos"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Elementos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleThemeStatus(theme.id, theme.is_active)}
                  >
                    {theme.is_active ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/admin/themes/edit/${theme.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar tema?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El tema "{theme.name}" será eliminado permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(theme.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredThemes.length === 0 && !loading && (
          <div className="text-center py-12">
            <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-farfalla-ink mb-2">
              No se encontraron temas
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer tema'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline" className="farfalla-btn-secondary">
                <Link to="/admin/themes/bulk-upload" className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Carga CSV</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="farfalla-btn-secondary">
                <Link to="/admin/themes/image-bulk-upload" className="flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Carga por Imágenes</span>
                </Link>
              </Button>
              <Button asChild className="farfalla-btn-primary">
                <Link to="/admin/themes/new" className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Crear Tema</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Themes;