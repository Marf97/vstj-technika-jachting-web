# Project Memory Bank: VŠTJ Technika Jachting Web

## Project Overview
- **Name**: VŠTJ Technika Jachting Web
- **Purpose**: Website for a sailing club (VŠTJ - University Sports Club) at Czech Technical University in Prague
- **Tech Stack**: React 19 + Vite, Material-UI (MUI), TypeScript/JSX
- **Authentication**: Azure AD via Microsoft Authentication Library (MSAL)
- **APIs**: Microsoft Graph API for SharePoint integration
- **Language**: Czech (content and comments)

## Key Technologies & Dependencies
- **React**: 18.3.1 (downgraded from 19.2.0 for MUI compatibility)
- **Vite**: 7.2.2 (build tool)
- **MUI**: @mui/material 7.3.5, @mui/icons-material 7.3.5, @emotion/react/styled 11.14.1
- **Markdown**: react-markdown with remark-gfm for content rendering (supports tables, GFM features)
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
│   ├── boats.md         # Boat specifications and information (Czech)
│   └── react.svg        # Unused React logo
├── components/          # React components
│   ├── Header.jsx       # Redesigned header with hero background & logo
│   ├── Footer.jsx       # Copyright footer with theme colors
│   ├── Gallery.tsx      # Dynamic image gallery from SharePoint via PHP proxy
│   ├── News.tsx         # News/articles component with markdown rendering
│   ├── Boats.jsx        # Boats page component displaying boat specifications
│   └── NavButton.jsx    # Reusable navigation button component
├── lib/                 # Utilities
│   ├── auth.ts          # Azure AD authentication setup (client-side)
│   └── graph.ts         # PHP proxy utilities (server-side Graph API calls)
├── theme.js             # Custom MUI theme with brand colors & Outfit fonts
├── App.jsx              # Main app component with routing and markdown content loading (React Router)
├── App.css              # Component-specific styles
├── index.css            # Global styles with @font-face declarations
└── main.jsx             # React app entry point

Docker & PHP Proxy (Development):
├── Dockerfile           # PHP Apache container configuration
├── docker-compose.yml   # Docker Compose for PHP proxy server
├── php_proxy.php        # Lists images from SharePoint
└── php_get_image.php    # Downloads individual full-resolution images

