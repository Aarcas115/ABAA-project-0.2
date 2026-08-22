# OpenRouter Setup Guide

## What is OpenRouter?

OpenRouter provides access to various LLM models through a unified API. This project uses OpenRouter for transcript analysis, specifically the free-tier model `poolside/laguna-xs-2.1:free`.

## Getting an API Key

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Navigate to **API Keys** in your account settings
3. Generate a new API key
4. Copy the key (it will only be shown once)

## Setting Up Locally

1. Copy the example environment file:
   ```bash
   cp app/backend/.env.example app/backend/.env
   ```

2. Paste your API key into `app/backend/.env`:
   ```
   OPENROUTER_API_KEY=your_key_here
   ```

3. The `.env` file is already gitignored, so your key won't be committed.

## Free Tier Limits

⚠️ **Important**: The free tier has a daily limit of **50 requests per day**, shared across all free models and all API keys on your account. Generating a second API key does **not** increase your quota.

## Other Environment Variables

- `OPENROUTER_MODEL` - defaults to `poolside/laguna-xs-2.1:free`
- `OPENROUTER_TIMEOUT` - defaults to `30` seconds

Most contributors won't need to modify these.
