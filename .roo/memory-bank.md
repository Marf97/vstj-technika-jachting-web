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
- **Build Tools**: ESLint, TypeScript types

## Project Structure
```
src/
├── assets/               # Static content files
│   ├── onas.md          # About us content (Czech)
│   ├── vedeni.md        # Leadership/board contact info (Czech)
│   └── react.svg        # Unused React logo
├── components/          # React components
│   ├── Header.jsx       # Navigation bar with commented-out sections
│   ├── Footer.jsx       # Simple copyright footer
│   └── Gallery.tsx      # Dynamic image gallery from SharePoint
├── lib/                 # Utilities
│   ├── auth.ts          # Azure AD authentication setup
│   └── graph.ts         # Microsoft Graph API utilities
├── App.jsx              # Main app component with markdown content loading
├── App.css              # Component-specific styles
├── index.css            # Global styles
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
- Header with navigation (some buttons commented out)
- Hero section with background image
- Content sections: "O nás", "VŠTJ", "Jachting", "Kontakt", "Galerie"
- Footer with copyright

**Content Status:**
- **Real content from markdown files**: "O nás" section displays onas.md, "Kontakt" section displays vedeni.md
- Gallery component with enhanced UI: MUI ImageList masonry layout, clickable images opening in modal dialogs
- Gallery features: thumbnail images, full-size modal viewer with close button, responsive design
- Navigation incomplete (commented-out sections for "Novinky", "Naše lodě", etc.)
- **Content management**: Markdown-based content loading with react-markdown for proper rendering

**Known Issues/Areas for Development:**
- Incomplete content sections
- Commented-out navigation items
- No routing system (single-page app)
- Gallery loading states and error handling (partially improved but could use more polish)
- Authentication UX could be improved
- No internationalization/localization setup
- MSAL initialization error was fixed (removed useMemo that was calling getAllAccounts before initialization)

## Development Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint
- `npm run preview`: Preview production build

## Code Patterns & Conventions
- **Components**: Functional components with hooks, modal dialogs for image viewing
- **Styling**: MUI components (ImageList, Dialog, Typography), sx prop for inline styles, separate CSS files
- **Authentication**: Custom hooks in auth.ts, token provider pattern, proper MSAL initialization
- **API**: Async/await with error handling, fetch-based Graph calls
- **Types**: TypeScript for utilities, JSX for components
- **UI Patterns**: Masonry image layouts, modal dialogs with close buttons, responsive design
- **Naming**: Czech comments, English technical terms

## Future Development Considerations
- Implement routing for multi-page sections
- Complete navigation menu
- Add proper content management
- Improve authentication UX (login/logout buttons)
- Add image upload functionality
- Implement news/blog section
- Add contact form
- Consider PWA features
- Performance optimization for image loading

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
*Analyzed by: Roo (Architect Mode)*