import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Truck, Shield, Heart, Gift } from "lucide-react";
import heroImage from "@/assets/hero-banner.jpg";
import productSerum from "@/assets/product-serum.jpg";
import productCream from "@/assets/product-cream.jpg";
import productPalette from "@/assets/product-palette.jpg";

const Index = () => {
  // Mock data for products
  const featuredProducts = [
    {
      id: "1",
      name: "Serum Hidratante Vitamina C",
      price: 89000,
      comparePrice: 120000,
      image: productSerum,
      rating: 4.8,
      reviewCount: 156,
      badge: { text: "¡Oferta!", type: "promo" as const },
    },
    {
      id: "2", 
      name: "Crema Facial Anti-edad Premium",
      price: 145000,
      image: productCream,
      rating: 4.9,
      reviewCount: 89,
      badge: { text: "Envío Gratis", type: "envio" as const },
    },
    {
      id: "3",
      name: "Paleta de Sombras Sunset Collection",
      price: 95000,
      comparePrice: 125000,
      image: productPalette,
      rating: 4.7,
      reviewCount: 203,
      badge: { text: "Nuevo", type: "nuevo" as const },
    },
  ];

  const categories = [
    { name: "Skincare", count: "24 productos", color: "bg-primary" },
    { name: "Maquillaje", count: "38 productos", color: "bg-accent" },
    { name: "Cuidado Capilar", count: "16 productos", color: "bg-farfalla-teal-700" },
    { name: "Fragancias", count: "12 productos", color: "bg-farfalla-pink" },
  ];

  const benefits = [
    {
      icon: <Truck className="h-8 w-8" />,
      title: "Envío Gratis",
      description: "En compras superiores a $150.000"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Productos Auténticos", 
      description: "100% originales y certificados"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Garantía de Satisfacción",
      description: "30 días para devoluciones"
    },
    {
      icon: <Gift className="h-8 w-8" />,
      title: "Muestras Gratis",
      description: "En cada pedido que realices"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="farfalla-hero-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <Badge className="farfalla-badge-promo mb-6">
              ¡Nueva Colección Disponible!
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-poppins font-bold text-farfalla-ink leading-tight mb-6">
              Descubre tu
              <span className="text-farfalla-pink block">Belleza Natural</span>
            </h1>
            <p className="text-lg text-muted-foreground font-inter mb-8 max-w-lg">
              Productos premium de belleza y cuidado personal, cuidadosamente seleccionados para realzar tu belleza única y natural.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="farfalla-btn-hero">
                Explorar Colección
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-poppins font-medium px-8 py-4 rounded-2xl">
                Ver Ofertas
              </Button>
            </div>
          </div>
          <div className="animate-slide-up">
            <img
              src={heroImage}
              alt="Farfalla Estudio Beauty Collection"
              className="w-full h-auto rounded-3xl shadow-[var(--shadow-elegant)]"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-farfalla-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center animate-bounce-in" style={{animationDelay: `${index * 100}ms`}}>
                <div className="text-primary mb-4 flex justify-center">
                  {benefit.icon}
                </div>
                <h3 className="font-poppins font-semibold text-farfalla-ink mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground font-inter text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-farfalla-ink mb-4">
              Explora por Categorías
            </h2>
            <p className="text-muted-foreground font-inter max-w-2xl mx-auto">
              Encuentra exactamente lo que necesitas en nuestras categorías cuidadosamente organizadas
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div
                key={category.name}
                className="farfalla-card group cursor-pointer animate-fade-in"
                style={{animationDelay: `${index * 150}ms`}}
              >
                <div className={`${category.color} h-24 rounded-xl mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-poppins font-semibold text-farfalla-ink mb-2">
                  {category.name}
                </h3>
                <p className="text-muted-foreground font-inter text-sm">
                  {category.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 farfalla-section-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-farfalla-ink mb-4">
              Productos Destacados
            </h2>
            <p className="text-muted-foreground font-inter max-w-2xl mx-auto">
              Los favoritos de nuestras clientas. Productos que transformarán tu rutina de belleza
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product, index) => (
              <div key={product.id} className="animate-fade-in" style={{animationDelay: `${index * 200}ms`}}>
                <ProductCard
                  {...product}
                  onAddToCart={() => console.log(`Adding ${product.name} to cart`)}
                  onToggleWishlist={() => console.log(`Toggling wishlist for ${product.name}`)}
                />
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button className="farfalla-btn-primary">
              Ver Todos los Productos
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-poppins font-bold text-farfalla-ink mb-4">
            ¿Lista para Brillar?
          </h2>
          <p className="text-muted-foreground font-inter text-lg mb-8 max-w-2xl mx-auto">
            Únete a miles de mujeres que ya han descubierto su mejor versión con Farfalla Estudio
          </p>
          <Button className="farfalla-btn-hero">
            Comenzar mi Transformación
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
