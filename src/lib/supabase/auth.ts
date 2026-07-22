'use server'

import { redirect } from 'next/navigation'
import { createServerSupabase } from './server'

export async function signIn(email: string, password: string) {
  const supabase = createServerSupabase()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  return { error: null }
}

export async function signUp(email: string, password: string, name: string) {
  const supabase = createServerSupabase()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
  if (error) return { error: error.message }
  return { error: null, confirmation: true }
}

export async function signOut() {
  const supabase = createServerSupabase()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function getSession() {
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser() {
  const supabase = createServerSupabase()
  const { data } = await supabase.auth.getUser()
  return data.user
}
