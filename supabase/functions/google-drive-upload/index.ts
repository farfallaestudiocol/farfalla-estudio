import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
    },
    body: JSON.stringify({
      refresh_token: refreshToken
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${data.error || 'Unknown error'}`);
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

    // Get refresh token from request
    const refreshToken = formData.get('refreshToken') as string;
    
    if (!refreshToken) {
      return new Response(JSON.stringify({ 
        error: 'Refresh token required. Please authorize Google Drive access first.',
        needsAuth: true,
        authUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-auth/authorize`
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Uploading file: ${fileName} (${file.size} bytes)`);
    
    const accessToken = await getAccessToken(refreshToken);
    const result = await uploadToGoogleDrive(file, fileName, accessToken, folderId || undefined);

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