import jsPDF from 'jspdf';

interface OrderData {
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  user_id?: string;
  shipping_address?: {
    name?: string;
    full_address?: string;
    street_address?: string;
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
  };
}

interface SiteSettings {
  company_name?: string;
  contact_phone?: string;
  contact_city?: string;
  contact_address?: string;
  logo_square_color_url?: string;
}

export const generateShippingLabel = async (order: OrderData, settings: SiteSettings) => {
  // Create PDF with 10cm x 5cm dimensions (landscape)
  // 1cm = 28.3465 points in jsPDF
  const width = 100; // 10cm in mm
  const height = 50; // 5cm in mm
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [width, height]
  });

  // Fetch user profile to get document information
  let userDocumentInfo = '';
  if (order.user_id) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          document_number,
          document_types (code, name)
        `)
        .eq('id', order.user_id)
        .single();

      if (profile && profile.document_number && profile.document_types) {
        const docType = profile.document_types as any;
        userDocumentInfo = `${docType.code}: ${profile.document_number}`;
      }
    } catch (error) {
      console.error('Error fetching user document info:', error);
    }
  }

  // Colors
  const primaryColor: [number, number, number] = [147, 51, 234]; // Farfalla purple
  const textColor: [number, number, number] = [51, 51, 51];

  // Add logo if available
  const logoUrl = settings.logo_square_color_url || '/lovable-uploads/f9953d83-e6cc-4f4f-85ac-c7a1f7220021.png';
  
  try {
    const img = await loadImage(logoUrl);
    // Logo in top-left corner, 15mm x 15mm
    pdf.addImage(img, 'PNG', 3, 3, 15, 15);
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  // Remitente en la parte superior (banda superior)
  // Título compañía + datos compactos
  pdf.setFontSize(10);
  pdf.setTextColor(...primaryColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text(settings.company_name || 'Farfalla Estudio', 20, 10);

  // Número de pedido en esquina superior derecha
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Pedido: ${order.order_number}`, width - 3, 8, { align: 'right' });

  // Subtítulo Remitente + teléfono, ciudad y dirección
  pdf.setTextColor(...textColor);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('REMITENTE', 20, 6);

  pdf.setFont('helvetica', 'normal');
  const senderInfo: string[] = [];
  if (settings.contact_phone) senderInfo.push(`Tel: ${settings.contact_phone}`);
  if (settings.contact_city) senderInfo.push(settings.contact_city);
  if (senderInfo.length) {
    pdf.text(senderInfo.join(' • '), 20, 14);
  }
  if (settings.contact_address) {
    const addr = pdf.splitTextToSize(settings.contact_address, 60);
    pdf.text(addr, 20, 18);
  }

  // Línea divisoria para separar remitente del destinatario
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.3);
  pdf.line(3, 21, width - 3, 21);

  // Extraer campos del destinatario con múltiples posibles nombres de propiedad
  const ship: any = (order as any).shipping_address || {};
  const recipientName = order.customer_name || ship.name;
  const recipientPhone = ship.phone || ship.phone_number || order.customer_phone || '';
  const street =
    ship.full_address ||
    ship.street_address ||
    ship.street ||
    ship.address ||
    ship.address1 ||
    ship.line1 ||
    ship.formatted_address || '';
  const city = ship.city || ship.locality || ship.town || ship.municipality || '';
  const state = ship.state || ship.region || ship.administrative_area_level_1 || '';
  const postal = ship.postal_code || ship.zip || ship.zip_code || '';
  const country = ship.country || ship.country_code || '';

  // Etiqueta y contenido de destinatario ocupando el resto del rótulo
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('DESTINATARIO', 3, 26);

  // Nombre destacado con documento
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  const nameWithDoc = userDocumentInfo 
    ? `${recipientName || 'Destinatario'} - ${userDocumentInfo}`
    : recipientName || 'Destinatario';
  const nameLines = pdf.splitTextToSize(nameWithDoc, width - 6);
  const nameFirstLine = Array.isArray(nameLines) ? (nameLines[0] as string) : (nameLines as unknown as string);
  pdf.text(nameFirstLine || (recipientName || 'Destinatario'), 3, 31);

  // Detalles
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  let y = 35;

  if (recipientPhone) {
    pdf.text(`Tel: ${recipientPhone}`, 3, y);
    y += 4;
  }

  if (street) {
    const streetLines = pdf.splitTextToSize(street, width - 6);
    pdf.text(streetLines, 3, y);
    y += streetLines.length * 4;
  }

  const locationParts = [city, state, postal].filter(Boolean);
  if (locationParts.length) {
    const locLines = pdf.splitTextToSize(locationParts.join(', '), width - 6);
    pdf.text(locLines, 3, y);
    y += locLines.length * 4;
  }

  if (country) {
    pdf.text(country, 3, y);
  }


  // Save the PDF
  pdf.save(`Rotulo_${order.order_number}.pdf`);
};

// Helper function to load image
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};
