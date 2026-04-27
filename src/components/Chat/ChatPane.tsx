import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store'
import { toggleChat, addTab, addPanel } from '../../store/workspaceSlice'
import { generateId } from '../../utils'
import styles from './ChatPane.module.css'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

interface ChatPaneProps {
  embedded?: boolean
}

export default function ChatPane({ embedded = false }: ChatPaneProps) {
  const dispatch = useDispatch()
  const activePanelId = useSelector((state: RootState) => state.workspace.activePanelId)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: 'AI response coming soon…' },
    ])
    setInput('')
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

  return (
    <div className={embedded ? styles.chatPaneEmbedded : styles.chatPane}>
      <div className={styles.header}>
        <span className={styles.title}>Chat</span>
        <div className={styles.headerActions}>
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
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
          >
            <div className={styles.messageBubble}>{msg.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputBar}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          aria-label="Chat message input"
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!input.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  )
}
