import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, ArrowLeft, GripVertical } from 'lucide-react';
import { useThemes } from '@/hooks/useThemes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

interface ThemeElement {
  id: string;
  theme_id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ThemeElements() {
  const { themeId } = useParams<{ themeId: string }>();
  const navigate = useNavigate();
  const { fetchThemeElements, createThemeElement, updateThemeElement, deleteThemeElement } = useThemes();
  const [theme, setTheme] = useState<any>(null);
  const [elements, setElements] = useState<ThemeElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<ThemeElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    display_order: 0
  });

  useEffect(() => {
    if (themeId) {
      fetchThemeData();
      fetchElements();
    }
  }, [themeId]);

  const fetchThemeData = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('id', themeId)
        .single();

      if (error) throw error;
      setTheme(data);
    } catch (error) {
      console.error('Error fetching theme:', error);
      toast.error('Error al cargar el tema');
    }
  };

  const fetchElements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('theme_elements')
        .select('*')
        .eq('theme_id', themeId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setElements(data || []);
    } catch (error) {
      console.error('Error fetching theme elements:', error);
      toast.error('Error al cargar elementos del tema');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (editingElement) {
        await updateThemeElement(editingElement.id, formData);
      } else {
        const maxOrder = Math.max(...elements.map(e => e.display_order), -1);
        await createThemeElement({
          ...formData,
          theme_id: themeId!,
          display_order: maxOrder + 1,
          is_active: true
        });
      }
      
      setDialogOpen(false);
      setEditingElement(null);
      setFormData({ name: '', description: '', image_url: '', display_order: 0 });
      fetchElements();
    } catch (error) {
      console.error('Error saving element:', error);
    }
  };

  const handleEdit = (element: ThemeElement) => {
    setEditingElement(element);
    setFormData({
      name: element.name,
      description: element.description || '',
      image_url: element.image_url || '',
      display_order: element.display_order
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteThemeElement(id);
      fetchElements();
    } catch (error) {
      console.error('Error deleting element:', error);
    }
  };

  const openNewElementDialog = () => {
    setEditingElement(null);
    setFormData({ name: '', description: '', image_url: '', display_order: 0 });
    setDialogOpen(true);
  };

  if (loading && !theme) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/themes')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Temas
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Elementos del Tema</h1>
          <p className="text-muted-foreground">
            {theme?.name} - Gestiona los elementos de este tema
          </p>
        </div>
        <Button onClick={openNewElementDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Elemento
        </Button>
      </div>

      {theme && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              {theme.image_url && (
                <img
                  src={theme.image_url}
                  alt={theme.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <CardTitle>{theme.name}</CardTitle>
                {theme.description && (
                  <CardDescription>{theme.description}</CardDescription>
                )}
                <Badge variant={theme.is_active ? 'default' : 'secondary'} className="mt-2">
                  {theme.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : elements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No hay elementos en este tema</p>
              <Button onClick={openNewElementDialog} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Elemento
              </Button>
            </CardContent>
          </Card>
        ) : (
          elements.map((element) => (
            <Card key={element.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {element.image_url && (
                    <img
                      src={element.image_url}
                      alt={element.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{element.name}</h3>
                    {element.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {element.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">Orden: {element.display_order}</Badge>
                      <Badge variant={element.is_active ? 'default' : 'secondary'}>
                        {element.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(element)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar elemento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. El elemento "{element.name}" será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(element.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingElement ? 'Editar Elemento' : 'Nuevo Elemento'}
            </DialogTitle>
            <DialogDescription>
              {editingElement 
                ? 'Modifica la información del elemento'
                : 'Crea un nuevo elemento para este tema'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Avengers"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del elemento (opcional)"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="image_url">URL de Imagen</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://drive.google.com/file/d/..."
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingElement ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}