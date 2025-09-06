import { useSiteSettings } from '@/hooks/useSiteSettings';

interface DynamicLogoProps {
  variant?: 'color' | 'white' | 'auto';
  className?: string;
  alt?: string;
}

const DynamicLogo = ({ 
  variant = 'auto', 
  className = "h-12 md:h-16 w-auto",
  alt = "Farfalla Estudio - Manualidades en papel personalizadas"
}: DynamicLogoProps) => {
  const { settings } = useSiteSettings();

  // Fallback logo
  const fallbackLogo = "/lovable-uploads/f9953d83-e6cc-4f4f-85ac-c7a1f7220021.png";
  
  const colorLogo = settings?.logo_color_url || fallbackLogo;
  const whiteLogo = settings?.logo_white_url || fallbackLogo;

  // Auto variant logic: use color logo by default, but can be overridden
  const logoSrc = variant === 'white' ? whiteLogo : 
                  variant === 'color' ? colorLogo : 
                  colorLogo; // default to color for auto

  return (
    <img 
      src={logoSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        // Fallback to the uploaded logo if custom logos fail
        e.currentTarget.src = fallbackLogo;
      }}
    />
  );
};

export default DynamicLogo;