import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import {
  updateModelConfig,
  addModelConfig,
  removeModelConfig,
} from '../../store/aiSlice'
import type { ModelConfig } from '../../store/aiSlice'
import { fetchModels } from '../../services/aiApi'
import { generateId } from '../../utils'
import styles from './Settings.module.css'

type ProviderType = ModelConfig['provider']

const PROVIDER_LABELS: Record<ProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  lmstudio: 'LM Studio',
  huggingface: 'Hugging Face',
  ollama: 'Ollama (Local)',
  custom: 'Custom',
}

const DEFAULT_ENDPOINTS: Record<ProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  lmstudio: 'http://localhost:1234',
  huggingface: 'https://api-inference.huggingface.co',
  ollama: 'http://localhost:11434',
  custom: '',
}

function ModelConfigCard({
  config,
  onSave,
  onRemove,
  removable,
}: {
  config: ModelConfig
  onSave: (cfg: ModelConfig) => void
  onRemove: (id: string) => void
  removable: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<ModelConfig>(config)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [availableModels, setAvailableModels] = useState<string[]>([])

  function handleEdit() {
    setDraft(config)
    setAvailableModels(config.models)
    setFetchError(null)
    setEditing(true)
  }

  async function handleFetchModels() {
    setFetchingModels(true)
    setFetchError(null)
    try {
      const models = await fetchModels(draft)
      setAvailableModels(models)
      // Auto-select all fetched models for the config
      setDraft((d) => ({ ...d, models }))
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch models')
    } finally {
      setFetchingModels(false)
    }
  }

  function toggleModel(modelId: string) {
    setDraft((d) => ({
      ...d,
      models: d.models.includes(modelId)
        ? d.models.filter((m) => m !== modelId)
        : [...d.models, modelId],
    }))
  }

  function handleSave() {
    onSave(draft)
    setEditing(false)
  }

  function handleCancel() {
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className={styles.configCard}>
        <div className={styles.configCardHeader}>
          <div className={styles.configCardTitle}>
            <span className={styles.configName}>{config.name}</span>
            <span className={styles.configProvider}>{PROVIDER_LABELS[config.provider]}</span>
          </div>
          <div className={styles.configCardActions}>
            <button className={styles.buttonSmall} onClick={handleEdit}>
              Edit
            </button>
            {removable && (
              <button
                className={`${styles.buttonSmall} ${styles.buttonDanger}`}
                onClick={() => onRemove(config.id)}
              >
                Remove
              </button>
            )}
          </div>
        </div>
        <div className={styles.configDetail}>
          <span className={styles.configDetailLabel}>Endpoint:</span>
          <span className={styles.configDetailValue}>{config.endpoint || '(default)'}</span>
        </div>
        <div className={styles.configDetail}>
          <span className={styles.configDetailLabel}>API Key:</span>
          <span className={styles.configDetailValue}>
            {config.apiKey ? '••••••••' : <em className={styles.notSet}>not set</em>}
          </span>
        </div>
        <div className={styles.configDetail}>
          <span className={styles.configDetailLabel}>Models:</span>
          <span className={styles.configDetailValue}>
            {config.models.length > 0 ? config.models.join(', ') : <em className={styles.notSet}>none</em>}
          </span>
        </div>
      </div>
    )
  }

  // Combine: show available (fetched) models + any previously saved ones not in the fetched list
  const displayModels = availableModels.length > 0
    ? [...new Set([...availableModels, ...draft.models])]
    : draft.models

  return (
    <div className={`${styles.configCard} ${styles.configCardEditing}`}>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>Name</label>
        <input
          className={styles.formInput}
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="Display name"
        />
      </div>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>Provider</label>
        <select
          className={styles.formSelect}
          value={draft.provider}
          onChange={(e) => {
            const provider = e.target.value as ProviderType
            setDraft({
              ...draft,
              provider,
              endpoint: draft.endpoint || DEFAULT_ENDPOINTS[provider],
            })
          }}
        >
          {(Object.keys(PROVIDER_LABELS) as ProviderType[]).map((p) => (
            <option key={p} value={p}>
              {PROVIDER_LABELS[p]}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>API Endpoint</label>
        <input
          className={styles.formInput}
          value={draft.endpoint}
          onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })}
          placeholder={DEFAULT_ENDPOINTS[draft.provider]}
        />
      </div>
      {draft.provider !== 'ollama' && draft.provider !== 'lmstudio' && (
        <div className={styles.formRow}>
          <label className={styles.formLabel}>API Key</label>
          <input
            className={styles.formInput}
            type="password"
            value={draft.apiKey}
            onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
            placeholder="Enter API key"
            autoComplete="off"
          />
        </div>
      )}
      <div className={styles.formRow}>
        <label className={styles.formLabel}>Available Models</label>
        <div className={styles.modelsFetchRow}>
          <button
            className={styles.buttonSecondary}
            onClick={handleFetchModels}
            disabled={fetchingModels}
          >
            {fetchingModels ? 'Fetching…' : 'Fetch Models'}
          </button>
          {fetchError && <span className={styles.fetchError}>{fetchError}</span>}
        </div>
        {displayModels.length > 0 ? (
          <div className={styles.modelCheckboxList}>
            {displayModels.map((modelId) => (
              <label key={modelId} className={styles.modelCheckboxRow}>
                <input
                  type="checkbox"
                  checked={draft.models.includes(modelId)}
                  onChange={() => toggleModel(modelId)}
                />
                <span>{modelId}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className={styles.formHint}>
            Click "Fetch Models" to load available models from this provider.
          </div>
        )}
      </div>
      <div className={styles.formActions}>
        <button className={styles.buttonSecondary} onClick={handleCancel}>
          Cancel
        </button>
        <button className={styles.buttonPrimary} onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const dispatch = useDispatch()
  const modelConfigs = useSelector((state: RootState) => state.ai.modelConfigs)
  const [addingNew, setAddingNew] = useState(false)
  const [newDraft, setNewDraft] = useState<ModelConfig>({
    id: '',
    name: '',
    provider: 'custom',
    apiKey: '',
    endpoint: '',
    models: [],
  })
  const [newFetchingModels, setNewFetchingModels] = useState(false)
  const [newFetchError, setNewFetchError] = useState<string | null>(null)
  const [newAvailableModels, setNewAvailableModels] = useState<string[]>([])

  const BUILT_IN_IDS = ['openai', 'anthropic', 'lmstudio', 'huggingface', 'ollama']

  function handleSave(cfg: ModelConfig) {
    dispatch(updateModelConfig(cfg))
  }

  function handleRemove(id: string) {
    dispatch(removeModelConfig(id))
  }

  function handleAddNew() {
    setNewDraft({
      id: generateId('model'),
      name: '',
      provider: 'custom',
      apiKey: '',
      endpoint: '',
      models: [],
    })
    setNewAvailableModels([])
    setNewFetchError(null)
    setAddingNew(true)
  }

  async function handleFetchNewModels() {
    setNewFetchingModels(true)
    setNewFetchError(null)
    try {
      const models = await fetchModels(newDraft)
      setNewAvailableModels(models)
      setNewDraft((d) => ({ ...d, models }))
    } catch (err) {
      setNewFetchError(err instanceof Error ? err.message : 'Failed to fetch models')
    } finally {
      setNewFetchingModels(false)
    }
  }

  function toggleNewModel(modelId: string) {
    setNewDraft((d) => ({
      ...d,
      models: d.models.includes(modelId)
        ? d.models.filter((m) => m !== modelId)
        : [...d.models, modelId],
    }))
  }

  function handleSaveNew() {
    if (!newDraft.name.trim()) return
    dispatch(addModelConfig(newDraft))
    setAddingNew(false)
  }

  function handleCancelNew() {
    setAddingNew(false)
  }

  const newDisplayModels = newAvailableModels.length > 0
    ? [...new Set([...newAvailableModels, ...newDraft.models])]
    : newDraft.models

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.pageTitle}>Settings</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>AI Model Configuration</h2>
          <p className={styles.sectionDescription}>
            Configure API keys and endpoints for AI model providers. Keys are stored locally
            in application state.
          </p>

          <div className={styles.configList}>
            {modelConfigs.map((cfg) => (
              <ModelConfigCard
                key={cfg.id}
                config={cfg}
                onSave={handleSave}
                onRemove={handleRemove}
                removable={!BUILT_IN_IDS.includes(cfg.id)}
              />
            ))}
          </div>

          {addingNew ? (
            <div className={`${styles.configCard} ${styles.configCardEditing}`}>
              <div className={styles.configCardHeader}>
                <span className={styles.configName}>New Model Provider</span>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Name</label>
                <input
                  className={styles.formInput}
                  value={newDraft.name}
                  onChange={(e) => setNewDraft({ ...newDraft, name: e.target.value })}
                  placeholder="Display name"
                  autoFocus
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Provider</label>
                <select
                  className={styles.formSelect}
                  value={newDraft.provider}
                  onChange={(e) => {
                    const provider = e.target.value as ProviderType
                    setNewDraft({
                      ...newDraft,
                      provider,
                      endpoint: DEFAULT_ENDPOINTS[provider],
                    })
                  }}
                >
                  {(Object.keys(PROVIDER_LABELS) as ProviderType[]).map((p) => (
                    <option key={p} value={p}>
                      {PROVIDER_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>API Endpoint</label>
                <input
                  className={styles.formInput}
                  value={newDraft.endpoint}
                  onChange={(e) => setNewDraft({ ...newDraft, endpoint: e.target.value })}
                  placeholder={DEFAULT_ENDPOINTS[newDraft.provider] || 'https://...'}
                />
              </div>
              {newDraft.provider !== 'ollama' && newDraft.provider !== 'lmstudio' && (
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>API Key</label>
                  <input
                    className={styles.formInput}
                    type="password"
                    value={newDraft.apiKey}
                    onChange={(e) => setNewDraft({ ...newDraft, apiKey: e.target.value })}
                    placeholder="Enter API key"
                    autoComplete="off"
                  />
                </div>
              )}
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Available Models</label>
                <div className={styles.modelsFetchRow}>
                  <button
                    className={styles.buttonSecondary}
                    onClick={handleFetchNewModels}
                    disabled={newFetchingModels}
                  >
                    {newFetchingModels ? 'Fetching…' : 'Fetch Models'}
                  </button>
                  {newFetchError && <span className={styles.fetchError}>{newFetchError}</span>}
                </div>
                {newDisplayModels.length > 0 ? (
                  <div className={styles.modelCheckboxList}>
                    {newDisplayModels.map((modelId) => (
                      <label key={modelId} className={styles.modelCheckboxRow}>
                        <input
                          type="checkbox"
                          checked={newDraft.models.includes(modelId)}
                          onChange={() => toggleNewModel(modelId)}
                        />
                        <span>{modelId}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className={styles.formHint}>
                    Click "Fetch Models" to load available models from this provider.
                  </div>
                )}
              </div>
              <div className={styles.formActions}>
                <button className={styles.buttonSecondary} onClick={handleCancelNew}>
                  Cancel
                </button>
                <button
                  className={styles.buttonPrimary}
                  onClick={handleSaveNew}
                  disabled={!newDraft.name.trim()}
                >
                  Add Provider
                </button>
              </div>
            </div>
          ) : (
            <button className={styles.buttonAddProvider} onClick={handleAddNew}>
              + Add Custom Provider
            </button>
          )}
        </section>
      </div>
    </div>
  )
}
