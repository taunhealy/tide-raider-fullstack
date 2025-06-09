# Portfolio Project with Next.js

A modern, responsive portfolio website built with Next.js, featuring dynamic content management and interactive UI components.

## Features

Session Logging: Record your surf sessions with details like location, date, conditions, and personal rating
Image Uploads: Share photos from your surf sessions with blur loading for a smooth experience
Global Beach Database: Access thousands of surf spots worldwide with detailed information
Surf Forecasts: View real-time surf conditions and forecasts for beaches
Interactive Maps: Explore beaches through an interactive map interface
Social Features: Comment on sessions, follow other surfers, and share experiences
Private Sessions: Keep personal sessions private or share them with the community
Responsive Design: Optimized for all devices from mobile to desktop
Alerts System: Get notified about optimal surf conditions at your favorite spots
Rating System: Rate your sessions and discover top-rated spots from the community

## Tech Stack

Frontend: Next.js 14, React, TypeScript
Styling: Tailwind CSS with custom design system
State Management: React Query for server state, React Context for app state
Authentication: NextAuth.js with email/password and social login options
Database: PostgreSQL with Prisma ORM
Image Handling: Next.js Image component with blur placeholders and Cloudflare CDN
Deployment: Vercel with optimized edge functions
APIs: RESTful API endpoints for all data operations
Forecasting: Integration with multiple surf forecast data providers

## User Experience

Personalized Dashboard: View your sessions, favorite beaches, and personalized recommendations
Session Cards: Visual representation of surf sessions with elegant loading states
Filtering System: Find sessions by location, rating, date, and more
Beach Details: Comprehensive information about each surf spot including wave type and local conditions
Community Insights: Learn from other surfers' experiences at the same locations
Subscription Tiers: Free access with premium features for subscribers

## Development Features

TypeScript: Fully typed codebase for better developer experience
Component Library: Custom UI components with consistent styling
API Integration: Seamless integration with weather and surf forecast APIs
Performance Optimization: Image optimization, code splitting, and lazy loading
Responsive Design System: Mobile-first approach with adaptive layouts
Authentication Flow: Secure user authentication and authorization

## Architecture

Next.js/Prisma handles:
User interactions
Real-time updates
Simple CRUD operations
Client-side caching

Azure .NET handles:
Alert processing engine
Forecast comparison logic
Notification dispatch
Background jobs
Reliable CRON scheduling
Complex data processing
Better error handling
Monitoring and logging
Retries and fault tolerance