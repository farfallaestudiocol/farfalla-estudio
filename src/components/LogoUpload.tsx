import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Square, RectangleHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const LogoUpload = () => {
  const [uploading, setUploading] = useState<'square_color' | 'square_white' | 'rectangular_color' | 'rectangular_white' | null>(null);
  const [previews, setPreviews] = useState<{
    square_color: string | null;
    square_white: string | null;
    rectangular_color: string | null;
    rectangular_white: string | null;
  }>({
    square_color: null,
    square_white: null,
    rectangular_color: null,
    rectangular_white: null
  });
  
  const squareColorRef = useRef<HTMLInputElement>(null);
  const squareWhiteRef = useRef<HTMLInputElement>(null);
  const rectangularColorRef = useRef<HTMLInputElement>(null);
  const rectangularWhiteRef = useRef<HTMLInputElement>(null);
  const { settings, updateSetting } = useSiteSettings();

  const currentSquareColorLogo = settings?.logo_square_color_url || '';
  const currentSquareWhiteLogo = settings?.logo_square_white_url || '';
  const currentRectangularColorLogo = settings?.logo_rectangular_color_url || '';
  const currentRectangularWhiteLogo = settings?.logo_rectangular_white_url || '';

  const uploadLogo = async (file: File, type: 'square_color' | 'square_white' | 'rectangular_color' | 'rectangular_white') => {
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
      const settingKey = `logo_${type}_url`;
      await updateSetting(settingKey, urlData.publicUrl);

      // Clear preview
      setPreviews(prev => ({ ...prev, [type]: null }));
      
      const typeLabels = {
        square_color: 'cuadrado en colores',
        square_white: 'cuadrado en blanco', 
        rectangular_color: 'rectangular en colores',
        rectangular_white: 'rectangular en blanco'
      };
      
      toast.success(`Logo ${typeLabels[type]} subido correctamente`);
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Error al subir el logo: ' + error.message);
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'square_color' | 'square_white' | 'rectangular_color' | 'rectangular_white') => {
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

  const clearPreview = (type: 'square_color' | 'square_white' | 'rectangular_color' | 'rectangular_white') => {
    setPreviews(prev => ({ ...prev, [type]: null }));
    const refs = {
      square_color: squareColorRef,
      square_white: squareWhiteRef,
      rectangular_color: rectangularColorRef,
      rectangular_white: rectangularWhiteRef
    };
    if (refs[type].current) {
      refs[type].current!.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-farfalla-ink mb-2">Configuración de Logos</h2>
        <p className="text-muted-foreground mb-4">
          Sube diferentes variantes de tu logo. El sistema elegirá automáticamente cuál usar según el dispositivo y fondo.
        </p>
        <div className="bg-farfalla-muted/10 p-4 rounded-lg border border-farfalla-teal/20">
          <h4 className="font-semibold text-farfalla-ink mb-2">💾 ¿Dónde se guardan?</h4>
          <p className="text-sm text-muted-foreground">
            Los logos se almacenan en <strong>Supabase Storage</strong> (no en el proyecto), lo que permite cambiarlos dinámicamente sin necesidad de redeployar el código.
          </p>
        </div>
      </div>

      {/* Logos Cuadrados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Square className="h-5 w-5 text-farfalla-teal" />
            Logos Cuadrados
          </CardTitle>
          <CardDescription>
            Ideales para móviles y espacios compactos. Se usan automáticamente en pantallas pequeñas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Square Color */}
            <div className="space-y-4">
              <Label className="text-farfalla-ink font-medium">Cuadrado - Colores</Label>
              {(currentSquareColorLogo || previews.square_color) && (
                <div className="relative bg-farfalla-muted/20 p-4 rounded-lg border border-farfalla-teal/20">
                  <img
                    src={previews.square_color || currentSquareColorLogo}
                    alt="Logo cuadrado en colores"
                    className="max-h-16 w-16 mx-auto object-contain"
                  />
                  {previews.square_color && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => clearPreview('square_color')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <Input
                ref={squareColorRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'square_color')}
                disabled={uploading === 'square_color'}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading === 'square_color'}
                onClick={() => squareColorRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading === 'square_color' ? 'Subiendo...' : 'Subir Logo Cuadrado - Colores'}
              </Button>
            </div>

            {/* Square White */}
            <div className="space-y-4">
              <Label className="text-farfalla-ink font-medium">Cuadrado - Blanco</Label>
              {(currentSquareWhiteLogo || previews.square_white) && (
                <div className="relative bg-farfalla-ink/80 p-4 rounded-lg border border-farfalla-pink/20">
                  <img
                    src={previews.square_white || currentSquareWhiteLogo}
                    alt="Logo cuadrado en blanco"
                    className="max-h-16 w-16 mx-auto object-contain"
                  />
                  {previews.square_white && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 text-white hover:bg-white/20"
                      onClick={() => clearPreview('square_white')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <Input
                ref={squareWhiteRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'square_white')}
                disabled={uploading === 'square_white'}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading === 'square_white'}
                onClick={() => squareWhiteRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading === 'square_white' ? 'Subiendo...' : 'Subir Logo Cuadrado - Blanco'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logos Rectangulares */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RectangleHorizontal className="h-5 w-5 text-farfalla-pink" />
            Logos Rectangulares
          </CardTitle>
          <CardDescription>
            Perfectos para desktop y espacios amplios. Se usan automáticamente en pantallas grandes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Rectangular Color */}
            <div className="space-y-4">
              <Label className="text-farfalla-ink font-medium">Rectangular - Colores</Label>
              {(currentRectangularColorLogo || previews.rectangular_color) && (
                <div className="relative bg-farfalla-muted/20 p-4 rounded-lg border border-farfalla-teal/20">
                  <img
                    src={previews.rectangular_color || currentRectangularColorLogo}
                    alt="Logo rectangular en colores"
                    className="max-h-16 mx-auto object-contain"
                  />
                  {previews.rectangular_color && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6"
                      onClick={() => clearPreview('rectangular_color')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <Input
                ref={rectangularColorRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'rectangular_color')}
                disabled={uploading === 'rectangular_color'}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading === 'rectangular_color'}
                onClick={() => rectangularColorRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading === 'rectangular_color' ? 'Subiendo...' : 'Subir Logo Rectangular - Colores'}
              </Button>
            </div>

            {/* Rectangular White */}
            <div className="space-y-4">
              <Label className="text-farfalla-ink font-medium">Rectangular - Blanco</Label>
              {(currentRectangularWhiteLogo || previews.rectangular_white) && (
                <div className="relative bg-farfalla-ink/80 p-4 rounded-lg border border-farfalla-pink/20">
                  <img
                    src={previews.rectangular_white || currentRectangularWhiteLogo}
                    alt="Logo rectangular en blanco"
                    className="max-h-16 mx-auto object-contain"
                  />
                  {previews.rectangular_white && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 text-white hover:bg-white/20"
                      onClick={() => clearPreview('rectangular_white')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <Input
                ref={rectangularWhiteRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'rectangular_white')}
                disabled={uploading === 'rectangular_white'}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading === 'rectangular_white'}
                onClick={() => rectangularWhiteRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading === 'rectangular_white' ? 'Subiendo...' : 'Subir Logo Rectangular - Blanco'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-farfalla-muted/10 border-farfalla-teal/20">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-farfalla-ink mb-2">Recomendaciones:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Cuadrados:</strong> 200x200px o proporción 1:1</li>
            <li>• <strong>Rectangulares:</strong> 300x100px o proporción 3:1</li>
            <li>• Usa imágenes en formato PNG con fondo transparente</li>
            <li>• Tamaño máximo de archivo: 2MB</li>
            <li>• Para mejores resultados, usa archivos vectoriales convertidos a PNG</li>
            <li>• El sistema elige automáticamente: cuadrado en móvil, rectangular en desktop</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoUpload;