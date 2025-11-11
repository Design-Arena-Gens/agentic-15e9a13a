## SheetGPT Assistant

SheetGPT is a Next.js chatbot that pulls answers from a Google Sheet knowledge base and falls back to OpenRouter when the sheet has no relevant information.

### Prerequisites

- Node.js 18+
- A Google Cloud service account with access to the Sheets API
- An OpenRouter API key
- The ID of the Google Sheet that stores your knowledge base

### Environment Variables

Create `.env.local` based on `.env.local.example`:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_SHEET_ID=
OPENROUTER_API_KEY=
```

> **Note:** Replace literal `\n` sequences in the private key with actual new lines or keep the provided transform in `env.ts`.

### Running Locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and start chatting. The UI labels responses with their source (Google Sheet or OpenRouter).

### Deployment

The project is optimized for Vercel. Make sure the environment variables above are configured in your Vercel project before deploying.
