import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  shipping_enabled: boolean;
  free_shipping_enabled: boolean;
  free_shipping_minimum: number;
  shipping_cost: number;
  tax_enabled: boolean;
  tax_rate: number;
  currency: string;
  wompi_environment: string;
  company_name: string;
  company_logo_url: string;
  company_description: string;
  contact_email: string;
  contact_phone: string;
  contact_city: string;
  contact_address: string;
  social_instagram: string;
  social_facebook: string;
  logo_color_url: string;
  logo_white_url: string;
  logo_square_color_url: string;
  logo_square_white_url: string;
  logo_rectangular_color_url: string;
  logo_rectangular_white_url: string;
}

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

const defaultSettings: SiteSettings = {
  shipping_enabled: true,
  free_shipping_enabled: true,
  free_shipping_minimum: 150000,
  shipping_cost: 15000,
  tax_enabled: true,
  tax_rate: 0.19,
  currency: 'COP',
  wompi_environment: 'test',
  company_name: 'Farfalla Estudio',
  company_logo_url: '',
  company_description: 'Artículos personalizados hechos con el corazón',
  contact_email: 'hola@farfallaestudio.co',
  contact_phone: '+57 300 123 4567',
  contact_city: 'Bogotá',
  contact_address: 'Bogotá, Colombia',
  social_instagram: 'https://instagram.com/farfallaestudio',
  social_facebook: 'https://facebook.com/farfallaestudio',
  logo_color_url: '',
  logo_white_url: '',
  logo_square_color_url: '',
  logo_square_white_url: '',
  logo_rectangular_color_url: '',
  logo_rectangular_white_url: '',
};

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value, setting_type')
        .in('setting_key', [
          'shipping_enabled',
          'free_shipping_enabled', 
          'free_shipping_minimum',
          'shipping_cost',
          'tax_enabled',
          'tax_rate',
          'currency',
          'wompi_environment',
          'company_name',
          'company_logo_url',
          'company_description',
          'contact_email',
          'contact_phone',
          'contact_city',
          'contact_address',
          'social_instagram',
          'social_facebook',
          'logo_color_url',
          'logo_white_url',
          'logo_square_color_url',
          'logo_square_white_url',
          'logo_rectangular_color_url',
          'logo_rectangular_white_url'
        ]);

      if (error) throw error;

      const settingsMap: Partial<SiteSettings> = {};

      (data || []).forEach(item => {
        const key = item.setting_key as keyof SiteSettings;
        let value: any = item.setting_value;

      // Convert values based on type
      switch (item.setting_type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseFloat(value) || 0;
          break;
        default:
          // Keep as string
          break;
      }

      (settingsMap as any)[key] = value;
      });

      // Merge with defaults to ensure all settings exist
      setSettings({ ...defaultSettings, ...settingsMap });
    } catch (error) {
      console.error('Error fetching site settings:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSettings = async () => {
    setIsLoading(true);
    await fetchSettings();
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { setting_key: key, setting_value: value },
          { onConflict: 'setting_key' }
        );

      if (error) throw error;
      
      // Refresh settings after update
      await refreshSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const value = {
    settings,
    isLoading,
    refreshSettings,
    updateSetting,
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}
