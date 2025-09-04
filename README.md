# Zygreen - Edutech Platform

Zygreen is an educational technology platform that provides online courses and learning resources. This is the frontend application built with React, TypeScript, and Firebase.

## Features

- User authentication (Sign up, Login, Password reset)
- Role-based access control (Admin, Student)
- Course management (coming soon)
- Responsive design with Chakra UI

## Tech Stack

- React 18 with TypeScript
- Firebase Authentication
- Firebase Firestore
- React Router v6
- Chakra UI
- Vite

## Prerequisites

- Node.js 16+
- npm or yarn
- Firebase project with Authentication and Firestore enabled

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/zygreen.git
   cd zygreen
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in browser**
   The app should be running at `http://localhost:5173`

## Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Email/Password authentication in the Authentication section
4. Set up Firestore database in test mode for development
5. Get your Firebase configuration from Project Settings > General > Your apps > Web app

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React contexts (auth, theme, etc.)
├── pages/           # Page components
│   ├── auth/        # Authentication pages
│   └── Dashboard.tsx
├── services/        # API and service integrations
├── theme/           # Theme configuration
└── utils/           # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
