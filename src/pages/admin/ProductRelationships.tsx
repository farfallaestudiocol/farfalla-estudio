import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";

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
  slug: string;
}

export default function ProductRelationships() {
  const [relationships, setRelationships] = useState<ProductRelationship[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<ProductRelationship | null>(null);
  
  const [formData, setFormData] = useState({
    product_id: "",
    related_product_id: "",
    relationship_type: "related",
    strength: 5
  });

  const { toast } = useToast();

  const fetchRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('product_relationships')
        .select(`
          id,
          product_id,
          related_product_id,
          relationship_type,
          strength,
          created_at,
          updated_at,
          product:products!product_relationships_product_id_fkey(name),
          related_product:products!product_relationships_related_product_id_fkey(name)
        `);

      if (error) throw error;

      const formattedData = data?.map(rel => ({
        ...rel,
        product_name: (rel.product as any)?.name || 'Producto no encontrado',
        related_product_name: (rel.related_product as any)?.name || 'Producto no encontrado'
      })) || [];

      setRelationships(formattedData);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las relaciones",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.product_id === formData.related_product_id) {
      toast({
        title: "Error",
        description: "Un producto no puede estar relacionado consigo mismo",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingRelationship) {
        const { error } = await supabase
          .from('product_relationships')
          .update(formData)
          .eq('id', editingRelationship.id);

        if (error) throw error;

        toast({
          title: "Relación actualizada",
          description: "La relación se actualizó correctamente",
        });
      } else {
        const { error } = await supabase
          .from('product_relationships')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Relación creada",
          description: "La relación se creó correctamente",
        });
      }

      setIsDialogOpen(false);
      setEditingRelationship(null);
      setFormData({
        product_id: "",
        related_product_id: "",
        relationship_type: "related",
        strength: 5
      });
      fetchRelationships();
    } catch (error: any) {
      console.error('Error saving relationship:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la relación",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (relationship: ProductRelationship) => {
    setEditingRelationship(relationship);
    setFormData({
      product_id: relationship.product_id,
      related_product_id: relationship.related_product_id,
      relationship_type: relationship.relationship_type,
      strength: relationship.strength
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta relación?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('product_relationships')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Relación eliminada",
        description: "La relación se eliminó correctamente",
      });
      
      fetchRelationships();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la relación",
        variant: "destructive",
      });
    }
  };

  const getRelationshipBadge = (type: string) => {
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
      <Badge className={`${colors[type as keyof typeof colors]} text-white`}>
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  const filteredRelationships = relationships.filter(rel => 
    rel.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rel.related_product_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Cargando relaciones...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Relaciones de Productos</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingRelationship(null);
                setFormData({
                  product_id: "",
                  related_product_id: "",
                  relationship_type: "related",
                  strength: 5
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Relación
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingRelationship ? 'Editar Relación' : 'Nueva Relación'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Producto Principal
                  </label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData({...formData, product_id: value})}
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

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Producto Relacionado
                  </label>
                  <Select
                    value={formData.related_product_id}
                    onValueChange={(value) => setFormData({...formData, related_product_id: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto relacionado" />
                    </SelectTrigger>
                    <SelectContent>
                      {products
                        .filter(p => p.id !== formData.product_id)
                        .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo de Relación
                  </label>
                  <Select
                    value={formData.relationship_type}
                    onValueChange={(value) => setFormData({...formData, relationship_type: value})}
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

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fuerza (1-10)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.strength}
                    onChange={(e) => setFormData({...formData, strength: parseInt(e.target.value)})}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingRelationship ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar por producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto Principal</TableHead>
                  <TableHead>Producto Relacionado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fuerza</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRelationships.map((relationship) => (
                  <TableRow key={relationship.id}>
                    <TableCell className="font-medium">
                      {relationship.product_name}
                    </TableCell>
                    <TableCell>{relationship.related_product_name}</TableCell>
                    <TableCell>
                      {getRelationshipBadge(relationship.relationship_type)}
                    </TableCell>
                    <TableCell>{relationship.strength}/10</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(relationship)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(relationship.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredRelationships.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron relaciones</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}