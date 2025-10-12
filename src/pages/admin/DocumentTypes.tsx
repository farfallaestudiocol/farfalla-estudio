import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const DocumentTypes = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setDocumentTypes(data || []);
    } catch (error) {
      console.error('Error fetching document types:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tipos de documento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('document_types')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Tipo de documento eliminado correctamente',
      });

      fetchDocumentTypes();
    } catch (error: any) {
      console.error('Error deleting document type:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el tipo de documento',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando tipos de documento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
              Tipos de Documento
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona los tipos de documento de identidad
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/document-types/new')}
            className="farfalla-btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tipo
          </Button>
        </div>

        <Card className="farfalla-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay tipos de documento registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  documentTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.code}</TableCell>
                      <TableCell>{type.name}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {type.description || '-'}
                      </TableCell>
                      <TableCell>{type.display_order}</TableCell>
                      <TableCell>
                        <Badge
                          variant={type.is_active ? 'default' : 'secondary'}
                          className={type.is_active ? 'farfalla-badge-active' : ''}
                        >
                          {type.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/admin/document-types/${type.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(type.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este tipo de documento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentTypes;
