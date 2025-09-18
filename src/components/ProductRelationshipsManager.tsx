import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProductRelationship {
  id: string;
  product_id: string;
  related_product_id: string;
  relationship_type: string;
  strength: number;
  product_name?: string;
  related_product_name?: string;
}

interface Product {
  id: string;
  name: string;
}

interface ProductRelationshipsManagerProps {
  productId: string | undefined;
}

const ProductRelationshipsManager = ({ productId }: ProductRelationshipsManagerProps) => {
  const [relationships, setRelationships] = useState<ProductRelationship[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<ProductRelationship | null>(null);
  
  const [formData, setFormData] = useState({
    related_product_id: '',
    relationship_type: 'related',
    strength: 5,
  });

  useEffect(() => {
    if (productId) {
      fetchRelationships();
      fetchProducts();
    }
  }, [productId]);

  const fetchRelationships = async () => {
    if (!productId) return;
    
    try {
      // Obtener relaciones donde este producto es el principal o el relacionado
      const { data: outgoing, error: error1 } = await supabase
        .from('product_relationships')
        .select(`
          id,
          product_id,
          related_product_id,
          relationship_type,
          strength,
          related_product:products!product_relationships_related_product_id_fkey(name)
        `)
        .eq('product_id', productId);

      const { data: incoming, error: error2 } = await supabase
        .from('product_relationships')
        .select(`
          id,
          product_id,
          related_product_id,
          relationship_type,
          strength,
          product:products!product_relationships_product_id_fkey(name)
        `)
        .eq('related_product_id', productId);

      if (error1) throw error1;
      if (error2) throw error2;

      // Formatear y combinar las relaciones
      const outgoingFormatted = outgoing?.map(rel => ({
        ...rel,
        related_product_name: (rel.related_product as any)?.name || 'Producto no encontrado',
        direction: 'outgoing' as const
      })) || [];

      const incomingFormatted = incoming?.map(rel => ({
        ...rel,
        product_name: (rel.product as any)?.name || 'Producto no encontrado',
        direction: 'incoming' as const
      })) || [];

      setRelationships([...outgoingFormatted, ...incomingFormatted]);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las relaciones',
        variant: 'destructive',
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .neq('id', productId)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    if (formData.related_product_id === productId) {
      toast({
        title: 'Error',
        description: 'Un producto no puede estar relacionado consigo mismo',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const relationshipData = {
        product_id: productId,
        related_product_id: formData.related_product_id,
        relationship_type: formData.relationship_type,
        strength: formData.strength,
      };

      let error;

      if (editingRelationship) {
        const result = await supabase
          .from('product_relationships')
          .update(relationshipData)
          .eq('id', editingRelationship.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('product_relationships')
          .insert([relationshipData]);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: `Relación ${editingRelationship ? 'actualizada' : 'creada'} correctamente`,
      });

      resetForm();
      fetchRelationships();
    } catch (error: any) {
      console.error('Error saving relationship:', error);
      toast({
        title: 'Error',
        description: error.message || `No se pudo ${editingRelationship ? 'actualizar' : 'crear'} la relación`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (relationship: ProductRelationship) => {
    // Solo permitir editar relaciones salientes (donde este producto es el principal)
    if (relationship.product_id !== productId) {
      toast({
        title: 'Información',
        description: 'Solo puedes editar relaciones desde el producto principal',
        variant: 'default',
      });
      return;
    }

    setEditingRelationship(relationship);
    setFormData({
      related_product_id: relationship.related_product_id,
      relationship_type: relationship.relationship_type,
      strength: relationship.strength,
    });
    setShowForm(true);
  };

  const handleDelete = async (relationship: ProductRelationship) => {
    // Solo permitir eliminar relaciones salientes
    if (relationship.product_id !== productId) {
      toast({
        title: 'Información',
        description: 'Solo puedes eliminar relaciones desde el producto principal',
        variant: 'default',
      });
      return;
    }

    if (!window.confirm('¿Estás seguro de que quieres eliminar esta relación?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('product_relationships')
        .delete()
        .eq('id', relationship.id);

      if (error) throw error;

      toast({
        title: 'Relación eliminada',
        description: 'La relación se eliminó correctamente',
      });
      
      fetchRelationships();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la relación',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      related_product_id: '',
      relationship_type: 'related',
      strength: 5,
    });
    setEditingRelationship(null);
    setShowForm(false);
  };

  const getRelationshipBadge = (type: string, direction: 'incoming' | 'outgoing') => {
    const colors = {
      related: 'bg-blue-500',
      complementary: 'bg-green-500',
      upsell: 'bg-purple-500'
    };

    const labels = {
      related: 'Relacionado',
      complementary: 'Complementario',
      upsell: 'Upsell'
    };

    return (
      <div className="flex items-center gap-1">
        <Badge className={`${colors[type as keyof typeof colors]} text-white`}>
          {labels[type as keyof typeof labels]}
        </Badge>
        {direction === 'incoming' && (
          <Badge variant="outline" className="text-xs">
            Entrante
          </Badge>
        )}
      </div>
    );
  };

  if (!productId) {
    return (
      <Card className="farfalla-card">
        <CardHeader>
          <CardTitle className="text-xl font-poppins text-farfalla-ink">
            Relaciones del Producto
          </CardTitle>
          <CardDescription>
            Guarda el producto primero para administrar sus relaciones
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="farfalla-card">
      <CardHeader>
        <CardTitle className="text-xl font-poppins text-farfalla-ink flex items-center justify-between">
          Relaciones del Producto
          <Button 
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            variant={showForm ? "outline" : "default"}
            size="sm"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Relación
              </>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Administra las relaciones con otros productos (complementarios, upsells, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-semibold text-farfalla-ink">
              {editingRelationship ? 'Editar Relación' : 'Nueva Relación'}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="related_product">Producto Relacionado *</Label>
                <Select
                  value={formData.related_product_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, related_product_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship_type">Tipo de Relación</Label>
                <Select
                  value={formData.relationship_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="related">Relacionado</SelectItem>
                    <SelectItem value="complementary">Complementario</SelectItem>
                    <SelectItem value="upsell">Upsell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="strength">Fuerza (1-10)</Label>
                <Input
                  id="strength"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.strength}
                  onChange={(e) => setFormData(prev => ({ ...prev, strength: parseInt(e.target.value) || 5 }))}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                className="farfalla-btn-primary"
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingRelationship ? 'Actualizar' : 'Crear'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {relationships.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-farfalla-ink">Relaciones Existentes</h4>
            <div className="space-y-2">
              {relationships.map((relationship) => (
                <div key={relationship.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">
                          {(relationship as any).direction === 'outgoing' 
                            ? relationship.related_product_name 
                            : relationship.product_name}
                        </p>
                        {getRelationshipBadge(relationship.relationship_type, (relationship as any).direction)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fuerza: {relationship.strength}/10
                        {(relationship as any).direction === 'incoming' && ' • Esta relación se gestiona desde el otro producto'}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(relationship)}
                      disabled={relationship.product_id !== productId}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(relationship)}
                      disabled={relationship.product_id !== productId}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No hay relaciones creadas para este producto
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductRelationshipsManager;