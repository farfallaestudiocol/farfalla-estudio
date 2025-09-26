import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, X, ArrowLeft } from 'lucide-react';
import { useThemes } from '@/hooks/useThemes';
import { toast } from 'sonner';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';

interface ImageThemeData {
  file: File;
  preview: string;
  name: string;
  description: string;
}

interface BulkUploadResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ThemeImageBulkUpload() {
  const navigate = useNavigate();
  const { bulkCreateThemes } = useThemes();
  const [selectedImages, setSelectedImages] = useState<ImageThemeData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const imageData: ImageThemeData[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      description: ""
    }));

    setSelectedImages(prev => [...prev, ...imageData]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateImageData = (index: number, field: 'name' | 'description', value: string) => {
    setSelectedImages(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const uploadImageToGoogleDrive = async (file: File, fileName: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      
      const response = await fetch('https://zvzmnqcbmhpddrpfjrzr.supabase.co/functions/v1/google-drive-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (result.needsAuth) {
          throw new Error('Google Drive no está configurado correctamente. Contacta al administrador.');
        }
        throw new Error(result.error || 'Error al subir imagen');
      }

      return result.proxyUrl;
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (selectedImages.length === 0) {
      toast.error('Selecciona al menos una imagen');
      return;
    }

    // Validate that all images have names
    const invalidImages = selectedImages.filter(img => !img.name.trim());
    if (invalidImages.length > 0) {
      toast.error('Todos los temas deben tener un nombre');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const result: BulkUploadResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      const total = selectedImages.length;
      const themesData = [];

      // Upload images to Google Drive first
      for (let i = 0; i < selectedImages.length; i++) {
        const imageData = selectedImages[i];
        setUploadProgress(((i + 1) / total) * 50); // First 50% for uploads

        try {
          const googleDriveUrl = await uploadImageToGoogleDrive(imageData.file, imageData.name);
          const processedUrl = convertGoogleDriveUrlToBase64(googleDriveUrl);
          
          themesData.push({
            name: imageData.name.trim(),
            description: imageData.description.trim() || null,
            image_url: processedUrl,
            is_active: true
          });
        } catch (error) {
          result.failed++;
          result.errors.push(`Error al subir imagen ${imageData.name}: ${error.message}`);
        }
      }

      // Create themes in database
      if (themesData.length > 0) {
        setUploadProgress(75);
        await bulkCreateThemes(themesData);
        result.success = themesData.length;
      }

      setUploadProgress(100);
      setUploadResult(result);

      if (result.success > 0) {
        toast.success(`${result.success} temas creados exitosamente`);
      }
      
      if (result.failed > 0) {
        toast.error(`${result.failed} temas fallaron al crearse`);
      }

    } catch (error) {
      console.error('Error in bulk upload:', error);
      toast.error('Error en la carga masiva');
      result.failed = selectedImages.length;
      result.errors.push('Error general en la carga masiva');
      setUploadResult(result);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    // Clean up object URLs
    selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setSelectedImages([]);
    setUploadResult(null);
    setUploadProgress(0);
  };

  if (uploadResult) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Resultado de la Carga Masiva</CardTitle>
            <CardDescription>
              Resumen del proceso de carga de temas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadResult.success}</div>
                <div className="text-sm text-green-600">Exitosos</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{uploadResult.failed}</div>
                <div className="text-sm text-red-600">Fallidos</div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-600 mb-2">Errores:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button onClick={() => navigate('/admin/themes')}>
                Ver Temas
              </Button>
              <Button variant="outline" onClick={resetUpload}>
                Nueva Carga
              </Button>
            </div>
          </CardContent>
        </Card>
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
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Carga Masiva de Temas por Imágenes</h1>
          <p className="text-muted-foreground">
            Selecciona imágenes y completa la información para cada tema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Imágenes</CardTitle>
          <CardDescription>
            Selecciona las imágenes que quieres convertir en temas. Cada imagen se subirá a Google Drive automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="images">Seleccionar Imágenes</Label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="mt-2"
            />
          </div>

          {selectedImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Imágenes Seleccionadas ({selectedImages.length})</h3>
              
              <div className="grid gap-4">
                {selectedImages.map((imageData, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex gap-4">
                      <div className="relative">
                        <img
                          src={imageData.preview}
                          alt={`Preview ${index}`}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`name-${index}`}>Nombre del Tema *</Label>
                          <Input
                            id={`name-${index}`}
                            value={imageData.name}
                            onChange={(e) => updateImageData(index, 'name', e.target.value)}
                            placeholder="Ej: Superhéroes"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`description-${index}`}>Descripción</Label>
                          <Textarea
                            id={`description-${index}`}
                            value={imageData.description}
                            onChange={(e) => updateImageData(index, 'description', e.target.value)}
                            placeholder="Descripción del tema (opcional)"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Subiendo temas... {uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Crear {selectedImages.length} Tema{selectedImages.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}