Environment:
├── .env                 # Frontend environment variables
├── .env.php             # PHP proxy secrets (gitignored)
└── .gitignore          # Excludes secrets and build artifacts
```

## Azure AD & SharePoint Integration
**Environment Variables (.env):**
- `VITE_AAD_CLIENT_ID`: Azure AD app registration client ID
- `VITE_AAD_TENANT_ID`: Azure AD tenant ID
- `VITE_SITE_HOST`: SharePoint hostname (technikapraha.sharepoint.com)
- `VITE_SITE_PATH`: SharePoint site path (sites/jachting)
- `VITE_FOLDER_PATH`: Image folder path (verejne/fotky-verejne)

**PHP Proxy Environment Variables (.env.php):**
- `CLIENT_ID`: Azure AD client ID for server-side API calls
- `TENANT_ID`: Azure AD tenant ID
- `CLIENT_SECRET`: Azure AD client secret

**Authentication Flow:**
1. User loads page → PHP proxy fetches images server-side using app-only authentication
2. Images displayed with thumbnails from SharePoint
3. User clicks image → full-resolution image fetched via dedicated PHP endpoint
4. CORS headers allow cross-origin requests from both dev and production domains

**Permissions:**
- Delegated scopes: Files.Read, Sites.Read.All
- Graph API endpoints: sites/{siteId}/drive/root:/{folder}:/children

## Current Application State
**Layout:**
- **Responsive Header**: PDF-inspired layout with responsive logo scaling (60px mobile, 80px tablet, 100px desktop), navigation right with vertical stacking on mobile
- Content sections: "O nás", "Kontakt", "Galerie", "Novinky", "Naše lodě" with theme-styled markdown content
- Footer with copyright using navy theme color
- **Responsive Gallery**: MUI ImageList with standard layout, responsive columns (1 mobile, 2 tablet, 3 medium, 4 large), fixed 4:3 aspect ratios for consistent sizing
- **Multi-page Navigation**: React Router implementation with dedicated routes for different content sections

**Content Status:**
- **Theme Implementation**: Full MUI theme with brand colors from PDF (#6396C1, #1F2646, #8F271E, #BF7D56, #6B6948) and Outfit fonts
- **Markdown Content**: "O nás" (onas.md), "Kontakt" (vedeni.md), "Naše lodě" (boats.md) sections with theme-aware typography (navy headings, Outfit fonts)
- **Gallery Component**: Enhanced MUI ImageList masonry layout, fullscreen modal dialogs with theme-styled close buttons, full-resolution image loading on click, click-outside-to-close functionality
- **News Component**: Full news/articles system with year-based browsing, SharePoint integration, and markdown rendering
- **Boats Component**: Dedicated page for boat specifications with responsive 2-column layout, centered tables and thumbnails, full-screen modal viewing, unified thumbnail dimensions (250x200px), and proper source attribution formatting
- **Navigation**: Expanded to active sections (O nás, Kontakt, Galerie, Novinky, Naše lodě) with reusable NavButton component
- **Content Management**: Markdown-based with proper theming via sx selectors, table support via remark-gfm

**Design System:**
- **Colors**: 5 brand colors from VSTJ_navrh_pokus.pdf integrated into MUI palette
- **Fonts**: Outfit Light (300) for body text, Outfit Medium (500) for headings
- **Components**: NavButton reusable component, theme-aware styling throughout

**Known Issues/Areas for Development:**
- **Navigation**: Partially complete - "Naše lodě" and "Novinky" implemented, "Přihláška do oddílu" pending
- **Routing**: Client-side routing implemented with React Router for multi-page sections
- **Content Sections**: "Naše lodě" and "Novinky" fully implemented, other sections available for development
- **Gallery UX**: Full-resolution image loading with loading states, click-outside-to-close functionality, responsive fullscreen modal dialogs, robust error handling for failed image loads
- **Authentication**: UX could be enhanced (login/logout buttons, better error messages)
- **Internationalization**: No i18n setup (currently Czech-only)
- **Header Background**: Image positioning can be customized via `backgroundPosition` CSS property
- **Performance**: Image loading optimization for gallery, cURL redirect handling for Graph API
- **Responsive Design**: Header and gallery fully responsive with mobile-optimized layouts
- **Infrastructure**: Robust PHP proxy with redirect handling, comprehensive error diagnostics for Graph API integration

## Development Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build
- `docker-compose restart`: Restart PHP proxy container after backend changes (required when modifying PHP files)

## Code Patterns & Conventions
- **Components**: Functional components with hooks, reusable components (NavButton), modal dialogs for image viewing
- **Styling**: MUI ThemeProvider with custom theme, sx prop for inline styles, theme-aware components, @font-face for fonts
- **Theming**: Custom MUI palette with brand colors, Outfit typography configuration, theme hooks (useTheme)
- **Authentication**: Dual approach - client-side MSAL for users, server-side app-only for API proxy
- **API**: Async/await with error handling, PHP proxy for Graph API calls, environment-based configuration
- **Types**: TypeScript for utilities, JSX for components
- **Routing**: React Router v7 with programmatic navigation and route-based component loading
- **Markdown Processing**: Enhanced with remark-gfm plugin for GitHub Flavored Markdown support (tables, strikethrough, etc.)
- **UI Patterns**: Masonry image layouts, modal dialogs with theme-styled close buttons, PDF-inspired header layout
- **Infrastructure**: Docker containers for development, environment variable secrets management
- **Security**: Gitignored secrets, CORS validation, AES-256 encrypted token caching, proper error handling without information leakage
- **Naming**: Czech comments, English technical terms, theme-aware component naming

## Recent Developments & Gallery Improvements
**Gallery Enhancement (2025-11-12):**
- **React Compatibility**: Resolved React 19/MUI 7 compatibility issues by downgrading to React 18.3.1
- **Full-Resolution Images**: Implemented on-demand full-resolution image loading for modal dialogs
- **Enhanced UX**: Added fullscreen modal dialogs with click-outside-to-close, loading states, and responsive image display
- **Performance Optimization**: Thumbnails load initially, full images only when requested

**PHP Proxy Implementation (2025-11-13):**
- **Docker Integration**: Containerized PHP Apache server for development proxy
- **Security Enhancement**: Removed hardcoded secrets, environment variable configuration
- **Dual Endpoints**: Separate PHP files for image listing and individual image downloads
- **CORS Support**: Dynamic origin validation for both development and production domains
- **Environment Management**: Gitignored secrets file with Docker environment loading
- **Performance Caching**: AES-256 encrypted token caching (50min) and gallery data caching (5min)
- **Security Standards**: OAuth 2.0 compliant token storage with encryption and access controls

**Gallery Performance Optimization (2025-11-15):**
- **Site ID Caching**: Implemented persistent site ID caching (24h) to eliminate repeated SharePoint site lookups
- **Full-Resolution Image Caching**: Added binary image content caching (1h) to avoid redundant downloads
- **Performance Monitoring**: Integrated detailed timing metrics and debug headers for optimization tracking
- **Shared Site Cache**: Unified site ID caching across both PHP endpoints for consistent performance
- **Enhanced Logging**: Comprehensive performance logging for token acquisition, API calls, and caching hits

**Gallery Responsive Layout Update (2025-11-15):**
- **Dynamic Column Count**: Implemented progressive responsive grid (2 mobile → 3 tablet → 4 desktop)
- **CSS Override Fix**: Used `!important` declarations to ensure MUI ImageList respects responsive breakpoints
- **Consistent Aspect Ratios**: Maintained 4:3 aspect ratios across all screen sizes
- **Improved Mobile Experience**: Better thumbnail sizing and spacing on smaller screens

**Gallery Infinite Scrolling Implementation (2025-11-15):**
- **Smart Loading Strategy**: Initial load of 20 thumbnails, then 10 more on scroll-to-bottom
- **IntersectionObserver API**: Efficient scroll detection without performance impact
- **Server-Side Pagination**: PHP proxy supports `top`/`skip` parameters with proper offset tracking
- **Newest-First Sorting**: Images sorted by creation date descending (newest images first)
- **Loading States**: Circular progress indicator during incremental loads
- **End-of-Content Message**: Czech "Žádné další obrázky k načtení" when all images loaded
- **Duplicate Prevention**: Proper offset management prevents loading the same images repeatedly
- **Backend Caching**: Server-side image caching with 5-minute TTL for optimal performance

**Gallery Year-Based Browsing Implementation (2025-11-15):**
- **Dual Browsing Modes**: Default year-fallback mode ("Nejnovější fotky") and specific year selection mode
- **Default Mode Logic**: Starts with current year (2025), automatically falls back to previous years (2024, 2023, etc.) when exhausted
- **Year Selector UI**: MUI Button with dropdown menu showing available years from SharePoint folders
- **Year Captions**: In default mode, photos are visually grouped under year headers spanning full grid width
- **Persistent Header**: Gallery title and year selector remain visible during all loading states
- **Loading Animation**: Professional bordered box with circular progress indicator and Czech text
- **PHP Proxy Enhancements**: Added `year` parameter support and `list_years` endpoint for dynamic year folder enumeration
- **Year Folder Structure**: Images organized in numeric year folders (2025, 2024, etc.) within base gallery folder
- **Year-Specific Browsing**: When selecting a specific year, infinite scroll is limited to that year's images only
- **Fallback Algorithm**: Collects and sorts images from all available year folders in descending year order
- **Performance Optimization**: Year folder enumeration cached, individual year requests avoid base folder caching
- **User Experience**: Clear visual indication of current browsing mode, seamless year switching, no reloading on same selection
- **Error Handling**: Graceful degradation when year folders are inaccessible, maintains backward compatibility
- **Frontend Integration**: React state management for year selection, loading states, and UI updates with TypeScript support
- **Backend Architecture**: Server-side pagination with year-aware image collection and sorting
- **Bug Fixes**: Prevents unnecessary reloading when re-selecting the same year option
- **Responsive Design**: Year headers and controls work across all screen sizes (mobile, tablet, desktop)

**Gallery Image Loading Fix (2025-11-15):**
- **Root Cause**: PHP cURL requests to Microsoft Graph API /content endpoint were not following redirects, causing frontend to receive 302 redirects instead of image bytes
- **Microsoft Graph Behavior**: Graph API intentionally returns 302 redirects to pre-authenticated SharePoint/OneDrive download URLs for security and routing optimization
- **Fix Implementation**: Enhanced cURL configuration with redirect following (CURLOPT_FOLLOWLOCATION, CURLOPT_MAXREDIRS), robust error handling, and comprehensive logging
- **Robust cURL Options**: Added CURLOPT_RETURNTRANSFER, CURLOPT_HEADER, and detailed error diagnostics for troubleshooting authentication and permission issues
- **Alternative Implementation**: Added commented code path for direct @microsoft.graph.downloadUrl usage, eliminating server-side proxying if needed
- **Enhanced Diagnostics**: ERROR-level logging for failed requests with HTTP codes, redirect counts, final URLs, and special detection for authentication redirects to login.microsoftonline.com
- **Post-Mortem Documentation**: Comprehensive internal documentation added to Gallery.php for future maintenance and similar issues
- **Prevention Strategy**: Clear guidance on handling Graph API redirects, with fallback options for different use cases

**News Article Images Loading Fix (2025-11-15):**
- **Scope**: Applied identical Graph API redirect fix to News module markdown content fetching
- **Issue Identified**: News articles with embedded images failed to load due to same cURL redirect handling issue
- **Implementation**: Updated News.php getArticle() method with identical cURL enhancements (CURLOPT_FOLLOWLOCATION, redirect diagnostics)
- **Frontend Enhancement**: Created custom MarkdownImage React component for ReactMarkdown to resolve relative image references
- **URL Resolution**: Implemented automatic mapping of markdown image references (e.g., `![alt](uvodni-foto.jpg)`) to article image IDs with proper proxy URLs
- **Article Structure**: News articles stored as SharePoint folders containing markdown files and associated images
- **Image Reference Handling**: Frontend now correctly resolves `filename.jpg` references to full proxy URLs via gallery endpoint routing
- **Cross-Module Integration**: Gallery endpoint handles image serving for both gallery thumbnails and news article images
- **Unicode Support**: Maintained proper UTF-8 encoding for Czech characters in article content and image filenames

**Boats Page Implementation (2025-11-17):**
- **New Component**: Created `Boats.jsx` component for displaying boat specifications from `public/boats.md`
- **Table Support**: Fixed markdown table rendering by adding `remark-gfm` plugin to ReactMarkdown components
- **Navigation Enhancement**: Added "Naše lodě" button to header navigation after "Novinky"
- **Routing Integration**: Implemented `/nase-lode` route in React Router configuration
- **Content Updates**: Fixed boat specification tables in `boats.md` to use proper GitHub Flavored Markdown syntax
- **Typography Fix**: Corrected Unicode superscript characters (m³, m²) instead of problematic `$$` syntax
- **Consistency**: Applied same theme styling and markdown processing across all components

**Boats Page UI Enhancement (2025-11-17):**
- **Centered Tables**: Implemented custom ReactMarkdown components to center specification tables on screen
- **Thumbnail Images**: Added thumbnail rendering for boat images with unified 250x200px dimensions using object-fit contain for complete image visibility
- **Full-Screen Modal**: Created click-to-expand functionality opening full-size images in modal dialogs
- **Modal Design**: Applied same modal pattern as Gallery component with black background, close button, and loading states
- **User Experience**: Images now display as clickable thumbnails that expand to fill screen without scrolling
- **Responsive Design**: Modal dialogs work across all screen sizes with proper image containment
- **2-Column Layout**: Implemented responsive CSS Grid layout (single column mobile, two columns tablet+) for side-by-side boat comparison
- **Content Organization**: Split boat content into separate markdown files (boats-chilli.md, boats-cuba.md) with centered H2 titles matching the main page H1 hierarchy
- **Source Attribution**: Converted inline source links to proper bullet point lists for better readability

**Brand Identity Integration (2025-11-12):**
- **Complete Theme Overhaul**: Migrated from basic MUI to custom theme with VŠTJ brand colors and Outfit fonts
- **PDF-Driven Design**: All colors and fonts extracted from VSTJ_navrh_pokus.pdf brand guidelines
- **Header Redesign**: PDF-inspired layout with logo left, navigation right, hero background
- **Component Architecture**: Created reusable NavButton component, theme-aware styling throughout
- **Typography System**: Outfit Light (300) for body, Outfit Medium (500) for headings
- **Color Palette**: Primary (#6396C1), Navy (#1F2646), Error (#8F271E), Secondary (#BF7D56), Olive (#6B6948)

## Future Development Considerations
- **Navigation Expansion**: Complete commented-out sections ("Novinky", "Naše lodě", "Přihláška do oddílu")
- **Routing System**: Implemented client-side routing with React Router for multi-page sections
- **Content Management**: Expand markdown-based system, add more content sections
- **Authentication UX**: Login/logout buttons, better error handling, user session management
- **Mobile Optimization**: Responsive header layout with vertical navbar stacking, touch-friendly navigation, responsive gallery with consistent aspect ratios
- **Performance**: AES-256 encrypted token caching, gallery data caching, optimized image loading
- **PWA Features**: Offline capabilities, service workers, app manifest
- **Additional Sections**: News/blog functionality, contact forms, member registration

## Security Notes
- Environment variables properly configured
- .env file gitignored
- MSAL handles token storage securely
- SharePoint permissions appropriately scoped
- No sensitive data in client-side code
- AES-256 encrypted server-side token caching
- Restricted file permissions (0600) on cache files
- OAuth 2.0 compliant token management with automatic expiration

## Deployment Notes
- Static site deployable to any web server
- Requires Azure AD app registration
- SharePoint site permissions needed
- Environment variables must be configured in deployment

---

*Last Updated: 2025-11-17*
*Recent Gallery Enhancement: 2025-11-12*
*Recent Theme Implementation: 2025-11-12*
*Recent PHP Proxy Implementation: 2025-11-13*
*Recent Performance Optimization: 2025-11-15*
*Recent Responsive Layout Update: 2025-11-15*
*Recent Infinite Scrolling Gallery: 2025-11-15*
*Recent Year-Based Gallery Browsing: 2025-11-15*
*Recent Gallery Image Loading Fix: 2025-11-15*
*Recent News Article Images Loading Fix: 2025-11-15*
*Recent Boats Page Implementation: 2025-11-17*
*Recent Boats Page UI Enhancement: 2025-11-17*
*Recent Boats Layout Refinement: 2025-11-17*
*Analyzed by: Roo (Code & Architect Modes)*

## Workflow Rules for Session Management
**Memory Bank Protocol:**
- **Session Start**: Always read `.roo/memory-bank.md` at the beginning of each new session
- **Change Tracking**: Update memory bank immediately after completing tasks when user confirms satisfaction
- **Documentation Updates**: Include technology changes, new features, bug fixes, and architectural decisions
- **Date Tracking**: Maintain accurate timestamps for all major updates