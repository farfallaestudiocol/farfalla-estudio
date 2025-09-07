import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { convertGoogleDriveUrlToBase64 } from '@/lib/googleDrive';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';

interface BannerSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url: string;
  button_text: string;
  button_link: string;
  display_order: number;
  is_active: boolean;
}

const BannerCarousel = () => {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('banner_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden farfalla-hero-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center animate-pulse">
            <div className="h-8 bg-white/20 rounded-full w-64 mx-auto mb-6"></div>
            <div className="h-16 bg-white/20 rounded w-96 mx-auto mb-6"></div>
            <div className="h-6 bg-white/20 rounded w-full max-w-2xl mx-auto mb-8"></div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="h-12 bg-white/20 rounded w-40"></div>
              <div className="h-12 bg-white/20 rounded w-32"></div>
            </div>
          </div>
          <div className="mt-16">
            <div className="h-64 bg-white/20 rounded-3xl max-w-4xl mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative overflow-hidden farfalla-hero-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <Badge className="farfalla-badge-promo mb-6">
              ✨ Creaciones Artesanales Únicas
            </Badge>
            <h1 className="text-4xl md:text-6xl font-poppins font-bold text-white mb-6 leading-tight">
              Creaciones únicas
              <span className="text-white block">hechas a mano</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Manualidades en papel personalizadas para tus momentos especiales. Cada pieza es única y creada especialmente para ti.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button className="farfalla-btn-primary">
                Personalizar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button className="farfalla-btn-secondary">
                Ver Creaciones
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden farfalla-hero-bg">
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                <div className="text-center">
                  <Badge className="farfalla-badge-promo mb-6 animate-in slide-in-from-bottom-4 duration-1000">
                    ✨ Creaciones Artesanales Únicas
                  </Badge>
                  <h1 className="text-4xl md:text-6xl font-poppins font-bold text-white mb-6 leading-tight animate-in slide-in-from-bottom-6 duration-1000">
                    {slide.title}
                    {slide.subtitle && (
                      <span className="text-white block">{slide.subtitle}</span>
                    )}
                  </h1>
                  {slide.description && (
                    <p className="text-xl text-white/90 mb-8 max-w-2xl animate-in slide-in-from-bottom-8 duration-1000 delay-200 mx-auto">
                      {slide.description}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in slide-in-from-bottom-10 duration-1000 delay-400">
                    <Button 
                      className="farfalla-btn-primary"
                      onClick={() => window.location.href = slide.button_link}
                    >
                      {slide.button_text}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button className="farfalla-btn-secondary mr-4 animate-in slide-in-from-bottom-10 duration-1000 delay-500">
                      Ver Creaciones
                    </Button>
                  </div>
                </div>
                {slide.image_url && (
                  <div className="mt-16 animate-in slide-in-from-bottom-12 duration-1000 delay-600">
                    <img
                      src={convertGoogleDriveUrlToBase64(slide.image_url)}
                      alt={slide.title}
                      className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {slides.length > 1 && (
          <>
            <CarouselPrevious className="left-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
            <CarouselNext className="right-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
            
            {/* Dots indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === current 
                      ? 'bg-white' 
                      : 'bg-white/40 hover:bg-white/60'
                  }`}
                  onClick={() => api?.scrollTo(index)}
                />
              ))}
            </div>
          </>
        )}
      </Carousel>
    </section>
  );
};

export default BannerCarousel;