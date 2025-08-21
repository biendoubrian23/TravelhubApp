# Instructions Copilot pour TravelHub

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Context
This is a React Native Expo application for bus booking in Cameroon, inspired by SNCF Connect design.

## Architecture Guidelines
- Use functional components with React hooks
- Follow the folder structure specified: src/screens, src/components, src/services, etc.
- Use Supabase for authentication and database operations
- Implement clean, mobile-first design with professional appearance
- Use FCFA currency format for all prices
- Support French language primarily

## Key Features
- User authentication (email/password and Google OAuth via Supabase)
- Trip search (departure/arrival cities in Cameroon)
- Results display with classic and VIP bus options
- Seat selection with dynamic bus layouts
- Payment integration (Stripe and Orange Money)
- Agency dashboard for trip management
- User profile and booking history

## Design Principles
- Clean, professional interface inspired by SNCF Connect
- Mobile-first responsive design
- Smooth navigation between screens
- Clear visual hierarchy
- Accessibility considerations

## Technical Stack
- React Native with Expo
- Supabase for backend services
- React Navigation for routing
- Stripe for payments
- Context API or Zustand for state management
