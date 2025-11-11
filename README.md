# SheetGPT Assistant

The SheetGPT chatbot lives inside the `webapp/` directory. It searches your Google Sheet for answers and relies on OpenRouter when the sheet has no relevant content.

## Structure

```
webapp/
  src/app/…        # Next.js app router implementation
  src/lib/…        # Google Sheets + OpenRouter helpers
  .env.local.example
  README.md        # Detailed setup guide
```

Run all commands from `webapp/` unless stated otherwise.
