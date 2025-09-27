import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleDriveConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

function getGoogleDriveConfig(): GoogleDriveConfig {
  const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
  if (!clientSecret) {
    throw new Error('Google Drive credentials not configured');
  }
  
  const credentials = JSON.parse(clientSecret);
  return {
    client_id: credentials.web.client_id,
    client_secret: credentials.web.client_secret,
    redirect_uri: credentials.web.redirect_uris[0] || `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-auth/callback`
  };
}

async function getAuthUrl(config: GoogleDriveConfig): Promise<string> {
  const params = new URLSearchParams({
    client_id: config.client_id,
    redirect_uri: config.redirect_uri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(code: string, config: GoogleDriveConfig) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.client_id,
      client_secret: config.client_secret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirect_uri,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to exchange code for tokens: ${data.error_description || data.error}`);
  }

  return data;
}

async function refreshAccessToken(refreshToken: string, config: GoogleDriveConfig) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.client_id,
      client_secret: config.client_secret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    const config = getGoogleDriveConfig();

    // Iniciar autorización
    if (pathname.endsWith('/authorize')) {
      const authUrl = await getAuthUrl(config);
      
      return new Response(JSON.stringify({ 
        authUrl,
        message: 'Redirect user to this URL to authorize Google Drive access'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Manejar callback de Google
    if (pathname.endsWith('/callback')) {
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        return new Response(`
          <html>
            <body>
              <h1>Authorization Failed</h1>
              <p>Error: ${error}</p>
              <script>window.close();</script>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      if (!code) {
        return new Response('No authorization code received', { status: 400 });
      }

      const tokens = await exchangeCodeForTokens(code, config);
      
      return new Response(`
        <html>
          <body>
            <h1>Authorization Successful!</h1>
            <p>Google Drive access has been granted.</p>
            <script>
              // Store tokens in localStorage for the parent window
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_DRIVE_AUTH_SUCCESS',
                  tokens: ${JSON.stringify(tokens)}
                }, '*');
                window.close();
              }
            </script>
          </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Obtener access token (usando refresh token si se proporciona)
    if (pathname.endsWith('/token') && req.method === 'POST') {
      const { refresh_token } = await req.json();
      
      if (!refresh_token) {
        return new Response(JSON.stringify({ 
          error: 'Refresh token required',
          needsAuth: true 
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const accessToken = await refreshAccessToken(refresh_token, config);
      
      return new Response(JSON.stringify({ 
        access_token: accessToken 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Error in google-drive-auth function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});