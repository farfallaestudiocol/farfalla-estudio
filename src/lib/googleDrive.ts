export const convertGoogleDriveUrlToBase64 = async (url: string): Promise<string> => {
  // Check if it's a Google Drive URL
  const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  
  if (!match) {
    return url; // Return original URL if it's not Google Drive
  }
  
  const fileId = match[1];
  const directUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
  
  try {
    // Fetch the image from Google Drive
    const response = await fetch(directUrl);
    
    if (!response.ok) {
      console.warn('Failed to fetch image from Google Drive:', response.statusText);
      return url; // Return original URL on failure
    }
    
    // Convert to blob
    const blob = await response.blob();
    
    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting Google Drive image to base64:', error);
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