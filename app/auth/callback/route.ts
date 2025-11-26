import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Check if user has completed onboarding
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('onboarding_completed')
                    .eq('id', user.id)
                    .single()

                // If onboarding not completed, redirect to onboarding
                if (!profile?.onboarding_completed) {
                    const forwardedHost = request.headers.get('x-forwarded-host')
                    const isLocalEnv = process.env.NODE_ENV === 'development'
                    if (isLocalEnv) {
                        return NextResponse.redirect(`${origin}/onboarding`)
                    } else if (forwardedHost) {
                        return NextResponse.redirect(`https://${forwardedHost}/onboarding`)
                    } else {
                        return NextResponse.redirect(`${origin}/onboarding`)
                    }
                }
            }

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth`)
}
