import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화 (서버 사이드에서만 실행)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, action } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not set in environment variables');
      return NextResponse.json(
        { 
          error: 'OpenAI API key is not configured',
          hint: 'Please create .env.local file with OPENAI_API_KEY=your-key and restart the server'
        },
        { status: 500 }
      );
    }

    console.log('OpenAI API Key configured:', process.env.OPENAI_API_KEY.substring(0, 7) + '...');

    // action에 따라 다른 프롬프트 사용
    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'analyze') {
      systemPrompt = `You are an expert mathematics problem analyzer. You MUST respond with valid JSON only.

Available categories (choose the most specific match):
- Level 1: Algebra, Geometry, Analysis, Number Theory, Combinatorics & Discrete Mathematics, Probability & Statistics, Optimization Theory, Numerical Analysis, Cryptography, Game Theory
- Level 2 (Algebra): Elementary Algebra, Linear Algebra, Abstract Algebra
- Level 2 (Geometry): Euclidean Geometry, Analytic Geometry, Differential Geometry, Topology
- Level 2 (Analysis): Calculus, Complex Analysis, Real Analysis, Differential Equations
- Level 2 (Number Theory): Elementary Number Theory, Analytic Number Theory
- Level 3 (Elementary Algebra): Polynomials, Equations and Inequalities, Factorization, Exponents and Logarithms
- Level 3 (Calculus): Limits and Continuity, Differentiation, Integration, Series
- And more...

Extract from the image:
1. Problem statement text with KaTeX syntax
2. Diagrams/graphs
3. Solution if present
4. Difficulty (1-10): 1-3=Easy, 4-6=Medium, 7-9=Hard, 10=Olympic
5. Category hierarchy (be specific)

CRITICAL: Respond ONLY with valid JSON:
{
  "title": "Brief descriptive title (5-10 words)",
  "content": "Full problem with KaTeX: \\\\( inline \\\\) or \\\\[ display \\\\]",
  "solution": "Solution with KaTeX or empty string",
  "difficulty": 5,
  "categoryLevel1": "Algebra",
  "categoryLevel2": "Elementary Algebra",
  "categoryLevel3": "Polynomials",
  "categoryConfidence": 0.9,
  "hasDiagrams": true|false,
  "diagramDescription": "Description",
  "concepts": ["concept1", "concept2"]
}`;

      userPrompt = 'Analyze this math problem. Identify the most specific category from the hierarchy. Respond with ONLY valid JSON.';
    } else if (action === 'generate-related') {
      systemPrompt = `You are an expert mathematics problem generator. Based on the given problem, create related problems that focus on the underlying mathematical concepts.

Respond in JSON format with:
{
  "relatedProblems": [
    {
      "title": "Problem title",
      "content": "Problem with KaTeX formulas",
      "solution": "Solution with KaTeX formulas",
      "difficulty": 1-10,
      "category": "Category",
      "concept": "Core concept this problem teaches"
    }
  ]
}`;

      userPrompt = 'Generate 2-3 related problems that teach the fundamental concepts needed to solve this problem.';
    }

    // OpenAI Vision API 호출
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4 Vision model
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" }, // Force JSON response
    });

    const aiResponse = response.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    console.log('Raw AI Response:', aiResponse);

    // JSON 파싱
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      // JSON 파싱 실패 시 텍스트 응답 반환
      console.error('JSON Parse Error:', e);
      console.error('Failed to parse:', aiResponse);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI response as JSON. The AI may have returned text instead of JSON.',
        rawResponse: aiResponse,
        hint: 'This usually happens if the model did not use json_object mode. Check if you are using a compatible model.',
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
        error: error.message || 'Failed to analyze problem',
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}

