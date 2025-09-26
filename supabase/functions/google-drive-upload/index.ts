import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleDriveConfig {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  folder_id?: string;
}

async function getAccessToken(config: GoogleDriveConfig): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: config.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

async function uploadToGoogleDrive(
  file: File, 
  fileName: string, 
  accessToken: string,
  folderId?: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> {
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : undefined,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: form,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to upload file: ${result.error?.message || 'Unknown error'}`);
  }

  // Make the file publicly readable
  await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone',
    }),
  });

  // Get the file details with webViewLink
  const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}?fields=id,webViewLink,webContentLink`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  const fileData = await fileResponse.json();
  return fileData;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const folderId = formData.get('folderId') as string | null;

    if (!file || !fileName) {
      return new Response(JSON.stringify({ error: 'File and fileName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Google Drive credentials from secrets
    const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    if (!clientSecret) {
      return new Response(JSON.stringify({ error: 'Google Drive credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let config: GoogleDriveConfig;
    try {
      const credentials = JSON.parse(clientSecret);
      config = {
        client_id: credentials.web.client_id,
        client_secret: credentials.web.client_secret,
        refresh_token: Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN') || '',
        folder_id: folderId || undefined,
      };
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid Google Drive credentials format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!config.refresh_token) {
      return new Response(JSON.stringify({ 
        error: 'Google Drive refresh token not configured. Please complete OAuth setup first.',
        needsAuth: true 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Uploading file: ${fileName} (${file.size} bytes)`);
    
    const accessToken = await getAccessToken(config);
    const result = await uploadToGoogleDrive(file, fileName, accessToken, config.folder_id);

    console.log(`Upload successful: ${result.id}`);

    return new Response(JSON.stringify({
      success: true,
      fileId: result.id,
      webViewLink: result.webViewLink,
      webContentLink: result.webContentLink,
      // Convert to our proxy format for consistent usage
      proxyUrl: `https://zvzmnqcbmhpddrpfjrzr.supabase.co/functions/v1/google-drive-proxy?fileId=${result.id}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});