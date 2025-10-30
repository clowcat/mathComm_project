import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { problemContent, category, difficulty } = await request.json();

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
          content: `You are an expert mathematics educator. You MUST respond with valid JSON only.

Analyze the problem and:
1. Identify 2-4 core mathematical concepts
2. For each concept, generate 1-2 foundational problems
3. Problems should be easier than the original (lower difficulty)
4. Each problem teaches a specific prerequisite concept

CRITICAL: Respond ONLY with valid JSON in this exact format:
{
  "concepts": ["Concept1", "Concept2"],
  "relatedProblems": [
    {
      "title": "Short problem title",
      "content": "Problem with KaTeX formulas using \\\\( \\\\) or \\\\[ \\\\]",
      "solution": "Step-by-step solution with KaTeX",
      "difficulty": 3,
      "category": "Algebra",
      "concept": "Which concept this teaches",
      "explanation": "Why this is foundational"
    }
  ]
}

Use double backslashes in JSON: \\\\( x^2 \\\\) for inline, \\\\[ ... \\\\] for display.`,
        },
        {
          role: 'user',
          content: `Original Problem (Difficulty: ${difficulty || 5}, Category: ${category || 'Math'}):\n${problemContent}\n\nGenerate 2-4 foundational problems. Respond with ONLY valid JSON.`,
        },
      ],
      max_tokens: 3000,
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const aiResponse = response.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    console.log('Related Problems - Raw AI Response:', aiResponse);

    // JSON 파싱
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Related Problems - JSON Parse Error:', e);
      console.error('Failed to parse:', aiResponse);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI response. Check server console for details.',
        rawResponse: aiResponse,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: parsedResponse,
    });

  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate related problems',
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}

