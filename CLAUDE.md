# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev      # Start development server at localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint linting
```

## Architecture Overview

This is a **BELO OSAKA Salon Questionnaire System** - a digital questionnaire collection and analysis platform for beauty salons.

### Technology Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **OCR**: Google Cloud Vision API
- **Authentication**: Custom cookie-based sessions
- **Charts**: Recharts library

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (QuestionnaireForm, OCREditor, OCRUpload)
- `src/lib/` - Utilities (supabase client, validations with Zod)
- `src/types/` - TypeScript definitions

### Database Schema
Three main tables in Supabase:
- `questionnaire_responses` - Customer questionnaire data
- `ocr_images` - OCR processed images linked to responses
- `admin_users` - Admin authentication

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_app_url
```

### Application Flow
1. **Customer Flow**: Access questionnaire via QR code → Fill step-by-step form → Submit to database
2. **Admin Flow**: Login → View dashboard with analytics → Process OCR images → Export data

### OCR Functionality
The system includes OCR processing for paper questionnaires:
- Upload paper questionnaire images
- Extract text using Google Cloud Vision API
- Edit extracted text in OCREditor component
- Link processed data to customer responses

### Form Validation
Uses React Hook Form with Zod schemas for type-safe form validation. All validation schemas are in `src/lib/validations.ts`.

### Styling Approach
Uses Tailwind CSS with custom configuration. Mobile-first responsive design with step-by-step form navigation.

## Testing
No testing framework is currently configured. Consider adding Jest or Vitest for unit tests.

## Deployment
Configured for Vercel deployment. Environment variables must be set in Vercel dashboard.