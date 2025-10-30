import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { problemContent, category } = await request.json();

    if (!problemContent) {
      return NextResponse.json(
        { error: 'Problem content is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert mathematics teacher. Generate a detailed solution for the given math problem.
- Use KaTeX syntax for all mathematical formulas (e.g., \\( x^2 \\) for inline, \\[ ... \\] for display)
- Provide step-by-step explanation
- Show all intermediate steps
- Explain the reasoning behind each step
${category ? `- This is a ${category} problem` : ''}

Format your response with clear steps and KaTeX formulas.`,
        },
        {
          role: 'user',
          content: `Problem:\n${problemContent}\n\nPlease provide a detailed solution.`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.5,
    });

    const solution = response.choices[0]?.message?.content;

    if (!solution) {
      return NextResponse.json(
        { error: 'No solution generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      solution,
    });

  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate solution',
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}

