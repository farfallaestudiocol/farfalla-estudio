import { Heart, Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import DynamicLogo from "@/components/DynamicLogo";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings, isLoading } = useSiteSettings();

  // Don't render anything if settings are still loading
  if (isLoading || !settings) {
    return null;
  }


  return (
    <footer className="bg-farfalla-muted/50 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 flex justify-center">
            {/* Brand Section */}
            <div className="max-w-md text-center">
              {settings?.logo_square_color_url || settings?.logo_rectangular_color_url || settings?.logo_color_url || settings?.company_logo_url ? (
                <a href="/">
                  <DynamicLogo 
                    shape="responsive" 
                    variant="color" 
                    className="h-12 mb-4 mx-auto" 
                    alt={settings.company_name || "Logo"} 
                  />
                </a>
              ) : (
                <a href="/">
                  <h2 className="text-2xl font-poppins font-bold text-farfalla-ink mb-4 hover:text-primary transition-colors cursor-pointer">
                    {settings?.company_name || "Farfalla"} <span className="text-farfalla-pink">Estudio</span>
                  </h2>
                </a>
              )}
            <p className="text-muted-foreground font-inter mb-6">
              {settings?.company_description || "Tu destino para productos de belleza de alta calidad. Descubre tu mejor versión con nuestra selección cuidadosamente curada."}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              {settings?.contact_address && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{settings.contact_address}</span>
                </div>
              )}
              {settings?.contact_phone && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  <a 
                    href={`https://wa.me/${settings.contact_phone.replace(/\s|\+|-|\(|\)/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {settings.contact_phone}
                  </a>
                </div>
              )}
              {settings?.contact_email && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <a 
                    href={`mailto:${settings.contact_email}`}
                    className="hover:text-primary transition-colors"
                  >
                    {settings.contact_email}
                  </a>
                </div>
              )}
            </div>

            {/* Social Media */}
            <div className="flex justify-center gap-3 mt-6">
              {settings?.social_instagram && (
                <a 
                  href={settings.social_instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings?.social_facebook && (
                <a 
                  href={settings.social_facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings?.contact_email && (
                <a 
                  href={`mailto:${settings.contact_email}`}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground font-inter text-sm">
            © {currentYear} {settings?.company_name || "Farfalla Estudio"}. Todos los derechos reservados.
          </p>
          <p className="text-muted-foreground font-inter text-sm flex items-center gap-1">
            Hecho con <Heart className="h-4 w-4 text-farfalla-pink fill-farfalla-pink" /> en Colombia
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;