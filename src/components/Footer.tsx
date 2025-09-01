import { Heart, Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useSiteSettings();


  return (
    <footer className="bg-farfalla-muted/50 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="py-12 border-b border-border/30">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-poppins font-semibold text-farfalla-ink mb-4">
              ¡Suscríbete a nuestro newsletter!
            </h3>
            <p className="text-muted-foreground mb-6 font-inter">
              Recibe las últimas novedades, promociones exclusivas y tips de belleza directamente en tu email.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Tu email..."
                className="farfalla-input flex-1"
              />
              <Button className="farfalla-btn-primary">
                Suscribirse
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Al suscribirte aceptas recibir emails promocionales. Puedes cancelar en cualquier momento.
            </p>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 flex justify-center">
          {/* Brand Section */}
          <div className="max-w-md text-center">
            {settings?.company_logo_url ? (
              <img 
                src={settings.company_logo_url} 
                alt={settings.company_name || "Logo"} 
                className="h-12 mb-4 mx-auto"
              />
            ) : (
              <h2 className="text-2xl font-poppins font-bold text-farfalla-ink mb-4">
                {settings?.company_name || "Farfalla"} <span className="text-farfalla-pink">Estudio</span>
              </h2>
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