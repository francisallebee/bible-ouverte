import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { pageAccueil } from '@/lib/accueil'

/**
 * Chemins servis sans session.
 *
 * `/auth` porte la connexion et l'inscription. `/` porte désormais la page de
 * présentation : c'est la seule page que voit un visiteur qui n'a pas encore de
 * compte, elle ne peut donc pas renvoyer vers /auth/login.
 */
function isPublicPath(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/auth')
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // `/` sert la page de présentation, qui n'a rien à dire à quelqu'un de déjà
    // inscrit ; /auth porte la connexion, dont il n'a plus besoin non plus.
    //
    // Cette redirection est ici et non dans la page pour que `/` reste
    // prérendue : le middleware a déjà la session sous la main, la page n'a
    // donc aucune raison de la redemander à chaque visite anonyme.
    if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/auth')) {
      // La destination est un réglage depuis le 1er septembre 2026, et non plus
      // `/new-reading` pour tout le monde.
      //
      // La requête est faite **ici seulement**, sur les deux chemins qui
      // redirigent : c'est le moment d'une connexion ou d'un retour à la
      // racine, pas une navigation ordinaire. Les autres écrans n'en paient
      // donc rien, ce qui compte dans un dépôt où le temps de chargement tient
      // déjà aux appels Supabase.
      //
      // Une erreur ou une absence de ligne rend le défaut : un réglage
      // illisible ne doit pas empêcher d'entrer dans l'application.
      const { data: reglages } = await supabase
        .from('settings')
        .select('data')
        .eq('user_id', user.id)
        .maybeSingle()
      const donnees = (reglages?.data ?? {}) as { homePage?: string; hiddenPages?: string[] }

      const url = request.nextUrl.clone()
      url.pathname = pageAccueil(donnees.homePage, donnees.hiddenPages ?? [])
      url.search = ''
      return NextResponse.redirect(url)
    }

    // Check if user is suspended
    const { data: profile } = await supabase
      .from('profiles')
      .select('suspended')
      .eq('id', user.id)
      .single()

    if (profile?.suspended) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      // Le setter `pathname` échappe le `?` en %3F : la chaîne complète menait
      // à /auth/login%3Ferror=suspended, une page inexistante. Le motif de la
      // déconnexion doit passer par `search`.
      url.pathname = '/auth/login'
      url.search = '?error=suspended'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
