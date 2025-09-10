import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      console.error('Missing fileId parameter');
      return new Response(JSON.stringify({ error: 'Missing fileId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing Google Drive file ID: ${fileId}`);

    // Array of different Google Drive URL formats to try
    const urlFormats = [
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://lh3.googleusercontent.com/d/${fileId}`,
      `https://drive.google.com/uc?export=download&id=${fileId}`,
      `https://drive.google.com/uc?id=${fileId}`,
    ];

    let response: Response | null = null;
    let successUrl = '';

    // Try each URL format until we find one that works
    for (const googleDriveUrl of urlFormats) {
      try {
        console.log(`Trying URL: ${googleDriveUrl}`);
        
        const tempResponse = await fetch(googleDriveUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          redirect: 'follow'
        });

        const contentType = tempResponse.headers.get('content-type') || '';
        console.log(`Response content type: ${contentType}`);
        
        // Check if we got a valid image response
        if (tempResponse.ok && (contentType.startsWith('image/') || !contentType.includes('text/html'))) {
          response = tempResponse;
          successUrl = googleDriveUrl;
          console.log(`Success with URL: ${googleDriveUrl}`);
          break;
        } else {
          console.log(`Failed with URL ${googleDriveUrl}: ${tempResponse.status} - ${contentType}`);
        }
      } catch (error) {
        console.log(`Error with URL ${googleDriveUrl}:`, error);
        continue;
      }
    }

    if (!response || !response.ok) {
      console.error(`Failed to fetch image from all attempted URLs`);
      return new Response(JSON.stringify({ error: `Failed to fetch image from Google Drive with all attempted methods` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the image data
    const imageData = await response.arrayBuffer();
    const finalContentType = response.headers.get('content-type');

    console.log(`Successfully fetched image: ${imageData.byteLength} bytes, type: ${finalContentType}`);

    // Determine content type - default to jpeg if not specified or if it's HTML
    let imageContentType = 'image/jpeg';
    if (finalContentType && finalContentType.startsWith('image/')) {
      imageContentType = finalContentType;
    }

    // Return the image with proper headers
    return new Response(imageData, {
      headers: {
        ...corsHeaders,
        'Content-Type': imageContentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error('Error in google-drive-proxy function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);