import React, { useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AddressComponents {
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (address: AddressComponents & {
    full_address: string;
    latitude: number;
    longitude: number;
    place_id: string;
  }) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function GooglePlacesAutocomplete({
  onPlaceSelect,
  placeholder = "Buscar dirección...",
  value = "",
  onChange,
  className
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const sessionToken = useRef(Math.random().toString(36).substring(2));
  const searchTimeout = useRef<NodeJS.Timeout>();

  const searchPlaces = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
        body: {
          input,
          sessionToken: sessionToken.current
        }
      });

      if (error) throw error;

      if (data && data.predictions) {
        setPredictions(data.predictions.slice(0, 5)); // Limit to 5 suggestions
      } else {
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    setShowSuggestions(true);
    
    // Clear existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (newValue.trim()) {
      // Debounce the search to avoid too many API calls
      searchTimeout.current = setTimeout(() => {
        searchPlaces(newValue);
      }, 300);
    } else {
      setPredictions([]);
    }
  };

  const parseAddressComponents = (addressComponents: any[]): AddressComponents => {
    const components: AddressComponents = {
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      country: ''
    };

    addressComponents.forEach((component) => {
      const types = component.types;
      
      if (types.includes('street_number') || types.includes('route')) {
        components.street_address += (components.street_address ? ' ' : '') + component.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        components.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        components.state = component.long_name;
      } else if (types.includes('postal_code')) {
        components.postal_code = component.long_name;
      } else if (types.includes('country')) {
        components.country = component.long_name;
      }
    });

    return components;
  };

  const handlePlaceSelect = async (placeId: string, description: string) => {
    setInputValue(description);
    setShowSuggestions(false);
    setPredictions([]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('google-places-details', {
        body: {
          placeId,
          sessionToken: sessionToken.current
        }
      });

      if (error) throw error;

      if (data && data.result) {
        const place = data.result;
        const addressComponents = parseAddressComponents(place.address_components);
        
        onPlaceSelect({
          ...addressComponents,
          full_address: place.formatted_address,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          place_id: place.place_id
        });

        // Generate new session token for next search
        sessionToken.current = Math.random().toString(36).substring(2);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={className}
        />
        <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {isLoading && (
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {showSuggestions && predictions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-farfalla-teal/95 backdrop-blur-sm border shadow-lg p-1 text-white">
          <div>
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                onClick={() => handlePlaceSelect(prediction.place_id, prediction.description)}
                className="w-full text-left px-2 py-1.5 rounded-sm transition-colors hover:bg-farfalla-pink/20 focus:bg-farfalla-pink/30 focus:text-white"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-white/70 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-sm text-white">
                      {prediction.structured_formatting?.main_text}
                    </div>
                    <div className="text-xs text-white/70">
                      {prediction.structured_formatting?.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}