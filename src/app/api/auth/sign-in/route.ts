import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (!email || !password) return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return NextResponse.json({ error: "Autenticação não configurada." }, { status: 503 });

    const cookieStore = await cookies();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, {
            ...options,
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
          }));
        },
      },
    });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: "Não foi possível entrar. Confira o e-mail e a senha." }, { status: 401 });
    return NextResponse.json({ ok: true, destination: email === "zildahenderson9@gmail.com" ? "/platform-admin" : "/" });
  } catch {
    return NextResponse.json({ error: "O serviço de autenticação não respondeu." }, { status: 500 });
  }
}
