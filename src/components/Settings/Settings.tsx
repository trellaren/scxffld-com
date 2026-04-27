import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import {
  updateModelConfig,
  addModelConfig,
  removeModelConfig,
} from '../../store/aiSlice'
import type { ModelConfig } from '../../store/aiSlice'
import { generateId } from '../../utils'
import styles from './Settings.module.css'

type ProviderType = ModelConfig['provider']

const PROVIDER_LABELS: Record<ProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama (Local)',
  custom: 'Custom',
}

const DEFAULT_ENDPOINTS: Record<ProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
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
  const [modelsText, setModelsText] = useState(config.models.join(', '))

  function handleEdit() {
    setDraft(config)
    setModelsText(config.models.join(', '))
    setEditing(true)
  }

  function handleSave() {
    const models = modelsText
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
    onSave({ ...draft, models })
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
      {draft.provider !== 'ollama' && (
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
        <label className={styles.formLabel}>Models</label>
        <input
          className={styles.formInput}
          value={modelsText}
          onChange={(e) => setModelsText(e.target.value)}
          placeholder="model-id-1, model-id-2"
        />
        <div className={styles.formHint}>Comma-separated list of model IDs</div>
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
  const [newModelsText, setNewModelsText] = useState('')

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
    setNewModelsText('')
    setAddingNew(true)
  }

  function handleSaveNew() {
    const models = newModelsText
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
    if (!newDraft.name.trim()) return
    dispatch(addModelConfig({ ...newDraft, models }))
    setAddingNew(false)
  }

  function handleCancelNew() {
    setAddingNew(false)
  }

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
                removable={!['openai', 'anthropic', 'ollama'].includes(cfg.id)}
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
              {newDraft.provider !== 'ollama' && (
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
                <label className={styles.formLabel}>Models</label>
                <input
                  className={styles.formInput}
                  value={newModelsText}
                  onChange={(e) => setNewModelsText(e.target.value)}
                  placeholder="model-id-1, model-id-2"
                />
                <div className={styles.formHint}>Comma-separated list of model IDs</div>
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
