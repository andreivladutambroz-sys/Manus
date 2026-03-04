# Deployment Guide - Mechanic Helper

## Prerequisite

- Supabase Project (cu credențiale: URL, Anon Key, Service Role Key)
- Vercel Account
- GitHub Repository (pentru a conecta la Vercel)

## Pasul 1: Configurare Supabase

1. Mergi la https://app.supabase.com
2. Creează un proiect nou sau selectează proiectul existent
3. Mergi la **Settings → API**
4. Copie:
   - **Project URL** (de forma `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** secret key

## Pasul 2: Configurare Variabile de Mediu

Variabilele necesare pentru Vercel:

```
DATABASE_URL=mysql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
KIMI_API_KEY=your-kimi-api-key
JWT_SECRET=your-jwt-secret
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name
```

## Pasul 3: Deploy pe Vercel

### Opțiunea 1: Prin Git (Recomandat)

1. Push codul pe GitHub
2. Mergi la https://vercel.com
3. Conectează GitHub account
4. Selectează repository-ul `mechanic-helper`
5. Vercel va detecta automat că e un proiect Next.js/Vite
6. Adaugă variabilele de mediu în **Settings → Environment Variables**
7. Click **Deploy**

### Opțiunea 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Pasul 4: Configurare Baza de Date

După deployment, baza de date va fi creată automat pe Supabase cu schema noastră.

Verifică dacă tabelele au fost create:
- users
- profiles
- vehicles
- diagnostics
- diagnosticImages
- notifications
- knowledgeBase

## Pasul 5: Testare

1. Accesează URL-ul din Vercel (de forma `https://mechanic-helper.vercel.app`)
2. Conectează-te cu Manus OAuth
3. Creează un diagnostic de test
4. Verifică dacă Kimi AI funcționează

## Troubleshooting

### Eroare: "Cannot connect to database"
- Verifică dacă `DATABASE_URL` este corect
- Asigură-te că Supabase project este activ
- Verifică firewall settings în Supabase

### Eroare: "Kimi API Key invalid"
- Verifică dacă `KIMI_API_KEY` este corect
- Asigură-te că cheia nu a expirat

### Eroare: "OAuth callback failed"
- Verifică dacă `VITE_APP_ID` și `OAUTH_SERVER_URL` sunt corecte
- Adaugă URL-ul Vercel în OAuth redirect URIs

## Resurse

- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team)
