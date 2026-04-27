import { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setSelectedModel } from '../../store/aiSlice'
import { addPanel, addTab } from '../../store/workspaceSlice'
import { generateId } from '../../utils'
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

  function handleFocus() {
    setExpanded(true)
  }

  function handleBlur(e: React.FocusEvent<HTMLTextAreaElement>) {
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
    // For now: open a new panel/tab with the prompt as content
    // Future: send to AI API
    const tabId = generateId('tab')
    const tabTitle = `AI: ${prompt.slice(0, 30)}${prompt.length > 30 ? '…' : ''}`
    if (activePanelId) {
      dispatch(addTab({
        panelId: activePanelId,
        tab: { id: tabId, type: 'editor', title: tabTitle },
      }))
    } else {
      dispatch(addPanel({
        id: generateId('panel'),
        tabs: [{ id: tabId, type: 'editor', title: tabTitle }],
        activeTabId: tabId,
      }))
    }
    setPrompt('')
    setExpanded(false)
  }

  function handleSelectModel(configId: string, modelId: string) {
    dispatch(setSelectedModel({ configId, modelId }))
    setModelDropdownOpen(false)
  }

  function handleOpenSettings() {
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
              onClick={() => setModelDropdownOpen((prev) => !prev)}
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
