import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Save,
  Settings as SettingsIcon,
  Truck,
  DollarSign,
  ShoppingBag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value?: string;
  setting_type: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const Settings = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSettings, setFilteredSettings] = useState<SiteSetting[]>([]);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const { settings: siteSettings, refreshSettings } = useSiteSettings();
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const ecommerceKeys = [
      'shipping_enabled',
      'shipping_cost', 
      'shipping_cost_bogota',
      'shipping_cost_outside_bogota',
      'free_shipping_enabled',
      'free_shipping_minimum',
      'free_shipping_threshold',
      'tax_enabled',
      'tax_rate',
      'currency',
      'wompi_environment'
    ];

    const filtered = settings.filter(setting => {
      // Exclude e-commerce settings from general tab
      const isEcommerceSetting = ecommerceKeys.includes(setting.setting_key);
      
      const matchesSearch = setting.setting_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.setting_value?.toLowerCase().includes(searchTerm.toLowerCase());

      return !isEcommerceSetting && matchesSearch;
    });
    
    setFilteredSettings(filtered);
  }, [settings, searchTerm]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('setting_key', { ascending: true });

      if (error) throw error;
      
      const settingsData = data || [];
      setSettings(settingsData);
      
      // Initialize edit form with current values
      const formData: Record<string, string> = {};
      settingsData.forEach(setting => {
        formData[setting.id] = setting.setting_value || '';
      });
      setEditForm(formData);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las configuraciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (settingKey: string, value: string | boolean | number) => {
    try {
      const stringValue = typeof value === 'boolean' ? value.toString() : value.toString();
      
      const { error } = await supabase
        .from('site_settings')
        .update({ setting_value: stringValue })
        .eq('setting_key', settingKey);

      if (error) throw error;

      // Refresh site settings
      await refreshSettings();

      toast({
        title: 'Éxito',
        description: 'Configuración guardada correctamente',
      });
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    }
  };

  const saveSettingById = async (settingId: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ setting_value: editForm[settingId] })
        .eq('id', settingId);

      if (error) throw error;

      setSettings(settings.map(setting =>
        setting.id === settingId
          ? { ...setting, setting_value: editForm[settingId] }
          : setting
      ));

      toast({
        title: 'Éxito',
        description: 'Configuración guardada correctamente',
      });
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    }
  };

  const saveAllSettings = async () => {
    try {
      const updates = settings.map(setting => ({
        id: setting.id,
        setting_value: editForm[setting.id]
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: update.setting_value })
          .eq('id', update.id);

        if (error) throw error;
      }

      setSettings(settings.map(setting => ({
        ...setting,
        setting_value: editForm[setting.id]
      })));

      toast({
        title: 'Éxito',
        description: 'Todas las configuraciones se guardaron correctamente',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar algunas configuraciones',
        variant: 'destructive',
      });
    }
  };

  const getInputComponent = (setting: SiteSetting) => {
    const value = editForm[setting.id] || '';
    const onChange = (newValue: string) => {
      setEditForm({ ...editForm, [setting.id]: newValue });
    };

    switch (setting.setting_type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={setting.description || ''}
            rows={3}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={setting.description || ''}
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={setting.description || ''}
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={setting.description || ''}
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={setting.description || ''}
          />
        );
    }
  };

  const formatSettingKey = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen farfalla-section-gradient flex items-center justify-center">
        <div className="text-center">
          <SettingsIcon className="h-12 w-12 animate-spin text-farfalla-teal mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando configuraciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen farfalla-section-gradient">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
            Configuración del Sitio
          </h1>
          <p className="text-muted-foreground mt-2">
            Ajusta los parámetros generales del sitio web
          </p>
        </div>

        <Tabs defaultValue="ecommerce" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ecommerce" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              E-commerce
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              General
            </TabsTrigger>
          </TabsList>

          {/* E-commerce Settings */}
          <TabsContent value="ecommerce" className="space-y-6">
            {/* Shipping Configuration */}
            <Card className="farfalla-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-farfalla-ink">
                  <Truck className="h-5 w-5" />
                  Configuración de Envío
                </CardTitle>
                <CardDescription>
                  Configura los parámetros de envío y envío gratis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Shipping Enabled */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="shipping_enabled">Habilitar Envío</Label>
                    <p className="text-sm text-muted-foreground">
                      Activar el cálculo de costos de envío
                    </p>
                  </div>
                  <Switch
                    id="shipping_enabled"
                    checked={siteSettings?.shipping_enabled || false}
                    onCheckedChange={(checked) => saveSetting('shipping_enabled', checked)}
                  />
                </div>

                {siteSettings?.shipping_enabled && (
                  <>
                    <Separator />
                    
                    {/* Shipping Costs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="shipping_cost_bogota">Envío en Bogotá (COP)</Label>
                        <Input
                          id="shipping_cost_bogota"
                          type="number"
                          value={siteSettings?.shipping_cost_bogota || 0}
                          onChange={(e) => saveSetting('shipping_cost_bogota', parseInt(e.target.value) || 0)}
                          placeholder="10000"
                        />
                        <p className="text-xs text-muted-foreground">
                          Costo de envío dentro de Bogotá
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="shipping_cost_outside_bogota">Envío Fuera de Bogotá (COP)</Label>
                        <Input
                          id="shipping_cost_outside_bogota"
                          type="number"
                          value={siteSettings?.shipping_cost_outside_bogota || 0}
                          onChange={(e) => saveSetting('shipping_cost_outside_bogota', parseInt(e.target.value) || 0)}
                          placeholder="25000"
                        />
                        <p className="text-xs text-muted-foreground">
                          Costo de envío fuera de Bogotá
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Free Shipping */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="free_shipping_enabled">Envío Gratis</Label>
                        <p className="text-sm text-muted-foreground">
                          Ofrecer envío gratis a partir de un monto mínimo
                        </p>
                      </div>
                      <Switch
                        id="free_shipping_enabled"
                        checked={siteSettings?.free_shipping_enabled || false}
                        onCheckedChange={(checked) => saveSetting('free_shipping_enabled', checked)}
                      />
                    </div>

                    {siteSettings?.free_shipping_enabled && (
                      <div className="space-y-2">
                        <Label htmlFor="free_shipping_minimum">Monto Mínimo para Envío Gratis (COP)</Label>
                        <Input
                          id="free_shipping_minimum"
                          type="number"
                          value={siteSettings?.free_shipping_minimum || 0}
                          onChange={(e) => saveSetting('free_shipping_minimum', parseInt(e.target.value) || 0)}
                          placeholder="150000"
                        />
                        <p className="text-xs text-muted-foreground">
                          Compras superiores a este monto tendrán envío gratis
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tax Configuration */}
            <Card className="farfalla-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-farfalla-ink">
                  <DollarSign className="h-5 w-5" />
                  Configuración de Impuestos
                </CardTitle>
                <CardDescription>
                  Configura el IVA y otros impuestos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tax Enabled */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="tax_enabled">Habilitar IVA</Label>
                    <p className="text-sm text-muted-foreground">
                      Calcular y mostrar impuestos en el checkout
                    </p>
                  </div>
                  <Switch
                    id="tax_enabled"
                    checked={siteSettings?.tax_enabled || false}
                    onCheckedChange={(checked) => saveSetting('tax_enabled', checked)}
                  />
                </div>

                {siteSettings?.tax_enabled && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="tax_rate">Tasa de IVA (%)</Label>
                      <Input
                        id="tax_rate"
                        type="number"
                        step="0.01"
                        value={(siteSettings?.tax_rate || 0) * 100}
                        onChange={(e) => saveSetting('tax_rate', (parseFloat(e.target.value) || 0) / 100)}
                        placeholder="19"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tasa de IVA como porcentaje (ej: 19 para 19%)
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Currency Configuration */}
            <Card className="farfalla-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-farfalla-ink">
                  <DollarSign className="h-5 w-5" />
                  Moneda
                </CardTitle>
                <CardDescription>
                  Configura la moneda del sitio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="currency">Código de Moneda</Label>
                  <Input
                    id="currency"
                    value={siteSettings?.currency || 'COP'}
                    onChange={(e) => saveSetting('currency', e.target.value)}
                    placeholder="COP"
                    maxLength={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Código ISO de la moneda (ej: COP, USD, EUR)
                  </p>
                </div>
              </CardContent>
            </Card>
            {/* Wompi Configuration */}
            <Card className="farfalla-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-farfalla-ink">
                  <DollarSign className="h-5 w-5" />
                  Configuración de Wompi
                </CardTitle>
                <CardDescription>
                  Configura el ambiente y parámetros de pago de Wompi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="wompi_environment">Ambiente de Wompi</Label>
                  <select
                    id="wompi_environment"
                    value={siteSettings?.wompi_environment || 'test'}
                    onChange={(e) => saveSetting('wompi_environment', e.target.value)}
                    className="w-full p-2 border border-border rounded-md bg-background"
                  >
                    <option value="test">Pruebas (Test)</option>
                    <option value="production">Producción</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Selecciona el ambiente de Wompi. Usa 'Pruebas' para desarrollo y testing.
                  </p>
                </div>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <p className="font-medium mb-2">Configuración de credenciales:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Las llaves públicas y secretos de integridad se configuran en Supabase Secrets</li>
                    <li>• Ambiente de pruebas: usa llaves que empiecen con 'pub_test_'</li>
                    <li>• Ambiente de producción: usa llaves que empiecen con 'pub_prod_'</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar configuraciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={saveAllSettings} className="farfalla-btn-primary">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Todo
                </Button>
              </div>
            </div>

            {/* All Settings */}
            <div className="space-y-4">
              {filteredSettings.map((setting) => (
                <Card key={setting.id} className="farfalla-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-poppins text-farfalla-ink">
                          {formatSettingKey(setting.setting_key)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {setting.description || `Configuración: ${setting.setting_key}`}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveSettingById(setting.id)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor={setting.id}>
                        {formatSettingKey(setting.setting_key)}
                      </Label>
                      {getInputComponent(setting)}
                      <p className="text-xs text-muted-foreground">
                        Tipo: {setting.setting_type} • Clave: {setting.setting_key}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredSettings.length === 0 && !loading && (
              <div className="text-center py-12">
                <SettingsIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-farfalla-ink mb-2">
                  No se encontraron configuraciones
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay configuraciones disponibles'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;