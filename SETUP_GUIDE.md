# MathComm Setup Guide - OpenAI Integration

## Prerequisites

1. Node.js 18+ installed
2. OpenAI API account and API key

## Installation Steps

### 1. Install OpenAI SDK

```bash
npm install openai
```

### 2. Configure OpenAI API Key

Create a `.env.local` file in the project root:

```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

**Important:** Never commit `.env.local` to version control!

### 3. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it into `.env.local`

### 4. Verify Installation

Run the development server:

```bash
npm run dev
```

Navigate to `/admin/problems` and test the AI features:
- Upload File (AI) - Analyze problem from image/PDF
- Generate with AI - Create solution from problem content
- Generate Related Problems with AI - Create foundational problems

## AI Features Overview

### 1. Problem Analysis (Upload File)
- **Model:** GPT-4 Vision (gpt-4o)
- **Function:** Extracts text, math formulas (KaTeX), and detects diagrams from images/PDFs
- **Endpoint:** `/api/analyze-problem`

### 2. Solution Generation
- **Model:** GPT-4 (gpt-4o)
- **Function:** Generates step-by-step solution with KaTeX formulas
- **Endpoint:** `/api/generate-solution`

### 3. Related Problems Generation
- **Model:** GPT-4 (gpt-4o)
- **Function:** Identifies core concepts and creates 2-3 foundational problems
- **Endpoint:** `/api/generate-related-problems`

## Security Best Practices

✅ **DO:**
- Store API keys in `.env.local` (server-side only)
- Use Next.js API routes to proxy OpenAI calls
- Add rate limiting for production
- Monitor API usage on OpenAI dashboard

❌ **DON'T:**
- Expose API keys in client-side code
- Commit `.env.local` to git
- Use API keys directly in frontend

## Cost Management

OpenAI API pricing (as of 2024):
- GPT-4 Vision: ~$0.01-0.03 per image analysis
- GPT-4: ~$0.03 per 1K input tokens, $0.06 per 1K output tokens

**Tips:**
- Set usage limits in OpenAI dashboard
- Use `max_tokens` parameter to control costs
- Implement caching for repeated analyses

## Troubleshooting

### Error: "OpenAI API key is not configured"
- Check that `.env.local` exists in project root
- Verify the key starts with `sk-`
- Restart the development server after adding the key

### Error: "Failed to analyze problem"
- Check your OpenAI API key is valid
- Verify you have credits in your OpenAI account
- Check console for detailed error messages

### Slow Response Times
- GPT-4 Vision can take 5-15 seconds to analyze images
- Consider adding loading indicators
- Reduce `max_tokens` if responses are too long

## Production Deployment

For production on Netlify:

1. Add environment variable in Netlify dashboard:
   - Go to Site settings > Environment variables
   - Add `OPENAI_API_KEY` with your key

2. Redeploy the site for changes to take effect

## Support

For issues related to:
- **OpenAI API:** [OpenAI Help Center](https://help.openai.com/)
- **Next.js:** [Next.js Documentation](https://nextjs.org/docs)
- **Project-specific:** Create an issue in the repository

