// ============================================================================
// AI PROVIDER ABSTRACTION — Phase X
// Provider-agnostic interface with Gemini 2.5 Flash as default
// Supports: Gemini, OpenAI, Claude, Azure, Local LLM
// ============================================================================

import type { AIProviderName, AIProviderConfig } from '@/types/ai-itinerary'

// ── Provider Interface ───────────────────────────────────────────────────────

export interface AIProvider {
  name: AIProviderName
  model: string
  generateJSON(systemPrompt: string, userPrompt: string, signal?: AbortSignal): Promise<unknown>
}

// Helper to robustly extract JSON from messy AI responses
function parseAIJSON(text: string): any {
  // 1. Clean parse
  try {
    return JSON.parse(text)
  } catch {}

  // 2. Markdown blocks
  const blocks = Array.from(text.matchAll(/```(?:json)?\s*\n?([\s\S]*?)\n?```/g))
  for (const match of blocks) {
    try {
      return JSON.parse(match[1])
    } catch {}
  }

  // 3. Greedy object/array extraction
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0])
    } catch {}
  }

  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try {
      return JSON.parse(arrMatch[0])
    } catch {}
  }

  throw new Error(`Failed to parse AI response as JSON: ${text.substring(0, 200)}...`)
}

// ── Gemini Provider (Default) ────────────────────────────────────────────────

class GeminiProvider implements AIProvider {
  name: AIProviderName = 'gemini'
  model: string
  private apiKey: string

  constructor(config: { model?: string; apiKey: string }) {
    this.model = config.model || 'gemini-3.5-flash'
    this.apiKey = config.apiKey
  }

  async generateJSON(systemPrompt: string, userPrompt: string, signal?: AbortSignal): Promise<unknown> {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(this.apiKey)
    
    const model = genAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    })

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] },
      ],
    })

    // Check for abort
    if (signal?.aborted) {
      throw new DOMException('Generation cancelled', 'AbortError')
    }

    const text = result.response.text()
    return parseAIJSON(text)
  }
}

// ── OpenAI Provider ──────────────────────────────────────────────────────────

class OpenAIProvider implements AIProvider {
  name: AIProviderName = 'openai'
  model: string
  private apiKey: string
  private baseUrl: string

  constructor(config: { model?: string; apiKey: string; baseUrl?: string }) {
    this.model = config.model || 'gpt-4o-mini'
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1'
  }

  async generateJSON(systemPrompt: string, userPrompt: string, signal?: AbortSignal): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 8192,
      }),
      signal,
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI API error ${response.status}: ${err}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('No content in OpenAI response')
    return parseAIJSON(content)
  }
}

// ── Claude Provider ──────────────────────────────────────────────────────────

class ClaudeProvider implements AIProvider {
  name: AIProviderName = 'claude'
  model: string
  private apiKey: string

  constructor(config: { model?: string; apiKey: string }) {
    this.model = config.model || 'claude-sonnet-4-20250514'
    this.apiKey = config.apiKey
  }

  async generateJSON(systemPrompt: string, userPrompt: string, signal?: AbortSignal): Promise<unknown> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt + '\n\nRespond ONLY with the JSON object, no other text.' },
        ],
      }),
      signal,
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Claude API error ${response.status}: ${err}`)
    }

    const data = await response.json()
    const text = data.content?.[0]?.text
    if (!text) throw new Error('No content in Claude response')
    return parseAIJSON(text)
  }
}

// ── Provider Factory ─────────────────────────────────────────────────────────

function createProvider(name: AIProviderName, model?: string): AIProvider | null {
  switch (name) {
    case 'gemini': {
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) return null
      return new GeminiProvider({ model, apiKey })
    }
    case 'openai':
    case 'azure': {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) return null
      return new OpenAIProvider({
        model,
        apiKey,
        baseUrl: name === 'azure' ? process.env.AZURE_OPENAI_ENDPOINT : undefined,
      })
    }
    case 'claude': {
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return null
      return new ClaudeProvider({ model, apiKey })
    }
    default:
      return null
  }
}

// ── Get Provider with Fallback Chain ─────────────────────────────────────────

const DEFAULT_FALLBACK_CHAIN: AIProviderName[] = ['gemini', 'claude', 'openai']

export function getAIProvider(): AIProvider {
  const primaryName = (process.env.AI_PROVIDER || 'gemini') as AIProviderName
  const primaryModel = process.env.AI_MODEL

  // Try primary provider
  const primary = createProvider(primaryName, primaryModel)
  if (primary) return primary

  // Try fallback chain
  const fallbackStr = process.env.AI_FALLBACK_PROVIDERS
  const fallbacks: AIProviderName[] = fallbackStr
    ? fallbackStr.split(',').map(s => s.trim()) as AIProviderName[]
    : DEFAULT_FALLBACK_CHAIN

  for (const name of fallbacks) {
    if (name === primaryName) continue
    const provider = createProvider(name)
    if (provider) return provider
  }

  throw new Error(
    'No AI provider configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY in your environment variables.'
  )
}

// ── Generate with Fallback ───────────────────────────────────────────────────

export async function generateWithFallback(
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<{ result: unknown; provider: string; model: string }> {
  const primaryName = (process.env.AI_PROVIDER || 'gemini') as AIProviderName
  const primaryModel = process.env.AI_MODEL

  const fallbackStr = process.env.AI_FALLBACK_PROVIDERS
  const allProviders: AIProviderName[] = fallbackStr
    ? fallbackStr.split(',').map(s => s.trim()) as AIProviderName[]
    : DEFAULT_FALLBACK_CHAIN

  // Ensure primary is first
  const orderedProviders = [primaryName, ...allProviders.filter(n => n !== primaryName)]
  
  const errors: string[] = []

  for (const name of orderedProviders) {
    const provider = createProvider(
      name,
      name === primaryName ? primaryModel : undefined
    )
    if (!provider) continue

    try {
      const result = await provider.generateJSON(systemPrompt, userPrompt, signal)
      return { result, provider: provider.name, model: provider.model }
    } catch (err) {
      // Don't fallback on user cancellation
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`${name}: ${message}`)
      console.error(`AI provider ${name} failed, trying next...`, message)
    }
  }

  throw new Error(
    `All AI providers failed:\n${errors.join('\n')}`
  )
}
