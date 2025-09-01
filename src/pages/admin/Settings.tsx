import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Save,
  Settings as SettingsIcon,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    const filtered = settings.filter(setting =>
      setting.setting_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setting.setting_value?.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  const saveSetting = async (settingId: string) => {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-farfalla-ink">
                Configuración del Sitio
              </h1>
              <p className="text-muted-foreground mt-2">
                Ajusta los parámetros generales del sitio web
              </p>
            </div>
            <Button onClick={saveAllSettings} className="farfalla-btn-primary">
              <Save className="h-4 w-4 mr-2" />
              Guardar Todo
            </Button>
          </div>
        </div>

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
        </div>

        {/* Settings */}
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
                    onClick={() => saveSetting(setting.id)}
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
      </div>
    </div>
  );
};

export default Settings;