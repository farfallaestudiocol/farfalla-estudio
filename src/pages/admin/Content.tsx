import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Edit, 
  Save,
  FileText,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface SiteContent {
  id: string;
  section_key: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  content_data: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Content = () => {
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContents, setFilteredContents] = useState<SiteContent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SiteContent>>({});

  useEffect(() => {
    fetchContents();
  }, []);

  useEffect(() => {
    const filtered = contents.filter(content =>
      content.section_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContents(filtered);
  }, [contents, searchTerm]);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('section_key', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el contenido del sitio',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (content: SiteContent) => {
    setEditingId(content.id);
    setEditForm({ ...content });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveContent = async () => {
    if (!editingId || !editForm) return;

    try {
      const { error } = await supabase
        .from('site_content')
        .update({
          title: editForm.title,
          subtitle: editForm.subtitle,
          description: editForm.description,
          image_url: editForm.image_url,
          button_text: editForm.button_text,
          button_url: editForm.button_url,
          is_active: editForm.is_active,
        })
        .eq('id', editingId);

      if (error) throw error;

      setContents(contents.map(content =>
        content.id === editingId ? { ...content, ...editForm } : content
      ));
      
      setEditingId(null);
      setEditForm({});

      toast({
        title: 'Éxito',
        description: 'Contenido actualizado correctamente',
      });
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el contenido',
        variant: 'destructive',
      });
    }
  };

  const toggleContentStatus = async (contentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('site_content')
        .update({ is_active: !currentStatus })
        .eq('id', contentId);

      if (error) throw error;

      setContents(contents.map(content =>
        content.id === contentId
          ? { ...content, is_active: !currentStatus }
          : content
      ));

      toast({
        title: 'Éxito',
        description: `Contenido ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      });
    } catch (error) {
      console.error('Error updating content status:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del contenido',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando contenido...</p>
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
                Gestión de Contenido
              </h1>
              <p className="text-muted-foreground mt-2">
                Edita el contenido de las diferentes secciones del sitio web
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar secciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {filteredContents.map((content) => (
            <Card key={content.id} className="farfalla-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-poppins text-farfalla-ink">
                      {content.section_key}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {content.title || 'Sin título'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={content.is_active ? "default" : "secondary"}
                      className={content.is_active ? "farfalla-badge-nuevo" : ""}
                    >
                      {content.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {editingId !== content.id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleContentStatus(content.id, content.is_active)}
                        >
                          {content.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(content)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingId === content.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Título</Label>
                        <Input
                          id="title"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          placeholder="Título de la sección"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subtitle">Subtítulo</Label>
                        <Input
                          id="subtitle"
                          value={editForm.subtitle || ''}
                          onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                          placeholder="Subtítulo opcional"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Descripción del contenido"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="image_url">URL de Imagen</Label>
                        <Input
                          id="image_url"
                          value={editForm.image_url || ''}
                          onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="button_text">Texto del Botón</Label>
                        <Input
                          id="button_text"
                          value={editForm.button_text || ''}
                          onChange={(e) => setEditForm({ ...editForm, button_text: e.target.value })}
                          placeholder="Texto del botón"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="button_url">URL del Botón</Label>
                      <Input
                        id="button_url"
                        value={editForm.button_url || ''}
                        onChange={(e) => setEditForm({ ...editForm, button_url: e.target.value })}
                        placeholder="/pagina-destino"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={editForm.is_active || false}
                        onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Sección activa</Label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={saveContent} className="farfalla-btn-primary">
                        <Save className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                      <Button variant="outline" onClick={cancelEditing}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {content.title && (
                      <div>
                        <span className="font-medium text-sm text-muted-foreground">Título:</span>
                        <p className="text-farfalla-ink">{content.title}</p>
                      </div>
                    )}
                    {content.subtitle && (
                      <div>
                        <span className="font-medium text-sm text-muted-foreground">Subtítulo:</span>
                        <p className="text-farfalla-ink">{content.subtitle}</p>
                      </div>
                    )}
                    {content.description && (
                      <div>
                        <span className="font-medium text-sm text-muted-foreground">Descripción:</span>
                        <p className="text-muted-foreground">{content.description}</p>
                      </div>
                    )}
                    {content.button_text && (
                      <div>
                        <span className="font-medium text-sm text-muted-foreground">Botón:</span>
                        <p className="text-farfalla-ink">{content.button_text} → {content.button_url}</p>
                      </div>
                    )}
                    {content.image_url && (
                      <div>
                        <span className="font-medium text-sm text-muted-foreground">Imagen:</span>
                        <img
                          src={content.image_url}
                          alt={content.title || content.section_key}
                          className="mt-2 w-32 h-20 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContents.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-farfalla-ink mb-2">
              No se encontró contenido
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay contenido configurado'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Content;