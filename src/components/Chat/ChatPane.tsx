import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { toggleChat, addTab, addPanel, setChatMessages, clearChatMessages } from '../../store/workspaceSlice'
import type { ChatMessage as StoredMessage } from '../../store/workspaceSlice'
import { setSelectedModel } from '../../store/aiSlice'
import { generateId } from '../../utils'
import { sendChatMessage, loadModel, unloadModel } from '../../services/aiApi'
import type { ChatMessage } from '../../services/aiApi'
import {
  exportChatAsTxt,
  exportChatAsJson,
  exportChatAsDocx,
  exportChatAsPdf,
} from '../../utils/exportUtils'
import styles from './ChatPane.module.css'

type ChatFormat = 'txt' | 'json' | 'docx' | 'pdf'

interface ChatPaneProps {
  embedded?: boolean
  tabId?: string
}

/** Session key for the floating (non-embedded) chat pane */
const FLOATING_SESSION_ID = 'floating-chat'

export default function ChatPane({ embedded = false, tabId }: ChatPaneProps) {
  const dispatch = useDispatch()
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)
  const modelConfigs = useSelector((state: RootState) => state.ai.modelConfigs)
  const selectedConfigId = useSelector((state: RootState) => state.ai.selectedModelConfigId)
  const selectedModelId = useSelector((state: RootState) => state.ai.selectedModelId)

  const sessionId = tabId ?? FLOATING_SESSION_ID
  const storedMessages = useSelector(
    (state: RootState) => state.workspace.chatMessages[sessionId] ?? [],
  )

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedConfig = modelConfigs.find((c) => c.id === selectedConfigId)
  const activeModelId =
    selectedModelId ?? selectedConfig?.models[0] ?? null

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [storedMessages])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    const userMessage: StoredMessage = { role: 'user', text }
    const updatedMessages = [...storedMessages, userMessage]
    dispatch(setChatMessages({ sessionId, messages: updatedMessages }))
    setInput('')
    setSending(true)

    if (!selectedConfig || !activeModelId) {
      dispatch(setChatMessages({
        sessionId,
        messages: [
          ...updatedMessages,
          { role: 'assistant', text: '⚠ No AI model selected. Please choose a model from the model selector.' },
        ],
      }))
      setSending(false)
      return
    }

    try {
      const apiMessages: ChatMessage[] = updatedMessages.map((m) => ({
        role: m.role,
        content: m.text,
      }))
      const reply = await sendChatMessage(selectedConfig, activeModelId, apiMessages)
      dispatch(setChatMessages({
        sessionId,
        messages: [...updatedMessages, { role: 'assistant', text: reply }],
      }))
    } catch {
      dispatch(setChatMessages({
        sessionId,
        messages: [
          ...updatedMessages,
          { role: 'assistant', text: '⚠ Agent unavailable. Please check your connection and API settings.' },
        ],
      }))
    } finally {
      setSending(false)
    }
  }

  function handleSelectModel(configId: string, modelId: string) {
    const prevConfig = modelConfigs.find((c) => c.id === selectedConfigId)
    const prevModelId = selectedModelId
    if (prevConfig && prevModelId && (prevConfig.id !== configId || prevModelId !== modelId)) {
      unloadModel(prevConfig, prevModelId).catch(() => {/* ignore */})
    }
    const nextConfig = modelConfigs.find((c) => c.id === configId)
    if (nextConfig) {
      loadModel(nextConfig, modelId).catch(() => {/* ignore */})
    }
    dispatch(setSelectedModel({ configId, modelId }))
    setModelDropdownOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSend()
  }

  function handlePopIntoTab() {
    const tab = { id: generateId('tab'), type: 'chat' as const, title: 'Chat' }
    if (activePanelId) {
      dispatch(addTab({ panelId: activePanelId, tab }))
    } else {
      dispatch(addPanel({ id: generateId('panel'), tabs: [tab], activeTabId: tab.id }))
    }
    dispatch(toggleChat())
  }

  function handleClearChat() {
    dispatch(clearChatMessages(sessionId))
  }

  async function handleExport(format: ChatFormat) {
    setExportDropdownOpen(false)
    const date = new Date().toISOString().slice(0, 10)
    const filename = `chat-${date}`
    switch (format) {
      case 'txt':
        exportChatAsTxt(storedMessages, `${filename}.txt`)
        break
      case 'json':
        exportChatAsJson(storedMessages, `${filename}.json`)
        break
      case 'docx':
        await exportChatAsDocx(storedMessages, `${filename}.docx`)
        break
      case 'pdf':
        exportChatAsPdf(storedMessages, `${filename}.pdf`)
        break
    }
  }

  return (
    <div className={embedded ? styles.chatPaneEmbedded : styles.chatPane}>
      {(modelDropdownOpen || exportDropdownOpen) && (
        <div
          className={styles.dropdownOverlay}
          onClick={() => { setModelDropdownOpen(false); setExportDropdownOpen(false) }}
        />
      )}
      <div className={styles.header}>
        <div className={styles.modelSelectorWrapper}>
          <button
            className={styles.modelButton}
            onClick={() => setModelDropdownOpen((prev) => !prev)}
            title="Switch model"
            aria-label="Switch AI model"
          >
            <span className={styles.modelLabel}>
              {activeModelId ?? 'Select Model'}
            </span>
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
            </ul>
          )}
        </div>
        <div className={styles.headerActions}>
          {storedMessages.length > 0 && (
            <div className={styles.exportWrapper}>
              <button
                className={styles.actionBtn}
                onClick={() => setExportDropdownOpen((prev) => !prev)}
                title="Save chat"
                aria-label="Save chat"
              >
                ⬇
              </button>
              {exportDropdownOpen && (
                <ul className={styles.exportDropdown}>
                  <li className={styles.exportItem} onClick={() => handleExport('txt')}>Plain Text (.txt)</li>
                  <li className={styles.exportItem} onClick={() => handleExport('json')}>JSON (.json)</li>
                  <li className={styles.exportItem} onClick={() => handleExport('docx')}>Word (.docx)</li>
                  <li className={styles.exportItem} onClick={() => handleExport('pdf')}>PDF (.pdf)</li>
                </ul>
              )}
            </div>
          )}
          {storedMessages.length > 0 && (
            <button
              className={styles.actionBtn}
              onClick={handleClearChat}
              title="Clear chat"
              aria-label="Clear chat history"
            >
              🗑
            </button>
          )}
          {!embedded && (
            <button
              className={styles.actionBtn}
              onClick={handlePopIntoTab}
              title="Pop into tab"
              aria-label="Pop chat into tab"
            >
              ⤢
            </button>
          )}
          {!embedded && (
            <button
              className={styles.actionBtn}
              onClick={() => dispatch(toggleChat())}
              title="Close chat"
              aria-label="Close chat pane"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className={styles.messageList}>
        {storedMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
          >
            <div className={styles.messageBubble}>{msg.text}</div>
          </div>
        ))}
        {sending && (
          <div className={`${styles.message} ${styles.messageAssistant}`}>
            <div className={`${styles.messageBubble} ${styles.messageBubbleTyping}`}>…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputBar}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeModelId ? `Message ${activeModelId}…` : 'Select a model to start chatting…'}
          aria-label="Chat message input"
          disabled={sending}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!input.trim() || sending}
          aria-label="Send message"
        >
          {sending ? '…' : 'Send'}
        </button>
      </div>
    </div>
  )
}

