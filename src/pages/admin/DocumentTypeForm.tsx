import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DocumentTypeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    if (id) {
      fetchDocumentType();
    }
  }, [id]);

  const fetchDocumentType = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          code: data.code,
          name: data.name,
          description: data.description || '',
          is_active: data.is_active,
          display_order: data.display_order,
        });
      }
    } catch (error) {
      console.error('Error fetching document type:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el tipo de documento',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        const { error } = await supabase
          .from('document_types')
          .update(formData)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Éxito',
          description: 'Tipo de documento actualizado correctamente',
        });
      } else {
        const { error } = await supabase
          .from('document_types')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Éxito',
          description: 'Tipo de documento creado correctamente',
        });
      }

      navigate('/admin/document-types');
    } catch (error: any) {
      console.error('Error saving document type:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el tipo de documento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/document-types')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Tipos de Documento
        </Button>

        <Card className="farfalla-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-farfalla-ink">
              <FileText className="h-6 w-6" />
              {id ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="CC"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Código único para identificar el tipo de documento (ej: CC, TI, CE)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Cédula de Ciudadanía"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del tipo de documento"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Orden de Visualización</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Orden en el que aparecerá en las listas (menor número = primero)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Estado Activo</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar este tipo de documento a los usuarios
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/document-types')}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="farfalla-btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : id ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentTypeForm;
