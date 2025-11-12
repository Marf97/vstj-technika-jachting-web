# Project Memory Bank: VŠTJ Technika Jachting Web

## Project Overview
- **Name**: VŠTJ Technika Jachting Web
- **Purpose**: Website for a sailing club (VŠTJ - University Sports Club) at Czech Technical University in Prague
- **Tech Stack**: React 19 + Vite, Material-UI (MUI), TypeScript/JSX
- **Authentication**: Azure AD via Microsoft Authentication Library (MSAL)
- **APIs**: Microsoft Graph API for SharePoint integration
- **Language**: Czech (content and comments)

## Key Technologies & Dependencies
- **React**: 19.2.0 (new version)
- **Vite**: 7.2.2 (build tool)
- **MUI**: @mui/material 7.3.5, @mui/icons-material 7.3.5, @emotion/react/styled 11.14.1
- **Markdown**: react-markdown for content rendering
- **Azure MSAL**: @azure/msal-browser 4.26.1
- **Theming**: Custom MUI theme with Outfit fonts and brand colors from PDF design
- **Build Tools**: ESLint, TypeScript types

## Project Structure
```
src/
├── assets/               # Static content files
│   ├── Font_outfit/     # Outfit font files (Light & Medium variants)
│   ├── logo/            # Organization logos (SVG & PNG formats)
│   ├── VSTJ_navrh_pokus.pdf # Brand guidelines PDF with colors & fonts
│   ├── onas.md          # About us content (Czech)
│   ├── vedeni.md        # Leadership/board contact info (Czech)
│   └── react.svg        # Unused React logo
├── components/          # React components
│   ├── Header.jsx       # Redesigned header with hero background & logo
│   ├── Footer.jsx       # Copyright footer with theme colors
│   ├── Gallery.tsx      # Dynamic image gallery from SharePoint
│   └── NavButton.jsx    # Reusable navigation button component
├── lib/                 # Utilities
│   ├── auth.ts          # Azure AD authentication setup
│   └── graph.ts         # Microsoft Graph API utilities
├── theme.js             # Custom MUI theme with brand colors & Outfit fonts
├── App.jsx              # Main app component with markdown content loading
├── App.css              # Component-specific styles
├── index.css            # Global styles with @font-face declarations
└── main.jsx             # React app entry point
```

## Azure AD & SharePoint Integration
**Environment Variables (.env):**
- `VITE_AAD_CLIENT_ID`: Azure AD app registration client ID
- `VITE_AAD_TENANT_ID`: Azure AD tenant ID
- `VITE_SITE_HOST`: SharePoint hostname (technikapraha.sharepoint.com)
- `VITE_SITE_PATH`: SharePoint site path (sites/jachting)
- `VITE_FOLDER_PATH`: Image folder path (verejne/fotky-verejne)

**Authentication Flow:**
1. User clicks gallery → triggers login popup if not authenticated
2. MSAL acquires token silently or via popup
3. Graph API calls fetch images from SharePoint folder
4. Images displayed with thumbnails, fallback to full download

**Permissions:**
- Delegated scopes: Files.Read, Sites.Read.All
- Graph API endpoints: sites/{siteId}/drive/root:/{folder}:/children

## Current Application State
**Layout:**
- **Redesigned Header**: PDF-inspired layout with logo left, navigation right, hero background image with navy overlay
- Content sections: "O nás", "Kontakt", "Galerie" with theme-styled markdown content
- Footer with copyright using navy theme color

**Content Status:**
- **Theme Implementation**: Full MUI theme with brand colors from PDF (#6396C1, #1F2646, #8F271E, #BF7D56, #6B6948) and Outfit fonts
- **Markdown Content**: "O nás" (onas.md) and "Kontakt" (vedeni.md) sections with theme-aware typography (navy headings, Outfit fonts)
- **Gallery Component**: Enhanced MUI ImageList masonry layout, modal dialogs with theme-styled close buttons
- **Navigation**: Simplified to active sections (O nás, Kontakt, Galerie) with reusable NavButton component
- **Content Management**: Markdown-based with proper theming via sx selectors

**Design System:**
- **Colors**: 5 brand colors from VSTJ_navrh_pokus.pdf integrated into MUI palette
- **Fonts**: Outfit Light (300) for body text, Outfit Medium (500) for headings
- **Components**: NavButton reusable component, theme-aware styling throughout

**Known Issues/Areas for Development:**
- **Navigation**: Commented-out sections for "Novinky", "Naše lodě", "Přihláška do oddílu"
- **Routing**: No routing system (single-page app)
- **Content Sections**: Some sections incomplete or not implemented
- **Gallery UX**: Loading states and error handling could be improved
- **Authentication**: UX could be enhanced (login/logout buttons, better error messages)
- **Internationalization**: No i18n setup (currently Czech-only)
- **Header Background**: Image positioning can be customized via `backgroundPosition` CSS property
- **Performance**: Image loading optimization for gallery
- **Responsive Design**: Header layout could be optimized for mobile devices

## Development Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build

## Code Patterns & Conventions
- **Components**: Functional components with hooks, reusable components (NavButton), modal dialogs for image viewing
- **Styling**: MUI ThemeProvider with custom theme, sx prop for inline styles, theme-aware components, @font-face for fonts
- **Theming**: Custom MUI palette with brand colors, Outfit typography configuration, theme hooks (useTheme)
- **Authentication**: Custom hooks in auth.ts, token provider pattern, proper MSAL initialization
- **API**: Async/await with error handling, fetch-based Graph calls
- **Types**: TypeScript for utilities, JSX for components
- **UI Patterns**: Masonry image layouts, modal dialogs with theme-styled close buttons, PDF-inspired header layout
- **Naming**: Czech comments, English technical terms, theme-aware component naming

## Recent Developments & Theme Implementation
**Brand Identity Integration (2025-11-12):**
- **Complete Theme Overhaul**: Migrated from basic MUI to custom theme with VŠTJ brand colors and Outfit fonts
- **PDF-Driven Design**: All colors and fonts extracted from VSTJ_navrh_pokus.pdf brand guidelines
- **Header Redesign**: PDF-inspired layout with logo left, navigation right, hero background
- **Component Architecture**: Created reusable NavButton component, theme-aware styling throughout
- **Typography System**: Outfit Light (300) for body, Outfit Medium (500) for headings
- **Color Palette**: Primary (#6396C1), Navy (#1F2646), Error (#8F271E), Secondary (#BF7D56), Olive (#6B6948)

## Future Development Considerations
- **Navigation Expansion**: Complete commented-out sections ("Novinky", "Naše lodě", "Přihláška do oddílu")
- **Routing System**: Implement client-side routing for multi-page sections
- **Content Management**: Expand markdown-based system, add more content sections
- **Authentication UX**: Login/logout buttons, better error handling, user session management
- **Mobile Optimization**: Responsive header layout, touch-friendly navigation
- **Performance**: Image loading optimization, lazy loading for gallery
- **PWA Features**: Offline capabilities, service workers, app manifest
- **Additional Sections**: News/blog functionality, contact forms, member registration

## Security Notes
- Environment variables properly configured
- .env file gitignored
- MSAL handles token storage securely
- SharePoint permissions appropriately scoped
- No sensitive data in client-side code

## Deployment Notes
- Static site deployable to any web server
- Requires Azure AD app registration
- SharePoint site permissions needed
- Environment variables must be configured in deployment

---

*Last Updated: 2025-11-12*
*Recent Theme Implementation: 2025-11-12*
*Analyzed by: Roo (Code & Architect Modes)*