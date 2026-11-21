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
  const { settings, isLoading } = useSiteSettings();
  const [isMobile, setIsMobile] = useState(false);
  const [cachedSrc, setCachedSrc] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getLogoUrl = () => {
    if (!settings) return ''; // Return empty string if settings not loaded or no logo

    let finalShape = shape;
    if (shape === 'responsive') {
      finalShape = isMobile ? 'square' : 'rectangular';
    }
    
    const finalVariant = variant === 'white' ? 'white' : 'color';
    const logoKey = `logo_${finalShape}_${finalVariant}_url` as keyof typeof settings;
    const logoUrl = settings[logoKey] as string;

    if (logoUrl) return logoUrl;

    const generalKey = `logo_${finalVariant}_url` as keyof typeof settings;
    const generalUrl = settings[generalKey] as string;
    if (generalUrl) return generalUrl;
    
    return ''; // Return empty string if no logo URL is found
  };

  const logoSrc = getLogoUrl();

  useEffect(() => {
    if (isLoading) return; 

    if (logoSrc && logoSrc.startsWith('http')) {
      const cacheKey = `logo-cache-${logoSrc}`;
      const cachedImage = localStorage.getItem(cacheKey);

      if (cachedImage) {
        setCachedSrc(cachedImage);
      } else {
        fetch(logoSrc)
          .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.blob();
          })
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              localStorage.setItem(cacheKey, base64data);
              setCachedSrc(base64data);
            };
            reader.readAsDataURL(blob);
          })
          .catch((error) => {
            console.error('[DynamicLogo] Fetching failed:', error);
            setCachedSrc(''); // Set to empty string on error
          });
      }
    } else {
      setCachedSrc(logoSrc);
    }
  }, [logoSrc, isLoading]);

  if (isLoading || !cachedSrc) {
    // Render a placeholder to prevent layout shift, or if no logo is available
    return <div className={className} />;
  }

  return (
    <img 
      src={cachedSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.src = ''; // Set to empty string on error
      }}
    />
  );
};

export default DynamicLogo;