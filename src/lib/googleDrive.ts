export const convertGoogleDriveUrlToBase64 = async (url: string): Promise<string> => {
  // Check if it's a Google Drive URL
  const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (!match) {
    return url; // Return original URL if it's not Google Drive
  }
  
  const fileId = match[1];
  
  try {
    // Use our Supabase edge function proxy
    const proxyUrl = `https://zvzmnqcbmhpddrpfjrzr.supabase.co/functions/v1/google-drive-proxy?fileId=${fileId}`;
    
    console.log('Using proxy URL:', proxyUrl);
    
    return proxyUrl; // Return proxy URL directly instead of base64
  } catch (error) {
    console.error('Error creating proxy URL for Google Drive image:', error);
    return url; // Return original URL on error
  }
};

export const convertGoogleDriveUrl = (url: string): string => {
  // Convert Google Drive sharing URL to direct download URL
  const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (match) {
    const fileId = match[1];
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  }
  
  return url;
};