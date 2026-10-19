const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are an expert project planning assistant.
Given a task description from the user, generate a practical, actionable plan.

Respond ONLY with a valid JSON object using exactly this structure:
{
  "summary": "one concise sentence summarizing the task",
  "priority": "low" | "medium" | "high",
  "estimatedHours": <positive number>,
  "steps": ["actionable step 1", "actionable step 2", "..."]
}

Rules:
- "priority" must be exactly one of: low, medium, high.
- "estimatedHours" must be a positive number.
- "steps" must contain 3 to 7 clear, concrete, actionable steps.
- Do NOT include any text, markdown fences, or explanations outside the JSON object.`;

// @desc    Generate an AI task plan from a description
// @route   POST /api/ai/plan-task
const planTask = async (req, res, next) => {
  try {
    const { description } = req.body;

    // 1. Validate input
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A non-empty task description is required',
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      return res.status(500).json({
        success: false,
        message: 'AI API key is not configured on the server',
      });
    }

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    // 2. Call Groq AI API
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description.trim() },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return res.status(502).json({
        success: false,
        message: 'Failed to get a response from the AI provider',
      });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({
        success: false,
        message: 'AI returned an empty response',
      });
    }

    // 3. Parse the AI response
    let plan;
    try {
      plan = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return res.status(502).json({
        success: false,
        message: 'AI returned an invalid response format',
      });
    }

    // 4. Validate the plan structure
    if (!plan.summary || typeof plan.summary !== 'string') {
      return res.status(502).json({
        success: false,
        message: 'AI response is missing a valid summary',
      });
    }

    if (!['low', 'medium', 'high'].includes(plan.priority)) {
      return res.status(502).json({
        success: false,
        message: 'AI response contains an invalid priority value',
      });
    }

    if (typeof plan.estimatedHours !== 'number' || plan.estimatedHours <= 0) {
      return res.status(502).json({
        success: false,
        message: 'AI response contains an invalid estimatedHours value',
      });
    }

    if (!Array.isArray(plan.steps) || plan.steps.length === 0) {
      return res.status(502).json({
        success: false,
        message: 'AI response must include a list of actionable steps',
      });
    }

    // 5. Return structured response
    return res.status(200).json({
      success: true,
      plan: {
        summary: plan.summary,
        priority: plan.priority,
        estimatedHours: plan.estimatedHours,
        steps: plan.steps,
      },
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        message: 'AI request timed out. Please try again.',
      });
    }
    return next(error);
  }
};

module.exports = { planTask };
