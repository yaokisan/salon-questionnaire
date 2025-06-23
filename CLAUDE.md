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
- **OCR**: Google Cloud Vision API with advanced parsing logic
- **Authentication**: Custom cookie-based sessions
- **Charts**: Recharts library for analytics dashboard

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (QuestionnaireForm, OCREditor)
- `src/lib/` - Utilities (supabase client, validations with Zod)
- `src/types/` - TypeScript definitions
- `refference/` - Sample images and reference materials

### Database Schema
Three main tables in Supabase:
- `questionnaire_responses` - Customer questionnaire data with all form fields
- `ocr_images` - OCR processed images linked to responses
- `admin_users` - Admin authentication (RLS disabled for login functionality)

### Environment Variables Required
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=your_app_url
```

### Test Admin Credentials
```bash
Email: admin@belo-osaka.com
Password: BeloAdmin2024!
```

### Application Flow
1. **Customer Flow**: Access questionnaire via QR code → Fill 4-step form with auto-features → Submit to database
2. **Admin Flow**: Login → View dashboard with analytics → Process OCR images in OCREditor → Export data

### OCR Functionality (Advanced)
The system includes sophisticated OCR processing for paper questionnaires:

#### OCR Features
- **Upload & Preview**: Side-by-side image preview and form editing interface
- **Advanced Text Extraction**: Google Cloud Vision API with custom parsing logic
- **Layout-Aware Detection**: Position-based field detection using line proximity
- **Pattern Recognition**: Handles OCR misrecognitions (e.g., '口店頭' → Instagram detection)
- **Manual Editing**: Real-time form field editing with OCR suggestions
- **Validation**: Field-specific validation for names, phones, addresses, etc.

#### OCR Parsing Logic (`src/app/api/ocr/route.ts`)
- **Direct Pattern Matching**: Specific text patterns for known forms
- **Field Proximity Detection**: Uses line indexes to match furigana/name pairs
- **Checkbox Detection**: Recognizes various checkbox symbols (☑✓■●□口)
- **Source Type Detection**: Advanced logic for Instagram/referral/store detection
- **Template Exclusion**: Filters out template text to focus on handwritten content

#### Key OCR Functions
- `parseOCRText()`: Main parsing logic with position awareness
- `detectSourceType()`: Specialized checkbox and source detection
- `isValidName/Phone/Address()`: Field validation functions
- Template word filtering and OCR misrecognition handling

### Form Features
#### Auto-completion Features
- **Furigana Generation**: Auto-generates furigana from kanji name input
- **Postal Code Lookup**: Auto-fills address from postal code using zipcloud API
- **Phone Number Formatting**: Auto-formats phone numbers as user types

#### Conditional Logic
- **Scalp Allergy Details**: Shows detail field only when "yes" is selected
- **Source Type Details**: Shows Instagram account field for personal accounts
- **Referral Person**: Shows name field when referral is selected

#### Step-by-Step Navigation
- 4-step form with progress indicator
- Form validation on each step
- Confirmation screen before submission

### Form Validation
Uses React Hook Form with Zod schemas for type-safe validation:
- All schemas in `src/lib/validations.ts`
- Real-time validation with detailed error messages
- Required field enforcement and format validation

### Styling Approach
- Tailwind CSS with gradient backgrounds and modern UI
- Mobile-first responsive design
- Consistent component styling across forms and admin interface
- Loading states and success/error feedback

### Admin Dashboard Features
- **Analytics**: Customer source breakdown with charts (Recharts)
- **Data Export**: Download questionnaire responses as CSV
- **OCR Processing**: Dedicated OCR editor for paper questionnaire digitization
- **Response Management**: View and filter customer responses

### Known OCR Challenges
- **Checkbox Recognition**: Some checkboxes misrecognized as different symbols
- **Template vs Handwriting**: Difficulty distinguishing template text from user input
- **Field Positioning**: Layout-dependent parsing requires position-aware logic
- **Name vs Referral**: Similar text patterns need context-based differentiation

### Recent Improvements
- Enhanced OCR parsing with layout awareness and pattern recognition
- Improved checkbox detection including OCR misrecognitions
- Added specialized handling for known form variations
- Implemented direct pattern matching for specific text cases

## Testing
No testing framework is currently configured. Consider adding Jest or Vitest for unit tests, especially for OCR parsing logic.

## Deployment
Configured for Vercel deployment. Environment variables must be set in Vercel dashboard.

## Troubleshooting
### Common Issues
- **Admin Login 401**: Ensure RLS is disabled on admin_users table
- **OCR Processing**: Check Google Cloud Vision API key configuration
- **Database Errors**: Verify all required columns exist in questionnaire_responses table