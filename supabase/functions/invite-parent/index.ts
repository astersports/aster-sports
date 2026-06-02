const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, org_id } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!org_id) {
      return new Response(JSON.stringify({ error: 'org_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Wave 1 P1 cross-org defense-in-depth: assert caller is admin in the
    // SPECIFIC org named in the request body, not just "admin somewhere."
    // Replaces the prior .from('user_roles').select('role').eq('user_id',...)
    // .maybeSingle() check which silently picked an arbitrary org row.
    const { data: isAdmin, error: roleError } = await userClient.rpc(
      'user_has_role_in_org',
      { check_org_id: org_id, check_roles: ['admin'] }
    )
    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    // Magic-link host is read from public.app_config (SQL-settable, no dashboard
    // or CLI): `UPDATE public.app_config SET value='https://astersports.app'
    // WHERE key='app_base_url'` repoints parent invites at go-live. Graceful
    // fallback to the current working deploy host if the row is missing or the
    // read errors — invites never break on a config miss.
    const { data: cfg } = await adminClient
      .from('app_config').select('value').eq('key', 'app_base_url').maybeSingle()
    const appBaseUrl = (cfg?.value ?? 'https://skyfire-app.vercel.app').replace(/\/+$/, '')

    // Bind the invitation to the validated org by stamping org_id into the
    // Supabase auth user's metadata. AcceptInvite-side onboarding reads this
    // to scope the new account to the inviter's org.
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appBaseUrl}/login`,
      data: { org_id, invited_by: user.id },
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, userId: data.user.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
