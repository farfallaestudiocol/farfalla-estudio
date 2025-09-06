import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const LogoUpload = () => {
  const [uploading, setUploading] = useState<'color' | 'white' | null>(null);
  const [previews, setPreviews] = useState<{
    color: string | null;
    white: string | null;
  }>({
    color: null,
    white: null
  });
  
  const colorInputRef = useRef<HTMLInputElement>(null);
  const whiteInputRef = useRef<HTMLInputElement>(null);
  const { settings, updateSetting } = useSiteSettings();

  const currentColorLogo = settings?.logo_color_url || '';
  const currentWhiteLogo = settings?.logo_white_url || '';

  const uploadLogo = async (file: File, type: 'color' | 'white') => {
    try {
      setUploading(type);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${type}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(uploadData.path);

      // Update site settings
      const settingKey = type === 'color' ? 'logo_color_url' : 'logo_white_url';
      await updateSetting(settingKey, urlData.publicUrl);

      // Clear preview
      setPreviews(prev => ({ ...prev, [type]: null }));
      
      toast.success(`Logo ${type === 'color' ? 'en colores' : 'en blanco'} subido correctamente`);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Error al subir el logo: ' + error.message);
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'color' | 'white') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews(prev => ({ ...prev, [type]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadLogo(file, type);
  };

  const clearPreview = (type: 'color' | 'white') => {
    setPreviews(prev => ({ ...prev, [type]: null }));
    if (type === 'color' && colorInputRef.current) {
      colorInputRef.current.value = '';
    }
    if (type === 'white' && whiteInputRef.current) {
      whiteInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-farfalla-ink mb-2">Configuración de Logos</h2>
        <p className="text-muted-foreground">
          Sube el logo de tu marca en dos versiones: colores y blanco. El sistema elegirá automáticamente cuál usar según el fondo.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Logo en Colores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-farfalla-teal" />
              Logo en Colores
            </CardTitle>
            <CardDescription>
              Se usa sobre fondos claros o neutros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(currentColorLogo || previews.color) && (
              <div className="relative bg-farfalla-muted/20 p-4 rounded-lg border border-farfalla-teal/20">
                <img
                  src={previews.color || currentColorLogo}
                  alt="Logo en colores"
                  className="max-h-20 mx-auto object-contain"
                />
                {previews.color && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => clearPreview('color')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            
            <div>
              <Label htmlFor="color-logo">Seleccionar archivo</Label>
              <Input
                ref={colorInputRef}
                id="color-logo"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'color')}
                disabled={uploading === 'color'}
                className="mt-1"
              />
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              disabled={uploading === 'color'}
              onClick={() => colorInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading === 'color' ? 'Subiendo...' : 'Subir Logo en Colores'}
            </Button>
          </CardContent>
        </Card>

        {/* Logo en Blanco */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-farfalla-pink" />
              Logo en Blanco
            </CardTitle>
            <CardDescription>
              Se usa sobre fondos oscuros o de colores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(currentWhiteLogo || previews.white) && (
              <div className="relative bg-farfalla-ink/80 p-4 rounded-lg border border-farfalla-pink/20">
                <img
                  src={previews.white || currentWhiteLogo}
                  alt="Logo en blanco"
                  className="max-h-20 mx-auto object-contain"
                />
                {previews.white && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-white hover:bg-white/20"
                    onClick={() => clearPreview('white')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            
            <div>
              <Label htmlFor="white-logo">Seleccionar archivo</Label>
              <Input
                ref={whiteInputRef}
                id="white-logo"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'white')}
                disabled={uploading === 'white'}
                className="mt-1"
              />
            </div>
            
            <Button
              variant="outline"
              className="w-full"
              disabled={uploading === 'white'}
              onClick={() => whiteInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading === 'white' ? 'Subiendo...' : 'Subir Logo en Blanco'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-farfalla-muted/10 border-farfalla-teal/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-farfalla-ink mb-2">Recomendaciones:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Usa imágenes en formato PNG con fondo transparente</li>
            <li>• Tamaño recomendado: 200x60px o proporción similar</li>
            <li>• Tamaño máximo de archivo: 2MB</li>
            <li>• Para mejores resultados, usa archivos vectoriales convertidos a PNG</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoUpload;