# ✅ Co zostało zautomatyzowane

## 🚀 Gotowe do użycia

### 1. Skrypty npm:
```bash
# Automatyczny setup produkcji (interaktywny)
npm run setup:production

# Generowanie szablonu .env.local
npm run setup:env

# Generowanie ENCRYPTION_KEY
npm run generate:encryption-key
```

### 2. Wygenerowany ENCRYPTION_KEY:
```
3DlWJJdcdSdExL8w3cvl3QZm8C7hC33BmTLaEV0kunY=
```
⚠️ **Zapisz ten klucz!** Będziesz go potrzebować w Vercel environment variables.

---

## 📋 Co musisz zrobić ręcznie

### KROK 1: Utwórz tabele w bazie
```bash
# Ustaw DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_71KzkANLtsYW@ep-flat-base-agknbdmi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

# Uruchom automatyczny setup (interaktywny)
npm run setup:production

# LUB ręcznie:
npm run db:push
```

### KROK 2: Clerk Production Keys
1. Przejdź do: https://dashboard.clerk.com
2. Przełącz się na **Production** environment
3. Skopiuj:
   - Production Publishable Key
   - Production Secret Key
4. Dodaj domenę Vercel do Allowed Origins:
   - `https://codesentinel-six.vercel.app`

### KROK 3: Vercel Environment Variables
Przejdź do: https://vercel.com/dashboard → Settings → Environment Variables

Dodaj wszystkie zmienne (dla Production, Preview, Development):

#### Wymagane:
- `DATABASE_URL` = `postgresql://neondb_owner:npg_71KzkANLtsYW@ep-flat-base-agknbdmi-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require`
- `ENCRYPTION_KEY` = `3DlWJJdcdSdExL8w3cvl3QZm8C7hC33BmTLaEV0kunY=`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = [Production key z Clerk]
- `CLERK_SECRET_KEY` = [Production key z Clerk]

#### Opcjonalne:
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/dashboard`

### KROK 4: Redeploy
```bash
git add .
git commit -m "chore: Add production setup automation"
git push origin main
```

LUB ręcznie w Vercel Dashboard → Deployments → Redeploy

---

## 📚 Dokumentacja

- **Szczegółowy przewodnik:** [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)
- **README z quick start:** [README.md](./README.md)

---

## ⚠️ Ważne uwagi

1. **ENCRYPTION_KEY**: Zapisz go bezpiecznie! Bez niego nie będziesz mógł odszyfrować tokenów GitHub użytkowników.

2. **Clerk Keys**: Używaj tylko **Production** keys w Vercel, nie development!

3. **Database**: Tabele muszą być utworzone PRZED pierwszym deployem na produkcji.

4. **GitHub OAuth**: Upewnij się że w Clerk są ustawione scopes: `repo`, `read:user`, `user:email`

---

## ✅ Checklist

- [ ] Uruchom `npm run setup:production` (utworzy tabele)
- [ ] Przełącz Clerk na Production
- [ ] Skopiuj Production keys z Clerk
- [ ] Dodaj wszystkie zmienne do Vercel
- [ ] Dodaj domenę Vercel do Clerk Allowed Origins
- [ ] Redeploy na Vercel
- [ ] Przetestuj logowanie i ładowanie repozytoriów

---

**Gotowe! 🎉**

