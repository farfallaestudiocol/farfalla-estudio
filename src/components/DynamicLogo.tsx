import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useEffect, useState } from 'react';

interface DynamicLogoProps {
  variant?: 'color' | 'white' | 'auto';
  shape?: 'square' | 'rectangular' | 'responsive';
  className?: string;
  alt?: string;
}

const DynamicLogo = ({ 
  variant = 'auto', 
  shape = 'responsive',
  className = "h-12 md:h-16 w-auto",
  alt = "Farfalla Estudio - Manualidades en papel personalizadas"
}: DynamicLogoProps) => {
  const { settings } = useSiteSettings();
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fallback logo
  const fallbackLogo = "/lovable-uploads/f9953d83-e6cc-4f4f-85ac-c7a1f7220021.png";
  
  // Get logo URLs based on shape and variant
  const getLogoUrl = () => {
    if (!settings) return fallbackLogo;
    
    // Determine shape based on responsive logic or explicit shape
    let finalShape = shape;
    if (shape === 'responsive') {
      // Use square on mobile/small screens, rectangular on larger screens
      finalShape = isMobile ? 'square' : 'rectangular';
    }
    
    // Determine variant (color vs white)
    const finalVariant = variant === 'white' ? 'white' : 'color';
    
    // Get the appropriate logo URL
    const logoKey = `logo_${finalShape}_${finalVariant}_url` as keyof typeof settings;
    const logoUrl = settings[logoKey] as string;
    
    // Fallback hierarchy: specific shape -> general -> fallback
    if (logoUrl) return logoUrl;
    
    // Fallback to general logos if specific shape not available
    const generalKey = `logo_${finalVariant}_url` as keyof typeof settings;
    const generalUrl = settings[generalKey] as string;
    if (generalUrl) return generalUrl;
    
    return fallbackLogo;
  };

  return (
    <img 
      src={getLogoUrl()}
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