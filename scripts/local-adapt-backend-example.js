/**
 * Example backend implementation for GET /recipes/local-adapt
 *
 * Purpose:
 * - Use the fine-tuned model directly for local adaptation suggestions
 * - Always return structured JSON:
 *   { adaptations: [{ original, substitute, reason }] }
 *
 * Replace:
 * - callOllama(...)
 * - route wiring according to your backend framework
 */

function normalizeIngredientName(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\bsuch as\b.*$/i, ' ')
    .replace(/\bfor serving\b.*$/i, ' ')
    .replace(/\bcut into\b.*$/i, ' ')
    .replace(/\bfinely chopped\b.*$/i, ' ')
    .replace(/\bchopped\b.*$/i, ' ')
    .replace(/\bminced\b.*$/i, ' ')
    .replace(/\bcrushed\b.*$/i, ' ')
    .replace(/\bgrated\b.*$/i, ' ')
    .replace(/\bpeeled\b.*$/i, ' ')
    .replace(/\bseeded\b.*$/i, ' ')
    .replace(/\bskin removed\b.*$/i, ' ')
    .replace(/\bdivided\b.*$/i, ' ')
    .replace(/\bfreshly\b/g, ' ')
    .split(',')[0]
    .split(/\s+or\s+/)[0]
    .replace(/\s+/g, ' ')
    .trim();
}

function parseIngredientQuery(rawIngredients) {
  if (Array.isArray(rawIngredients)) {
    return rawIngredients.map(normalizeIngredientName).filter(Boolean);
  }

  if (typeof rawIngredients === 'string') {
    return rawIngredients
      .split(',')
      .map(normalizeIngredientName)
      .filter(Boolean);
  }

  return [];
}

function dedupeAdaptations(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.original}::${item.substitute}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function coerceAdaptation(item) {
  if (!item) return null;

  const original = String(
    item.original || item.ingredient || item.from || ''
  ).trim();
  const substitute = String(
    item.substitute || item.replacement || item.to || item.local || item.suggested || ''
  ).trim();
  const reason = String(item.reason || item.why || '').trim();

  if (!original || !substitute) return null;

  return { original, substitute, reason };
}

function extractJsonObject(text = '') {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response did not contain JSON object');
  }
  return JSON.parse(text.slice(start, end + 1));
}

function buildLocalAdaptPrompt({ dishName, ingredients }) {
  return [
    'You are FlavorMind, an AI culinary assistant for Sri Lanka.',
    'Task: LOCAL_ADAPT',
    'Return valid JSON only.',
    'For each input ingredient, suggest a Sri Lankan-available substitute when appropriate.',
    'Do not invent substitutions when none make culinary sense.',
    'Output format:',
    '{',
    '  "adaptations": [',
    '    {',
    '      "original": "ingredient name",',
    '      "substitute": "Sri Lankan substitute",',
    '      "reason": "short explanation"',
    '    }',
    '  ]',
    '}',
    `Dish: ${dishName || 'Unknown dish'}`,
    `Ingredients: ${ingredients.join(', ')}`,
  ].join('\n');
}

async function generateAdaptationsWithModel({ model, dishName, ingredients, callOllama }) {
  const prompt = buildLocalAdaptPrompt({ dishName, ingredients });

  const raw = await callOllama({
    model,
    prompt,
    temperature: 0.2,
    maxTokens: 300,
  });

  const parsed = extractJsonObject(raw);
  const adaptations = Array.isArray(parsed.adaptations)
    ? parsed.adaptations.map(coerceAdaptation).filter(Boolean)
    : [];

  return dedupeAdaptations(adaptations);
}

async function getLocalAdaptHandler(req, res) {
  try {
    const dishName = String(req.query.dishName || '').trim();
    const ingredients = parseIngredientQuery(req.query.ingredients);

    if (!ingredients.length) {
      return res.status(400).json({
        success: false,
        message: 'ingredients query is required',
        data: { adaptations: [] },
        timestamp: new Date().toISOString(),
      });
    }

    const aiAdaptations = await generateAdaptationsWithModel({
      model: process.env.OLLAMA_MODEL || 'flavormind_f16',
      dishName,
      ingredients,
      callOllama,
    });

    return res.json({
      success: true,
      message: aiAdaptations.length > 0 ? 'Success' : 'No adaptations found',
      data: { adaptations: aiAdaptations },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('local-adapt error:', error);
    return res.status(500).json({
      success: false,
      message: 'Local adaptation generation failed',
      data: { adaptations: [] },
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = {
  normalizeIngredientName,
  parseIngredientQuery,
  buildLocalAdaptPrompt,
  generateAdaptationsWithModel,
  getLocalAdaptHandler,
};
