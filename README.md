# VŠTJ Technika – Jachting ČVUT

Jednoduchá klubová webová aplikace: veřejné stránky, aktuality, seznam členů a událostí, kalendář akcí včetně exportu do **iCal (.ics)**.  
Postaveno na **Next.js (App Router) + TypeScript + MUI** s databází **PostgreSQL** přes **Prisma**.

## Tech stack

- **Next.js 14+ (App Router)**, **TypeScript**
- **MUI** (komponenty + theming), MUI **DataGrid**, **X Date Pickers**
- **FullCalendar** (UI kalendář)
- **Prisma** + **PostgreSQL** (DB)
- **ical-generator** (jednotlivé .ics + veřejný iCal feed)
- **pnpm** (správce balíčků), **Docker Compose** (lokální Postgres)
- Utility: **Zod**, **React Hook Form**, **date-fns/luxon**

---

## Struktura repozitáře

```
.
├── docker-compose.yml        # Lokální databáze (PostgreSQL)
├── next.config.ts             # Konfigurace Next.js
├── package.json               # Závislosti a skripty
├── prisma/
│   ├── schema.prisma          # Databázové schéma
│   ├── seed.ts                # Seedovací skript s testovacími daty
│   └── migrations/            # Migrace databáze (vytvořené Prisma CLI)
│
├── public/                    # Statické soubory (obrázky, loga, ikony)
│   ├── hero.jpg
│   └── danik.jpg
│
├── src/
│   ├── app/                   # Hlavní Next.js App Router
│   │   ├── (site)/            # Veřejná část webu
│   │   ├── (member)/          # Členská sekce
│   │   ├── (admin)/           # Administrace klubu
│   │   ├── api/               # API routy (Next.js server actions / REST)
│   │   ├── globals.css        # Globální styly
│   │   ├── layout.tsx         # Root layout aplikace
│   │   └── providers.tsx      # Globální React kontejnery (Theme, Session apod.)
│   │
│   ├── components/            # Sdílené UI komponenty
│   │   ├── auth/              # Komponenty pro přihlášení (AuthButton, Dialog)
│   │   ├── layout/            # Hlavička, patička, kontejnery
│   │   ├── ui/                # Obecné prvky (ButtonLink, NavLink…)
│   │   └── widgets/           # Obsahové bloky (Hero, NewsList, Bannery)
│   │
│   ├── features/              # Funkční moduly webu
│   │   ├── calendar/          # Kalendář akcí
│   │   ├── events/            # Události a akce
│   │   └── members/           # Správa členů (tabulka, detaily)
│   │
│   ├── lib/                   # Pomocné knihovny
│   │   ├── auth.ts            # NextAuth konfigurace
│   │   └── db.ts              # Prisma klient a DB připojení
│   │
│   ├── theme.ts               # MUI téma (barevná paleta, typografie)
│   └── proxy.ts               # Proxy konfigurace pro vývoj
│
├── types/                     # Typové deklarace pro NextAuth a API
│   ├── next-auth.d.ts
│   ├── next-auth-jwt.d.ts
│   └── routes.d.ts
│
├── tsconfig.json              # TypeScript konfigurace
└── eslint.config.mjs          # ESLint pravidla (typově bezpečný kód)
```

> Konvence: 

> **Veřejné stránky**: `src/app/(site)/*`.  

> **Admin**: `src/app/(admin)/*`.

> **Člen**: `src/app/(member)/*`.

---

## Spuštění na lokálu

### Předpoklady (pre-requisites)
- **Node.js LTS** (doporučeno přes `nvm`)
- **pnpm** (`npm i -g pnpm`)
- **Docker** + **Docker Compose**
- (volitelné) **Git**

### 1) Nainstaluj závislosti
```bash
pnpm install
```

### 2) Spusť databázi (PostgreSQL v Dockeru)
```bash
docker compose up -d
```

