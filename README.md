# Draftmons Frontend

A modern React frontend application for Draftmons, a Pokemon draft league management system. Built with Next.js 14, TypeScript, Material UI, and Redux Toolkit.

## 🚀 Features

### Core Functionality
- **Google OAuth Authentication**: Secure authentication via Express.js backend with session cookies
- **League Management**: Browse and select from multiple leagues
- **Pokemon Database**: View and manage Pokemon with detailed stats
- **Team Management**: Tools for managing draft teams and matchups
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Technical Features
- **Type-Safe**: Full TypeScript implementation
- **State Management**: Redux Toolkit for predictable state updates
- **Modern UI**: Material UI components with Tailwind CSS utilities
- **Dark Mode**: Built-in theme switching with persistent preferences
- **Protected Routes**: Secure route handling with automatic redirects
- **Session Management**: HTTPOnly cookies with automatic logout on expiration

## 📋 Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Running instance of draftmons-backend (Express.js backend)
- Google OAuth credentials configured in backend

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd draftmons-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will be available at `http://localhost:3333`

## 🏗️ Project Structure

```
draftmons-frontend/
├── public/                 # Static assets
│   └── assets/
│       └── images/        # Image resources
├── src/
│   ├── app/               # Next.js 14 app directory
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Landing page
│   │   ├── home/          # Home page
│   │   ├── leagues/       # League pages
│   │   └── pokemon/       # Pokemon pages
│   ├── components/        # Reusable components
│   │   ├── auth/          # Authentication components
│   │   ├── layout/        # Layout components (Header, Sidebar)
│   │   ├── tables/        # Data table components
│   │   └── common/        # Common UI components
│   ├── contexts/          # React contexts
│   │   └── ColorModeContext.tsx
│   ├── services/          # API services
│   │   ├── api/           # Service modules
│   │   └── http.service.ts
│   ├── store/             # Redux store
│   │   ├── slices/        # Redux slices
│   │   └── hooks.ts       # Typed hooks
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions and constants
├── .env.local             # Local environment variables
├── .gitignore             # Git ignore rules
├── next.config.js         # Next.js configuration
├── package.json           # Dependencies and scripts
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## 🔧 Available Scripts

### Development
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Production Build
```bash
npm run build
npm run start
```

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Required |

## 📱 Pages and Routes

### Public Routes
- `/` - Landing page with Google sign-in

### Protected Routes
- `/home` - User dashboard
- `/leagues` - List of all leagues
- `/leagues/[id]` - League details
- `/leagues/[id]/team-matchup` - Team matchup tools
- `/leagues/[id]/tiers/classic` - Classic tier list
- `/leagues/[id]/tiers/type` - Type-based tier list
- `/leagues/[id]/rank/team` - Team rankings
- `/leagues/[id]/rank/pokemon` - Pokemon rankings
- `/leagues/[id]/tools/*` - Various league tools
- `/leagues/[id]/admin/*` - Admin functions
- `/leagues/[id]/team-settings` - Team settings
- `/pokemon` - Pokemon database
- `/pokemon/[id]` - Pokemon details

## 🔐 Authentication Flow

1. User clicks "Sign in with Google" on landing page
2. Browser redirects to backend `/api/auth/google`
3. Backend handles Google OAuth flow
4. Backend sets HTTPOnly session cookie
5. Backend redirects back to frontend
6. Frontend calls `/api/auth/status` to get user info
7. User info stored in Redux (no tokens stored client-side)
8. All API calls include credentials automatically

## 🎨 Theming

The application supports light and dark modes:

- Toggle between themes using the switch in the header
- Theme preference is stored in browser
- Uses Material UI's theme system
- Consistent styling across all components

## 🔄 State Management

### Redux Slices

1. **authSlice**
   - Manages authentication state
   - Handles login/logout flows
   - Stores user profile (non-sensitive data only)

2. **currentLeagueSlice**
   - Stores currently selected league
   - Available globally for league-specific operations

## 🚢 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
Create `.env.production` with production values:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=production-client-id
```

### Deployment Options
- **Vercel** (Recommended): Push to GitHub and connect to Vercel
- **Docker**: Use the provided Dockerfile (if available)
- **Traditional hosting**: Upload build output from `.next` directory

## 🐛 Troubleshooting

### Common Issues

1. **Authentication fails**
   - Verify backend is running
   - Check Google OAuth credentials
   - Ensure cookies are enabled

2. **API calls fail**
   - Confirm `NEXT_PUBLIC_API_URL` is correct
   - Check backend CORS settings
   - Verify session cookies are being sent

3. **Styles not loading**
   - Clear browser cache
   - Rebuild the application
   - Check for console errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Material UI](https://mui.com/) - Component library
- [Redux Toolkit](https://redux-toolkit.js.org/) - State management
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository or contact the development team.

---

**Version**: 0.1.0  
**Last Updated**: September 2025  
**Status**: Active Development