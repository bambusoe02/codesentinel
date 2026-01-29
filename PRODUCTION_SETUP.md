# 🚀 CodeSentinel - Production Setup Guide

## Step-by-Step Guide

### STEP 1: Automatic Database Table Creation in Neon

**Option A: Use automatic script (recommended):**
```bash
npm run setup:production
```

The script automatically:
- ✅ Checks if `DATABASE_URL` is set
- ✅ Generates `ENCRYPTION_KEY` if it doesn't exist
- ✅ Runs `npm run db:push` to create tables
- ✅ Verifies that tables were created
- ✅ Shows summary of next steps

**Option B: Manual:**
```bash
# 1. Set DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_ePYVWi6nMT7F@ep-bitter-brook-ag1latts-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# 2. Run schema push
npm run db:push

# 3. Verify in Neon Dashboard → SQL Editor
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Powinny być widoczne tabele: `users`, `repositories`, `analysis_reports`, `repository_metrics`

---

### KROK 2: Wygeneruj klucze i zmienne środowiskowe

**2.1 Wygeneruj ENCRYPTION_KEY:**
```bash
npm run generate:encryption-key
# Lub ręcznie:
openssl rand -base64 32
```

**2.2 Utwórz szablon .env.local:**
```bash
npm run setup:env
```

**2.3 Wypełnij wartości w .env.local:**
- `DATABASE_URL` - Twój connection string z Neon
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Z Clerk Dashboard (Production!)
- `CLERK_SECRET_KEY` - Z Clerk Dashboard (Production!)
- `ENCRYPTION_KEY` - Wygenerowany w kroku 2.1

---

### KROK 3: Konfiguracja Clerk (Production Keys)

**3.1 Przejdź do Clerk Dashboard:**
- https://dashboard.clerk.com
- Przełącz się na **Production** environment (nie Development!)

**3.2 Skopiuj Production Keys:**
- API Keys → Publishable Key (Production) → Kopiuj
- API Keys → Secret Key (Production) → Kopiuj

**3.3 Dodaj domenę Vercel do Allowed Origins:**
- Social Connections → Settings → Allowed Origins
- Dodaj: `https://codesentinel-six.vercel.app`
- Dodaj: `https://*.vercel.app` (opcjonalnie, dla preview deployments)

**3.4 Sprawdź GitHub OAuth Scopes:**
- Social Connections → GitHub → Configure
- Muszą być zaznaczone: `repo`, `read:user`, `user:email`

---

### KROK 4: Dodaj Environment Variables do Vercel

**4.1 Otwórz Vercel Dashboard:**
- https://vercel.com/dashboard
- Wybierz projekt `codesentinel`

**4.2 Przejdź do Settings → Environment Variables**

**4.3 Dodaj wszystkie wymagane zmienne:**

#### A. DATABASE_URL
```
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_ePYVWi6nMT7F@ep-bitter-brook-ag1latts-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### B. ENCRYPTION_KEY
```
Name: ENCRYPTION_KEY
Value: [klucz wygenerowany w kroku 2.1]
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### C. Clerk Keys (⚠️ PRODUCTION - nie development!)
```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: [Production publishable key z Clerk]
Environment: ✅ Production, ✅ Preview, ✅ Development

Name: CLERK_SECRET_KEY
Value: [Production secret key z Clerk]
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### D. Opcjonalne: Clerk URLs
```
Name: NEXT_PUBLIC_CLERK_SIGN_IN_URL
Value: /sign-in
Environment: ✅ Production, ✅ Preview, ✅ Development

Name: NEXT_PUBLIC_CLERK_SIGN_UP_URL
Value: /sign-up
Environment: ✅ Production, ✅ Preview, ✅ Development

Name: NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
Value: /dashboard
Environment: ✅ Production, ✅ Preview, ✅ Development

Name: NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
Value: /dashboard
Environment: ✅ Production, ✅ Preview, ✅ Development
```

**4.4 Zapisz wszystkie zmienne**

---

### KROK 5: Redeploy na Vercel

**Opcja A: Automatyczny redeploy (via GitHub Actions):**
```bash
git add .
git commit -m "chore: Production setup complete"
git push origin main
# GitHub Actions automatycznie zredeployuje
```

**Opcja B: Manual redeploy:**
- Vercel Dashboard → Deployments → "..." → Redeploy

---

### KROK 6: Weryfikacja

**6.1 Sprawdź Vercel Logs:**
- Vercel Dashboard → Deployments → najnowszy deployment → Logs
- ❌ Nie powinno być: `relation "users" does not exist`
- ✅ Powinno być: `Build successful`, `Deployment ready`

**6.2 Przetestuj aplikację:**
1. Otwórz: https://codesentinel-six.vercel.app
2. Zaloguj się przez GitHub
3. Sprawdź Dashboard — powinny załadować się repozytoria

**6.3 Jeśli nadal są problemy:**
- Sprawdź Vercel Logs — czy są inne błędy?
- Sprawdź Neon Dashboard — czy tabele istnieją?
- Sprawdź Browser Console — czy są błędy w przeglądarce?

---

## ✅ Checklist przed deploy

- [ ] Tabele utworzone w Neon (`npm run setup:production` lub `npm run db:push`)
- [ ] `DATABASE_URL` ustawiony w Vercel
- [ ] `ENCRYPTION_KEY` wygenerowany i dodany do Vercel
- [ ] Clerk **Production** keys ustawione w Vercel (nie development!)
- [ ] Domena Vercel dodana do Clerk Allowed Origins
- [ ] GitHub OAuth scopes ustawione w Clerk (`repo`, `read:user`)
- [ ] Redeploy wykonany

---

## 🔧 Troubleshooting

### Problem: "relation users does not exist"
**Rozwiązanie:** Uruchom `npm run setup:production` lub `npm run db:push` z production `DATABASE_URL`

### Problem: "Clerk development keys"
**Rozwiązanie:** Upewnij się że używasz **Production** keys w Vercel, nie development!

### Problem: "404 on API routes"
**Solution:** Check if tables exist in Neon (Step 1)

### Problem: "Repositories not loading"
**Solution:**
1. Check Vercel Logs for errors
2. Check if user was synchronized after login
3. Check if GitHub token was automatically retrieved from Clerk

### Problem: "Encryption key not configured"
**Rozwiązanie:** Upewnij się że `ENCRYPTION_KEY` jest ustawiony w Vercel environment variables

---

## 📚 Dodatkowe zasoby

- [Clerk Documentation](https://clerk.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)

---

**Gotowe! 🎉**

Po wykonaniu wszystkich kroków aplikacja powinna działać w pełni produkcyjnie.

