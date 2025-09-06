import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LogoUpload from '@/components/LogoUpload';
import { Palette } from 'lucide-react';

const Branding = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-farfalla-teal/10 rounded-lg">
          <Palette className="h-6 w-6 text-farfalla-teal" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-farfalla-ink">Branding</h1>
          <p className="text-muted-foreground">Gestiona la identidad visual de tu tienda</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logos de la Marca</CardTitle>
          <CardDescription>
            Configura los logos que se mostrarán en tu tienda online
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LogoUpload />
        </CardContent>
      </Card>
    </div>
  );
};

export default Branding;