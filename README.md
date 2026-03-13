# AI Offer Creator

Generate professional business offers powered by AI. Provide context (emails, documents, notes), select a template, and let the AI fill in each section intelligently using RAG-based retrieval.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Supabase** (PostgreSQL + pgvector)
- **OpenAI** GPT-4o + text-embedding-3-small
- **Tailwind CSS**

## Features

- 3 pre-loaded offer templates (Software Development, Consulting, Marketing)
- Upload context via text paste, PDF, DOCX, or TXT files
- RAG pipeline: documents chunked, embedded, and stored in pgvector
- AI generates each section using the most relevant context chunks
- Edit, regenerate individual sections, and finalize offers

## Setup

1. Clone and install:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

   Required keys:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Supabase Setup

The database tables (templates, offers, context_documents, context_chunks) and the pgvector extension are already created via migrations. Three example templates are seeded.

If you need to re-seed templates, run:
```bash
npm run db:seed
```
