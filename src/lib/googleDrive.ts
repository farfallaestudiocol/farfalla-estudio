export const convertGoogleDriveUrlToBase64 = (url: string): string => {
  // Check if it's a Google Drive URL (sharing format)
  let driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  let match = url.match(driveRegex);
  
  if (match) {
    const fileId = match[1];
    const proxyUrl = `https://zvzmnqcbmhpddrpfjrzr.supabase.co/functions/v1/google-drive-proxy?fileId=${fileId}`;
    console.log('Using proxy URL for sharing format:', proxyUrl);
    return proxyUrl;
  }
  
  // Check if it's already in direct format (uc?id=)
  driveRegex = /https:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/;
  match = url.match(driveRegex);
  
  if (match) {
    const fileId = match[1];
    const proxyUrl = `https://zvzmnqcbmhpddrpfjrzr.supabase.co/functions/v1/google-drive-proxy?fileId=${fileId}`;
    console.log('Using proxy URL for direct format:', proxyUrl);
    return proxyUrl;
  }
  
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