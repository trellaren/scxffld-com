import type { ModelConfig } from '../store/aiSlice'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Anthropic models have no public list endpoint; return a known set
const ANTHROPIC_MODELS = [
  'claude-opus-4-5',
  'claude-sonnet-4-5',
  'claude-haiku-4-5',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
]

/**
 * Fetch available models from a provider's REST API.
 * Falls back to a hardcoded list for providers without a /models endpoint.
 */
export async function fetchModels(config: ModelConfig): Promise<string[]> {
  const { provider, endpoint, apiKey } = config

  switch (provider) {
    case 'openai': {
      const base = endpoint || 'https://api.openai.com/v1'
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      const res = await fetch(`${base}/models`, { headers })
      if (!res.ok) throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`)
      const json = await res.json()
      return (json.data as { id: string }[])
        .map((m) => m.id)
        .sort()
    }

    case 'anthropic': {
      // Anthropic does not expose a public /models endpoint; return known list
      return ANTHROPIC_MODELS
    }

    case 'lmstudio': {
      const base = endpoint || 'http://localhost:1234'
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      const res = await fetch(`${base}/v1/models`, { headers })
      if (!res.ok) throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`)
      const json = await res.json()
      return (json.data as { id: string }[]).map((m) => m.id)
    }

    case 'huggingface': {
      // List popular text-generation models
      const headers: Record<string, string> = {}
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      const res = await fetch(
        'https://huggingface.co/api/models?pipeline_tag=text-generation&sort=downloads&direction=-1&limit=30',
        { headers },
      )
      if (!res.ok) throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`)
      const json = await res.json()
      return (json as { id: string }[]).map((m) => m.id)
    }

    case 'ollama': {
      const base = endpoint || 'http://localhost:11434'
      const res = await fetch(`${base}/api/tags`)
      if (!res.ok) throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`)
      const json = await res.json()
      return (json.models as { name: string }[]).map((m) => m.name)
    }

    case 'custom': {
      const base = endpoint
      if (!base) throw new Error('No endpoint configured')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      const res = await fetch(`${base}/models`, { headers })
      if (!res.ok) throw new Error(`Failed to fetch models: ${res.status} ${res.statusText}`)
      const json = await res.json()
      return (json.data as { id: string }[]).map((m) => m.id)
    }

    default:
      return []
  }
}

/**
 * Load a model on providers that support explicit model loading (LM Studio, Ollama).
 * No-op for cloud providers.
 */
export async function loadModel(config: ModelConfig, modelId: string): Promise<void> {
  const { provider, endpoint } = config

  switch (provider) {
    case 'lmstudio': {
      const base = endpoint || 'http://localhost:1234'
      await fetch(`${base}/api/v0/models/${encodeURIComponent(modelId)}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      break
    }

    case 'ollama': {
      // Warm-up the model by running a no-op generation
      const base = endpoint || 'http://localhost:11434'
      await fetch(`${base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId, keep_alive: '5m' }),
      })
      break
    }

    default:
      break
  }
}

/**
 * Unload a model on providers that support explicit model unloading (LM Studio, Ollama).
 * No-op for cloud providers.
 */
export async function unloadModel(config: ModelConfig, modelId: string): Promise<void> {
  const { provider, endpoint } = config

  switch (provider) {
    case 'lmstudio': {
      const base = endpoint || 'http://localhost:1234'
      await fetch(`${base}/api/v0/models/${encodeURIComponent(modelId)}/unload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      break
    }

    case 'ollama': {
      // Set keep_alive=0 to immediately unload
      const base = endpoint || 'http://localhost:11434'
      await fetch(`${base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId, keep_alive: 0 }),
      })
      break
    }

    default:
      break
  }
}

/**
 * Send a chat conversation to the AI provider and return the assistant's reply.
 * Throws on API error so callers can display an "agent unavailable" message.
 */
export async function sendChatMessage(
  config: ModelConfig,
  modelId: string,
  messages: ChatMessage[],
): Promise<string> {
  const { provider, endpoint, apiKey } = config

  switch (provider) {
    case 'openai':
    case 'lmstudio': {
      const base = endpoint || 'https://api.openai.com/v1'
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
      const json = await res.json()
      return (json.choices as { message: { content: string } }[])[0]?.message?.content ?? ''
    }

    case 'anthropic': {
      const base = endpoint || 'https://api.anthropic.com'
      const systemMessages = messages.filter((m) => m.role === 'system')
      const nonSystemMessages = messages.filter((m) => m.role !== 'system')
      const res = await fetch(`${base}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 1024,
          ...(systemMessages.length > 0 && {
            system: systemMessages.map((m) => m.content).join('\n'),
          }),
          messages: nonSystemMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${res.statusText}`)
      const json = await res.json()
      return (json.content as { text: string }[])[0]?.text ?? ''
    }

    case 'ollama': {
      const base = endpoint || 'http://localhost:11434'
      const res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          stream: false,
        }),
      })
      if (!res.ok) throw new Error(`Ollama API error: ${res.status} ${res.statusText}`)
      const json = await res.json()
      return (json.message as { content: string })?.content ?? ''
    }

    case 'huggingface': {
      const base = endpoint || 'https://api-inference.huggingface.co'
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      const res = await fetch(`${base}/models/${modelId}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          max_tokens: 500,
        }),
      })
      if (!res.ok) throw new Error(`HuggingFace API error: ${res.status} ${res.statusText}`)
      const json = await res.json()
      return (json.choices as { message: { content: string } }[])[0]?.message?.content ?? ''
    }

    case 'custom': {
      const base = endpoint
      if (!base) throw new Error('No endpoint configured')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelId,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
      const json = await res.json()
      return (json.choices as { message: { content: string } }[])[0]?.message?.content ?? ''
    }

    default:
      throw new Error('Unknown provider')
  }
}
