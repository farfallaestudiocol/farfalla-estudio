import jsPDF from 'jspdf';

interface OrderData {
  order_number: string;
  customer_name: string;
  customer_phone?: string;
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

  // Header with company name
  pdf.setFontSize(10);
  pdf.setTextColor(...primaryColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text(settings.company_name || 'Farfalla Estudio', 20, 8);
  
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.text(settings.contact_phone || '', 20, 12);
  pdf.text(settings.contact_address || '', 20, 15);

  // Order number in top-right
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Pedido: ${order.order_number}`, width - 3, 8, { align: 'right' });

  // Divider line
  pdf.setDrawColor(...primaryColor);
  pdf.setLineWidth(0.3);
  pdf.line(3, 20, width - 3, 20);

  // Remitente section
  pdf.setFontSize(8);
  pdf.setTextColor(...textColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text('REMITENTE:', 3, 25);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.text(settings.company_name || 'Farfalla Estudio', 3, 29);
  if (settings.contact_address) {
    const addressLines = pdf.splitTextToSize(settings.contact_address, 45);
    pdf.text(addressLines, 3, 32);
  }

  // Vertical divider
  pdf.line(52, 22, 52, height - 3);

  // Destinatario section
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('DESTINATARIO:', 55, 25);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  
  // Customer name
  const recipientName = order.shipping_address?.name || order.customer_name;
  pdf.text(recipientName, 55, 29);
  
  // Phone number - prioritize shipping_address phone
  const recipientPhone = order.shipping_address?.phone || order.customer_phone;
  let currentY = 32;
  
  if (recipientPhone) {
    pdf.text(`Tel: ${recipientPhone}`, 55, currentY);
    currentY += 3;
  }

  // Shipping address
  if (order.shipping_address) {
    const address = order.shipping_address.full_address || 
      order.shipping_address.street_address || 
      `${order.shipping_address.street || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.state || ''}`;
    
    if (address && address.trim()) {
      const addressLines = pdf.splitTextToSize(address.trim(), 42);
      pdf.text(addressLines, 55, currentY);
      currentY += addressLines.length * 3;
    }
    
    // City, state, postal code in a separate line if needed
    if (order.shipping_address.city || order.shipping_address.state || order.shipping_address.postal_code) {
      const locationParts = [
        order.shipping_address.city,
        order.shipping_address.state,
        order.shipping_address.postal_code
      ].filter(Boolean);
      
      if (locationParts.length > 0 && !order.shipping_address.full_address) {
        const locationLine = locationParts.join(', ');
        const locationLines = pdf.splitTextToSize(locationLine, 42);
        pdf.text(locationLines, 55, currentY);
      }
    }
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
