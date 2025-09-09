export const convertGoogleDriveUrlToBase64 = (url: string): string => {
  if (!url) return url;
  
  console.log('Original URL:', url);
  
  let fileId: string | null = null;
  
  // Handle various Google Drive URL formats
  const patterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,  // Sharing format
    /https:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,   // Direct format
    /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/, // Open format
    /https:\/\/docs\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/     // Docs format
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      fileId = match[1];
      console.log('Extracted file ID:', fileId);
      break;
    }
  }
  
  // If it's just a file ID (no URL format)
  if (!fileId && /^[a-zA-Z0-9_-]{25,}$/.test(url)) {
    fileId = url;
    console.log('Using URL as file ID:', fileId);
  }
  
  // If we found a file ID, use our proxy
  if (fileId) {
    const proxyUrl = `https://zvzmnqcbmhpddrpfjrzr.supabase.co/functions/v1/google-drive-proxy?fileId=${fileId}`;
    console.log('Using proxy URL for Google Drive:', proxyUrl);
    return proxyUrl;
  }
  
  console.log('No Google Drive pattern matched, returning original URL');
  return url; // Return original URL if it's not Google Drive
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