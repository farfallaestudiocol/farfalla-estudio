import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Heart, Leaf, Truck, Shield, Gift, Scissors } from "lucide-react";
import heroImage from "@/assets/hero-crafting.jpg";
import productInvitations from "@/assets/product-invitations.jpg";
import productFlowers from "@/assets/product-flowers.jpg";
import productAlbum from "@/assets/product-album.jpg";

const Index = () => {
  const featuredProducts = [
    {
      id: "1",
      name: "Invitaciones de Boda Personalizadas",
      price: 45000,
      comparePrice: 60000,
      image: productInvitations,
      rating: 4.9,
      reviewCount: 85,
      badge: { text: "25% OFF", type: "promo" as const }
    },
    {
      id: "2", 
      name: "Ramo de Flores de Papel",
      price: 120000,
      comparePrice: 150000,
      image: productFlowers,
      rating: 4.8,
      reviewCount: 67,
      badge: { text: "ENVÍO GRATIS", type: "envio" as const }
    },
    {
      id: "3",
      name: "Álbum de Recuerdos Artesanal",
      price: 85000,
      image: productAlbum,
      rating: 4.7,
      reviewCount: 42,
      badge: { text: "NUEVO", type: "nuevo" as const }
    }
  ];

  const categories = [
    { name: "Invitaciones", count: "24 diseños", color: "bg-farfalla-teal" },
    { name: "Decoración", count: "38 productos", color: "bg-farfalla-pink" },
    { name: "Recuerdos", count: "16 productos", color: "bg-farfalla-teal-700" },
    { name: "Papelería", count: "12 productos", color: "bg-primary" },
  ];

  const benefits = [
    {
      icon: <Truck className="h-8 w-8" />,
      title: "Envío Seguro",
      description: "Empaque especial para proteger tus creaciones"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Hecho a Mano", 
      description: "Cada pieza es única y personalizada"
    },
    {
      icon: <Scissors className="h-8 w-8" />,
      title: "Diseño Personalizado",
      description: "Adaptamos cada creación a tus gustos"
    },
    {
      icon: <Gift className="h-8 w-8" />,
      title: "Para Ocasiones Especiales",
      description: "Perfectas para momentos únicos"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-farfalla-teal/10 via-white to-farfalla-pink/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <Badge className="farfalla-badge-promo mb-6 animate-in slide-in-from-bottom-4 duration-1000">
              ✨ Creaciones Artesanales Únicas
            </Badge>
            <h1 className="text-4xl md:text-6xl font-poppins font-bold text-white mb-6 leading-tight animate-in slide-in-from-bottom-6 duration-1000">
              Creaciones únicas
              <span className="text-farfalla-pink block">hechas a mano</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl animate-in slide-in-from-bottom-8 duration-1000 delay-200 mx-auto">
              Manualidades en papel personalizadas para tus momentos especiales. Cada pieza es única y creada especialmente para ti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in slide-in-from-bottom-10 duration-1000 delay-400">
              <Button className="farfalla-btn-primary">
                Personalizar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button className="farfalla-btn-secondary mr-4 animate-in slide-in-from-bottom-10 duration-1000 delay-500">
                Ver Creaciones
              </Button>
            </div>
          </div>
          <div className="mt-16 animate-in slide-in-from-bottom-12 duration-1000 delay-600">
            <img
              src={heroImage}
              alt="Farfalla Estudio - Creaciones en papel"
              className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-farfalla-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="text-farfalla-teal mb-4 flex justify-center">
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
              Nuestras Especialidades
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explora nuestras creaciones artesanales en papel, perfectas para cada ocasión especial
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="farfalla-card p-8 text-center group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-farfalla-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-farfalla-teal/20 transition-colors">
                <Sparkles className="h-8 w-8 text-farfalla-teal" />
              </div>
              <h3 className="text-xl font-poppins font-semibold text-farfalla-ink mb-3">Invitaciones</h3>
              <p className="text-muted-foreground">Diseños únicos para bodas, quinceañeros y eventos especiales</p>
            </div>

            <div className="farfalla-card p-8 text-center group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-farfalla-pink/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-farfalla-pink/20 transition-colors">
                <Heart className="h-8 w-8 text-farfalla-pink" />
              </div>
              <h3 className="text-xl font-poppins font-semibold text-farfalla-ink mb-3">Decoración</h3>
              <p className="text-muted-foreground">Flores de papel y elementos decorativos artesanales</p>
            </div>

            <div className="farfalla-card p-8 text-center group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 bg-farfalla-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-farfalla-teal/20 transition-colors">
                <Leaf className="h-8 w-8 text-farfalla-teal" />
              </div>
              <h3 className="text-xl font-poppins font-semibold text-farfalla-ink mb-3">Recuerdos</h3>
              <p className="text-muted-foreground">Álbumes y libros personalizados para guardar tus memorias</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-farfalla-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-poppins font-bold text-farfalla-ink mb-4">
              Creaciones Destacadas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nuestras piezas más populares, cada una hecha con amor y dedicación
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
              Ver Todas las Creaciones
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="farfalla-card p-8 md:p-12 text-center bg-gradient-to-br from-farfalla-teal/5 to-farfalla-pink/5">
            <Truck className="h-16 w-16 text-farfalla-teal mx-auto mb-6" />
            <h2 className="text-2xl md:text-3xl font-poppins font-bold text-farfalla-ink mb-4">
              Envío Gratis en Compras Superiores a $150.000
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Recibe tus creaciones artesanales sin costo adicional. Entregas cuidadosas para preservar cada detalle.
            </p>
            <Button className="farfalla-btn-primary">
              Ver Creaciones
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;