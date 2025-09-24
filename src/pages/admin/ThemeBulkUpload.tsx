import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useThemes } from '@/hooks/useThemes';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BulkUploadResult {
  success: number;
  failed: number;
  errors: string[];
}

const ThemeBulkUpload = () => {
  const { bulkCreateThemes } = useThemes();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  const form = useForm({
    defaultValues: {
      csvData: '',
    },
  });

  const onSubmit = async (data: { csvData: string }) => {
    if (!data.csvData.trim()) return;

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const lines = data.csvData.trim().split('\n');
      const themes = [];
      const errors = [];

      // Skip header if exists
      const startIndex = lines[0]?.toLowerCase().includes('nombre') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
        
        if (columns.length < 1) {
          errors.push(`Línea ${i + 1}: Formato inválido`);
          continue;
        }

        const [name, description = '', image_url = ''] = columns;

        if (!name) {
          errors.push(`Línea ${i + 1}: Nombre es requerido`);
          continue;
        }

        themes.push({
          name,
          description: description || undefined,
          image_url: image_url || undefined,
          is_active: true,
        });

        setProgress(((i - startIndex + 1) / (lines.length - startIndex)) * 50);
      }

      if (themes.length > 0) {
        await bulkCreateThemes(themes);
        setProgress(100);
      }

      setResult({
        success: themes.length,
        failed: errors.length,
        errors,
      });

    } catch (error) {
      console.error('Error uploading themes:', error);
      setResult({
        success: 0,
        failed: 1,
        errors: ['Error al procesar la carga masiva'],
      });
    } finally {
      setUploading(false);
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
              <Upload className="h-6 w-6 text-farfalla-teal" />
            </div>
            <div>
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                Carga Masiva de Temas
              </h1>
              <p className="text-muted-foreground">
                Sube múltiples temas desde un archivo CSV
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Alert className="mb-6">
          <FileText className="h-4 w-4" />
          <AlertTitle>Formato del archivo CSV</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              <p>El archivo debe tener el siguiente formato:</p>
              <code className="block bg-muted p-2 rounded text-sm">
                nombre,descripcion,imagen_url<br/>
                "Tropical","Estilo tropical con colores vibrantes","https://drive.google.com/file/d/..."<br/>
                "Elegante","Diseño elegante y minimalista","https://drive.google.com/file/d/..."
              </code>
              <div className="text-sm space-y-1">
                <p>• El nombre es obligatorio</p>
                <p>• La descripción es opcional</p>
                <p>• La imagen URL es opcional (puede ser de Google Drive)</p>
                <p>• Usa comillas para campos que contengan comas</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Card className="farfalla-card">
          <CardHeader>
            <CardTitle>Subir Temas</CardTitle>
            <CardDescription>
              Pega el contenido de tu archivo CSV en el área de texto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="csvData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datos CSV</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="nombre,descripcion,imagen_url&#10;Tropical,Estilo tropical con colores vibrantes,https://drive.google.com/file/d/...&#10;Elegante,Diseño elegante y minimalista,https://drive.google.com/file/d/..."
                          className="resize-none min-h-[200px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Pega aquí el contenido de tu archivo CSV
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Procesando temas...</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={uploading || !form.watch('csvData').trim()}
                  className="farfalla-btn-primary"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir Temas
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {result && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Carga completada</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-green-600">{result.success}</div>
                    <div className="text-sm text-muted-foreground">Temas creados</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                    <div className="text-sm text-muted-foreground">Errores</div>
                  </Card>
                </div>

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Errores encontrados</AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 space-y-1">
                        {result.errors.map((error, index) => (
                          <li key={index} className="text-sm">• {error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button asChild className="farfalla-btn-primary">
                    <Link to="/admin/themes">Ver Temas</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setResult(null);
                      form.reset();
                    }}
                  >
                    Nueva Carga
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ThemeBulkUpload;