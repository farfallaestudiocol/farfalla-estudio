import { Heart, Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useSiteSettings();

  const footerLinks = {
    compania: [
      { name: "Sobre Nosotros", href: "/sobre-nosotros" },
      { name: "Nuestra Historia", href: "/historia" },
      { name: "Carreras", href: "/carreras" },
      { name: "Prensa", href: "/prensa" },
    ],
    ayuda: [
      { name: "Centro de Ayuda", href: "/ayuda" },
      { name: "Envíos y Devoluciones", href: "/envios" },
      { name: "Guía de Tallas", href: "/tallas" },
      { name: "Contacto", href: "/contacto" },
    ],
    legal: [
      { name: "Términos y Condiciones", href: "/terminos" },
      { name: "Política de Privacidad", href: "/privacidad" },
      { name: "Política de Cookies", href: "/cookies" },
      { name: "Política de Devoluciones", href: "/devoluciones" },
    ],
  };

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
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            {settings?.company_logo_url ? (
              <img 
                src={settings.company_logo_url} 
                alt={settings.company_name || "Logo"} 
                className="h-12 mb-4"
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
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{settings.contact_address}</span>
                </div>
              )}
              {settings?.contact_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
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
                <div className="flex items-center gap-2 text-muted-foreground">
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
            <div className="flex gap-3 mt-6">
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

          {/* Company Links */}
          <div>
            <h4 className="font-poppins font-semibold text-farfalla-ink mb-4">Compañía</h4>
            <ul className="space-y-3">
              {footerLinks.compania.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors font-inter"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h4 className="font-poppins font-semibold text-farfalla-ink mb-4">Ayuda</h4>
            <ul className="space-y-3">
              {footerLinks.ayuda.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors font-inter"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-poppins font-semibold text-farfalla-ink mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors font-inter"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
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