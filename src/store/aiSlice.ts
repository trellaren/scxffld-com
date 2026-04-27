import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'lmstudio' | 'huggingface' | 'ollama' | 'custom'
  apiKey: string
  endpoint: string
  models: string[]
}

export interface AiState {
  modelConfigs: ModelConfig[]
  selectedModelConfigId: string | null
  selectedModelId: string | null
}

const defaultConfigs: ModelConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    provider: 'openai',
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    provider: 'anthropic',
    apiKey: '',
    endpoint: 'https://api.anthropic.com',
    models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5'],
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    provider: 'lmstudio',
    apiKey: '',
    endpoint: 'http://localhost:1234',
    models: [],
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    provider: 'huggingface',
    apiKey: '',
    endpoint: 'https://api-inference.huggingface.co',
    models: [],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    provider: 'ollama',
    apiKey: '',
    endpoint: 'http://localhost:11434',
    models: ['llama3.2', 'mistral', 'codellama'],
  },
]

/** localStorage key for AI state persistence. "scxffld" is the application's brand name. */
const AI_STORAGE_KEY = 'scxffld-ai-state'

/** Load persisted AI state from localStorage, falling back to undefined on any error. */
function loadPersistedAiState(): Partial<AiState> | undefined {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY)
    if (!raw) return undefined
    return JSON.parse(raw) as Partial<AiState>
  } catch {
    return undefined
  }
}

function buildInitialState(): AiState {
  const persisted = loadPersistedAiState()
  if (!persisted) {
    return {
      modelConfigs: defaultConfigs,
      selectedModelConfigId: null,
      selectedModelId: null,
    }
  }

  // Merge persisted configs with defaults: keep defaults as base, overlay persisted
  // configs that have the same id (to preserve user-set apiKey/endpoint/models),
  // and append any extra custom configs the user may have added.
  const mergedConfigs = defaultConfigs.map((def) => {
    const saved = persisted.modelConfigs?.find((c) => c.id === def.id)
    return saved ?? def
  })
  // Append custom configs that don't match any default id
  const customConfigs = (persisted.modelConfigs ?? []).filter(
    (c) => !defaultConfigs.some((d) => d.id === c.id),
  )

  return {
    modelConfigs: [...mergedConfigs, ...customConfigs],
    selectedModelConfigId: persisted.selectedModelConfigId ?? null,
    selectedModelId: persisted.selectedModelId ?? null,
  }
}

const initialState: AiState = buildInitialState()

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setSelectedModel(
      state,
      action: PayloadAction<{ configId: string; modelId: string }>,
    ) {
      state.selectedModelConfigId = action.payload.configId
      state.selectedModelId = action.payload.modelId
    },
    updateModelConfig(state, action: PayloadAction<ModelConfig>) {
      const idx = state.modelConfigs.findIndex((c) => c.id === action.payload.id)
      if (idx >= 0) {
        state.modelConfigs[idx] = action.payload
      }
    },
    addModelConfig(state, action: PayloadAction<ModelConfig>) {
      state.modelConfigs.push(action.payload)
    },
    removeModelConfig(state, action: PayloadAction<string>) {
      state.modelConfigs = state.modelConfigs.filter((c) => c.id !== action.payload)
      if (state.selectedModelConfigId === action.payload) {
        state.selectedModelConfigId = null
        state.selectedModelId = null
      }
    },
  },
})

export const {
  setSelectedModel,
  updateModelConfig,
  addModelConfig,
  removeModelConfig,
} = aiSlice.actions
export default aiSlice.reducer

/** Serialize AI state for localStorage persistence. */
export function serializeAiState(state: AiState): string {
  return JSON.stringify(state)
}

export { AI_STORAGE_KEY }
