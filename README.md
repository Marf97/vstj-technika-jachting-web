# VŠTJ Technika Jachting Web

A modern React web application for the VŠTJ (University Sports Club) sailing section at Czech Technical University in Prague. This project showcases the club's activities with an elegant, responsive design featuring a dynamic image gallery powered by SharePoint integration.

## 🚀 Project Overview

This is a single-page React application built with modern web technologies, featuring custom theming based on the club's brand guidelines. The application integrates with Azure AD and Microsoft Graph API to display images from a SharePoint document library.

## 🎨 Key Features

- **Responsive Design**: Mobile-first approach with adaptive layouts for all screen sizes
- **Custom Theme**: Brand-specific colors and Outfit typography extracted from design guidelines
- **Dynamic Gallery**: SharePoint-integrated image gallery with full-resolution viewing
- **Azure AD Authentication**: Secure authentication flow for accessing protected resources
- **Progressive Enhancement**: Graceful fallbacks and loading states throughout the application

## 🛠️ Tech Stack

- **Frontend Framework**: React 18.3.1 with Vite build tool
- **UI Library**: Material-UI (MUI) v7.3.5 with custom theme
- **Authentication**: Azure AD via Microsoft Authentication Library (MSAL)
- **API Integration**: Microsoft Graph API for SharePoint access
- **Content Rendering**: React Markdown for dynamic content
- **Styling**: Emotion CSS-in-JS with custom MUI theme
- **Development**: ESLint, TypeScript types, Hot Module Replacement

## 📁 Project Structure

```
src/
├── assets/               # Static content files
│   ├── Font_outfit/     # Outfit font files
│   ├── logo/            # Organization logos (SVG & PNG)
│   ├── VSTJ_navrh_pokus.pdf # Brand guidelines
│   ├── onas.md          # About us content (Czech)
│   ├── vedeni.md        # Leadership info (Czech)
│   └── react.svg        # Default React logo
├── components/          # React components
│   ├── Header.jsx       # Responsive header with navigation
│   ├── Footer.jsx       # Copyright footer
│   ├── Gallery.tsx      # SharePoint image gallery
│   └── NavButton.jsx    # Reusable navigation button
├── lib/                 # Utilities and services
│   ├── auth.ts          # Azure AD authentication setup
│   └── graph.ts         # Microsoft Graph API utilities
├── theme.js             # Custom MUI theme configuration
├── App.jsx              # Main application component
├── App.css              # Component styles
├── index.css            # Global styles with font declarations
└── main.jsx             # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Azure AD app registration (for SharePoint integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vstj-technika-jachting-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_AAD_CLIENT_ID=your-azure-ad-client-id
   VITE_AAD_TENANT_ID=your-azure-ad-tenant-id
   VITE_SITE_HOST=your-sharepoint-host.sharepoint.com
   VITE_SITE_PATH=sites/your-site-path
   VITE_FOLDER_PATH=path/to/image/folder
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔧 Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code analysis

## 🔐 Azure AD & SharePoint Setup

### 1. Azure AD Application Registration

1. Go to Azure Portal → Azure Active Directory → App registrations
2. Create a new registration with:
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: `http://localhost:5173` (for development)

3. Configure API permissions:
   - `Sites.Read.All` (Delegated)
   - `Files.Read` (Delegated)

4. Grant admin consent for the permissions

### 2. SharePoint Site Setup

1. Ensure the SharePoint site has the required image folder at the specified path
2. Configure appropriate sharing permissions for the image folder

### 3. Member Area and Reservation Calendar

The private member area uses a separate member login flow and server-side Microsoft Graph access to the SharePoint reservation list.

Configure member roles in `.env.php` or environment-specific overrides:

```env
MEMBER_EMAILS=clen.jachting@technika-praha.cz
MEMBER_ADMIN_EMAILS=admin.jachting@technika-praha.cz,jachting@technika-praha.cz
```

`MEMBER_ALLOWED_EMAIL` is still supported as a backward-compatible fallback when no role-based lists are configured.

Calendar list configuration:

```env
MEMBER_CALENDAR_SITE_HOST=technikapraha.sharepoint.com
MEMBER_CALENDAR_SITE_PATH=sites/jachting
MEMBER_CALENDAR_LIST_ID=your-sharepoint-list-id
MEMBER_CALENDAR_STATE_FIELD=State
```

Reservation states are stored in SharePoint as `Requested`, `Confirmed`, and `Canceled`. The frontend displays Czech labels, hides canceled reservations from basic members, and shows them to admins. Admins can move reservations between `Requested`, `Confirmed`, and `Canceled` from the reservation detail dialog.

The Azure app used by the PHP backend must have Microsoft Graph permissions that allow reading and updating SharePoint list item fields.

## 🎨 Design System

### Brand Colors
- **Primary**: `#6396C1` (Blue)
- **Secondary**: `#BF7D56` (Orange/Brown)
- **Navy**: `#1F2646` (Dark Navy)
- **Error**: `#8F271E` (Red)
- **Olive**: `#6B6948` (Olive Green)

### Typography
- **Font Family**: Outfit (Light 300, Medium 500)
- **Body Text**: Outfit Light (300)
- **Headings**: Outfit Medium (500)

## 📱 Responsive Behavior

- **Mobile (< 600px)**: Single column gallery, stacked navigation
- **Tablet (600px - 900px)**: Two column gallery, horizontal navigation
- **Desktop (> 900px)**: Three/Four column gallery, full navigation

## 🔍 Gallery Features

- **Thumbnail Loading**: Efficient display of image thumbnails from SharePoint
- **Full-Resolution Viewing**: On-demand loading of full-size images in modal dialogs
- **Responsive Modal**: Fullscreen image viewing adapted to screen size
- **Click-to-Close**: Close modal by clicking outside image or X button
- **Loading States**: Visual feedback during image loading

## 🚀 Deployment

The application is built as a static site and can be deployed to any web server supporting static files (Netlify, Vercel, GitHub Pages, etc.).

### Environment Configuration

Ensure all environment variables are configured in your deployment platform.

### Build Optimization

The production build is optimized with:
- Code splitting
- Asset optimization
- Minification
- Tree shaking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary to VŠTJ Technika Jachting.

## 🆘 Support

For questions or issues related to this application, please contact the development team or create an issue in the repository.

---

*Built with ❤️ for VŠTJ sailing enthusiasts*
