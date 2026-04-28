import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_SCHEME = 'myapp';
const SET_PASSWORD_REDIRECT = `${APP_SCHEME}://set-password`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const client = createClient(supabaseUrl, serviceRoleKey);

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');

  const userClient = createClient(
    supabaseUrl,
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const {
    data: { user },
  } = await userClient.auth.getUser();

  const { data: profile } = await client
    .from('profiles')
    .select('*')
    .eq('id', user?.id ?? '')
    .maybeSingle();

  if (!profile || profile.role !== 'super_admin') {
    return new Response(JSON.stringify({ error: 'Accès refusé' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { email, orgType, orgNom } = await req.json();
  const tokenValue = crypto.randomUUID();

  const { error: invitationError } = await client.from('invitations').insert({
    email: String(email).toLowerCase(),
    org_type: orgType,
    token: tokenValue,
    statut: 'pending',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    invited_by: profile.id,
  });

  if (invitationError) {
    return new Response(JSON.stringify({ error: invitationError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: inviteError } = await client.auth.admin.inviteUserByEmail(email, {
    data: { role: 'mol_org', org_type: orgType, org_nom: orgNom },
    redirectTo: SET_PASSWORD_REDIRECT,
  });

  if (inviteError) {
    return new Response(JSON.stringify({ error: inviteError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
