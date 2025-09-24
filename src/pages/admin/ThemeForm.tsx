import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useThemes } from '@/hooks/useThemes';
import { ArrowLeft, Palette, Save } from 'lucide-react';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';

const themeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre debe ser menor a 100 caracteres'),
  description: z.string().max(500, 'La descripción debe ser menor a 500 caracteres').optional(),
  image_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  is_active: z.boolean(),
});

type ThemeFormData = z.infer<typeof themeSchema>;

const ThemeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { themes, createTheme, updateTheme, loading } = useThemes();
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isEditing = Boolean(id);
  const theme = isEditing ? themes.find(t => t.id === id) : null;

  const form = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      name: '',
      description: '',
      image_url: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (isEditing && theme) {
      form.reset({
        name: theme.name,
        description: theme.description || '',
        image_url: theme.image_url || '',
        is_active: theme.is_active,
      });
      if (theme.image_url) {
        setImagePreview(convertGoogleDriveUrlToBase64(theme.image_url));
      }
    }
  }, [theme, isEditing, form]);

  const onSubmit = async (data: ThemeFormData) => {
    try {
      setSubmitting(true);
      const submitData = {
        name: data.name,
        description: data.description || undefined,
        image_url: data.image_url || undefined,
        is_active: data.is_active,
      };

      if (isEditing && theme) {
        await updateTheme(theme.id, submitData);
      } else {
        await createTheme(submitData);
      }
      
      navigate('/admin/themes');
    } catch (error) {
      console.error('Error saving theme:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUrlChange = (url: string) => {
    if (url) {
      const convertedUrl = convertGoogleDriveUrlToBase64(url);
      setImagePreview(convertedUrl);
    } else {
      setImagePreview(null);
    }
  };

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" asChild>
              <Link to="/admin/themes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-farfalla-teal/10 rounded-lg">
              <Palette className="h-6 w-6 text-farfalla-teal" />
            </div>
            <div>
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                {isEditing ? 'Editar Tema' : 'Nuevo Tema'}
              </h1>
              <p className="text-muted-foreground">
                {isEditing ? 'Modifica la información del tema' : 'Agrega un nuevo tema para los productos'}
              </p>
            </div>
          </div>
        </div>

        <Card className="farfalla-card">
          <CardHeader>
            <CardTitle>Información del Tema</CardTitle>
            <CardDescription>
              Complete los campos para {isEditing ? 'actualizar' : 'crear'} el tema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Tema *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Tropical, Elegante, Minimalista..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe el tema y su estilo..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe brevemente el estilo y características del tema
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de la Imagen</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://drive.google.com/file/d/... o https://example.com/image.jpg"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleImageUrlChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Sube la imagen a Google Drive y pega el enlace de compartir aquí
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {imagePreview && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vista previa de la imagen</label>
                    <div className="border rounded-lg p-4">
                      <img
                        src={imagePreview}
                        alt="Vista previa del tema"
                        className="w-full max-w-md h-48 object-cover rounded-lg mx-auto"
                      />
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Tema Activo</FormLabel>
                        <FormDescription>
                          Los temas activos estarán disponibles para asignar a productos
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={submitting || loading}
                    className="farfalla-btn-primary"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isEditing ? 'Actualizar Tema' : 'Crear Tema'}
                      </>
                    )}
                  </Button>
                  <Button variant="outline" asChild type="button">
                    <Link to="/admin/themes">Cancelar</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThemeForm;