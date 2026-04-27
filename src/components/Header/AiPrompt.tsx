import { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setSelectedModel } from '../../store/aiSlice'
import { addPanel, addTab } from '../../store/workspaceSlice'
import { generateId } from '../../utils'
import { loadModel, unloadModel } from '../../services/aiApi'
import styles from './AiPrompt.module.css'

export default function AiPrompt() {
  const dispatch = useDispatch()
  const modelConfigs = useSelector((state: RootState) => state.ai.modelConfigs)
  const selectedConfigId = useSelector((state: RootState) => state.ai.selectedModelConfigId)
  const selectedModelId = useSelector((state: RootState) => state.ai.selectedModelId)
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)

  const [prompt, setPrompt] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedConfig = modelConfigs.find((c) => c.id === selectedConfigId)
  const displayModel = selectedModelId ?? selectedConfig?.models[0] ?? null
  const displayLabel =
    displayModel
      ? `${displayModel}`
      : 'Select Model'

  const hasAnyModels = modelConfigs.some((c) => c.models.length > 0)

  function openAiSettingsTab() {
    setModelDropdownOpen(false)
    const tabId = generateId('tab')
    if (activePanelId) {
      dispatch(addTab({
        panelId: activePanelId,
        tab: { id: tabId, type: 'settings', title: 'Settings' },
      }))
    } else {
      dispatch(addPanel({
        id: generateId('panel'),
        tabs: [{ id: tabId, type: 'settings', title: 'Settings' }],
        activeTabId: tabId,
      }))
    }
  }

  function handleFocus() {
    if (!hasAnyModels) {
      openAiSettingsTab()
      textareaRef.current?.blur()
      return
    }
    setExpanded(true)
  }

  function handleBlur() {
    // Keep expanded if there's content
    if (!prompt.trim()) {
      // Delay to allow click events on buttons
      setTimeout(() => setExpanded(false), 150)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setExpanded(false)
      textareaRef.current?.blur()
    }
  }

  function handleSubmit() {
    if (!prompt.trim()) return
    if (!hasAnyModels) {
      openAiSettingsTab()
      return
    }
    // Open a chat tab
    const tabId = generateId('tab')
    if (activePanelId) {
      dispatch(addTab({
        panelId: activePanelId,
        tab: { id: tabId, type: 'chat', title: 'Chat' },
      }))
    } else {
      dispatch(addPanel({
        id: generateId('panel'),
        tabs: [{ id: tabId, type: 'chat', title: 'Chat' }],
        activeTabId: tabId,
      }))
    }
    setPrompt('')
    setExpanded(false)
  }

  function handleSelectModel(configId: string, modelId: string) {
    // Unload previously selected model if provider supports it
    const prevConfig = modelConfigs.find((c) => c.id === selectedConfigId)
    const prevModelId = selectedModelId
    if (prevConfig && prevModelId && (prevConfig.id !== configId || prevModelId !== modelId)) {
      unloadModel(prevConfig, prevModelId).catch(() => {/* ignore unload errors */})
    }

    // Load the newly selected model
    const nextConfig = modelConfigs.find((c) => c.id === configId)
    if (nextConfig) {
      loadModel(nextConfig, modelId).catch(() => {/* ignore load errors */})
    }

    dispatch(setSelectedModel({ configId, modelId }))
    setModelDropdownOpen(false)
  }

  function handleOpenSettings() {
    openAiSettingsTab()
  }

  return (
    <div className={`${styles.aiPromptWrapper} ${expanded ? styles.expanded : ''}`}>
      {/* Overlay to close model dropdown */}
      {modelDropdownOpen && (
        <div className={styles.dropdownOverlay} onClick={() => setModelDropdownOpen(false)} />
      )}

      <div className={styles.aiPromptBar}>
        <textarea
          ref={textareaRef}
          className={styles.promptInput}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI…"
          rows={1}
          aria-label="AI prompt"
        />

        <div className={styles.controls}>
          {/* Model selector */}
          <div className={styles.modelSelectorWrapper}>
            <button
              className={styles.modelButton}
              onClick={() => {
                if (!hasAnyModels) {
                  openAiSettingsTab()
                } else {
                  setModelDropdownOpen((prev) => !prev)
                }
              }}
              title="Select AI model"
              aria-label="Select AI model"
            >
              <span className={styles.modelLabel}>{displayLabel}</span>
              <span className={styles.chevron}>▾</span>
            </button>

            {modelDropdownOpen && (
              <ul className={styles.modelDropdown}>
                {modelConfigs.map((cfg) =>
                  cfg.models.length > 0 ? (
                    <li key={cfg.id} className={styles.modelGroup}>
                      <div className={styles.modelGroupLabel}>{cfg.name}</div>
                      {cfg.models.map((model) => (
                        <div
                          key={model}
                          className={`${styles.modelItem} ${
                            selectedConfigId === cfg.id && selectedModelId === model
                              ? styles.modelItemSelected
                              : ''
                          }`}
                          onClick={() => handleSelectModel(cfg.id, model)}
                        >
                          {model}
                        </div>
                      ))}
                    </li>
                  ) : null,
                )}
                <li className={styles.modelDivider} />
                <li className={styles.modelItem} onClick={handleOpenSettings}>
                  ⚙ Model Settings…
                </li>
              </ul>
            )}
          </div>

          {/* Submit button */}
          {(expanded || prompt.trim()) && (
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              title="Send (Enter)"
              aria-label="Send prompt"
            >
              ↑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
