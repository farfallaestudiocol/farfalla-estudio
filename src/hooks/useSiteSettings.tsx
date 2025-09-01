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
}

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
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
          'wompi_environment'
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const value = {
    settings,
    isLoading,
    refreshSettings,
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
