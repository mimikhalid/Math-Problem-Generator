# MathTutor MY

**Live:** [mathtutor-my.vercel.app](https://mathtutor-my.vercel.app)

## Overview

MathTutor MY is a maths practice app for Malaysian primary school pupils (Tahun 1–6, KSSR syllabus), in Bahasa Melayu or English.

- **Latihan (Practice)**: AI-generated word problems in sets of 5, 10 or 15, as written answers or objective (A–D), with hints, step-by-step working and an end-of-set review.
- **Latih Tubi (Quick Drill)**: timed mental sums sized to each year, with best scores and a round log.
- **Lembaran Kerja (Worksheet)**: printable worksheets with an answer key (print or save as PDF).
- **Sejarah (History)**: practice answers and drill rounds, with accuracy stats.

Problems and submissions are saved to Supabase; questions are generated with Google Gemini, falling back across models when the free-tier quota runs out.

## Tech Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **AI Integration**: Google Generative AI (Gemini)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
```

### 2. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → API to find your:
   - Project URL (starts with `https://`)
   - Anon/Public Key

### 3. Set Up Database Tables

1. In your Supabase dashboard, go to SQL Editor
2. Copy and paste the contents of `database.sql`
3. Click "Run" to create the tables and policies

### 4. Get Google API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini

### 5. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Edit `.env.local` and add your actual keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   GOOGLE_API_KEY=your_actual_google_api_key
   ```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.


## Implementation Notes
### My Implementation:

- Built a simple and easy to use math problem generator in just a couple of days.
- Used AI to create dynamic questions.
- Had some challenges with AI formatting and handling data, but managed to work through them.

### My Supabase Configuration:
   - Project URL (starts with `https://`)
      ```bash
      https://bwqutytmqozpoxzqzyag.supabase.co
      ```
   - Anon/Public Key
      ```bash
      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cXV0eXRtcW96cG94enF6eWFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MDU0MzEsImV4cCI6MjA3NTM4MTQzMX0.QKQrz44wX_CtPKVvwUx97Bb1EevmkYEq2FmLXbFMk7w
      ```