### 3) Konfiguruj prostředí
Vytvoř `.env` v kořeni projektu (pokud ještě nemáš):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/klub?schema=public
PUBLIC_BASE_URL=http://localhost:3000
```

### 4) Migrace + (volitelně) seed
```bash
pnpm dlx prisma migrate dev --name init
pnpm dlx prisma db seed
```

### 5) Dev server
```bash
pnpm dev
# http://localhost:3000
```

Užitečné příkazy:
```bash
pnpm build && pnpm start   # prod build lokálně
pnpm dlx prisma studio     # GUI nad DB
```

---

## Základní funkce (MVP)

- TBD (musím se sejít s Jáchymem a Johnnym, abychom si řekli co je MVP pro nás)

---

## Architektura a pravidla „co kam patří“

### 1) `app/` – routing, layout, API
- `app/(site)/**/page.tsx` jsou **Server Components**: skládají UI z komponent a volají **serverové dotazy**.  
  Žádné dlouhé byznys funkce, žádné přímé volání DB z UI komponent mimo query/helperů.
- `app/api/**/route.ts` jsou **HTTP endpointy** (REST) – vhodné pro veřejné feedy (.ics) a integrace.
- `layout.tsx` drží **globální kostru** (header, footer, `<Container/>`).
- `providers.tsx` řeší **MUI Theme** + **AppRouterCacheProvider** (kvůli SSR/hydration).

> **Pravidlo RSC:** V **Server Components** **nepředávej funkce/komponenty** do klientských komponent.  
> Typický prohřešek: `component={Link}` u MUI Buttonu.  
> **Používej** obálky `ButtonLink`/`NavLink` nebo vytvoř novou variantu.

### 2) `components/` – sdílené UI
- `components/layout/*`: AppLayout, SiteHeader, SiteFooter – používají se napříč celým webem.
- `components/ui/*`: drobné, znovupoužitelné obálky (např. **ButtonLink**, **NavLink**, ConfirmDialog…).
- `components/widgets/*`: větší vizuální bloky bez doménové logiky (Hero, NewsList, RightColumn).

### 3) `features/` – doménové moduly
Každá doména má vlastní složku:
```
features/<feature>/
  components/   # tabulky, formuláře, detailní UI spjaté s doménou
  server/       # (až bude) queries.ts (čtení), actions.ts (mutace – Server Actions)
  types.ts      # typy specifické pro danou doménu
```
**Stránky** si tyto komponenty jen skládají a předávají jim data.

### 4) `lib/` – sdílená logika a utility
- `lib/db.ts` – Prisma Client jako **singleton** (vyhneme se „Too many Prisma clients“).
- `lib/dates.ts`, `lib/ical.ts` (až bude) – centralizace formátů, časových zón, ICS helperů.

### 5) Stylování (MUI)
- Všechno styluj přes **MUI theme** a `sx` prop.  
- Větší změny stylů konzultovat.

### 6) Data a čas
- Časové zóny **Europe/Prague** – používej `date-fns`/`luxon` helpery (případně `Intl`).
- Pro serializaci dat do Client Components posílej **stringy** (ISO), ne `Date` instance.

### 7) iCal
- Generace `.ics` je v API routách.  
- Pokud logika poroste, vyčleň helpery do `lib/ical.ts`.

---

## Konvence a lint

- **Imports**: (volitelné) `simple-import-sort` + `unused-imports` v `eslint.config.mjs`.
- **Paths alias**: `@/*` → `src/*`.  
- **Názvosloví**: komponenty `PascalCase`, složky/domy `kebab-case` nebo `lowercase` konzistentně.  
- **Client vs Server**:
  - `use client` pouze tam, kde je to nutné (formy, tabulky, FullCalendar…).
  - Serverové soubory nesmí importovat client-only knihovny.

---

## TODO / další kroky

- [ ] Auth (NextAuth) pro administraci obsahu.
- [ ] `features/*/server/queries.ts` + `actions.ts` (Server Actions). Reálná fungující databáze
- [ ] Validace a formuláře (RHF + Zod) pro události/členy.
- [ ] Admin a Člen rozhraní pro účast na akcích
- [ ] Dockerfile + Compose pro **produkční** nasazení (Caddy/Traefik + TLS).
- [ ] Vyřešit prisma configuraci mezi prisma.config.ts a .env 
- [ ] Zvážit jiný kalendář

---

## Rychlý troubleshooting

- **Hydration mismatch (MUI)** → ujisti se, že `providers.tsx` používá  
  `AppRouterCacheProvider` z `@mui/material-nextjs/v14-appRouter`.
- **Prisma „Missing DATABASE_URL“** → `.env` je v kořeni vedle `package.json`.  
- **„Too many Prisma clients“** → vždy importuj `prisma` z `lib/db`, je na to singleton.
