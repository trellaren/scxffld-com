import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import styles from './JsonViewer.module.css'

interface JsonViewerProps {
  tabId: string
}

function tokenizeJson(json: string): ReactNode[] {
  // Simple JSON syntax tokenizer using a regex-based approach
  const tokenRegex = /("(?:[^"\\]|\\.)*")\s*(:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(json)) !== null) {
    // Add any whitespace/text between tokens as-is
    if (match.index > lastIndex) {
      nodes.push(json.slice(lastIndex, match.index))
    }

    const [full, strToken, colon, keyword, number, punctuation] = match

    if (strToken) {
      if (colon) {
        // Object key
        nodes.push(
          <span key={match.index} className={styles.tokenKey}>{strToken}</span>,
          <span key={`${match.index}-colon`} className={styles.tokenPunctuation}>:</span>,
        )
      } else {
        // String value
        nodes.push(<span key={match.index} className={styles.tokenString}>{strToken}</span>)
      }
    } else if (keyword) {
      nodes.push(<span key={match.index} className={styles.tokenKeyword}>{keyword}</span>)
    } else if (number) {
      nodes.push(<span key={match.index} className={styles.tokenNumber}>{number}</span>)
    } else if (punctuation) {
      nodes.push(<span key={match.index} className={styles.tokenPunctuation}>{full}</span>)
    }

    lastIndex = tokenRegex.lastIndex
  }

  if (lastIndex < json.length) {
    nodes.push(json.slice(lastIndex))
  }

  return nodes
}

export default function JsonViewer({ tabId }: JsonViewerProps) {
  const rawContent = useSelector((state: RootState) => state.workspace.fileContents[tabId] ?? '')

  const { formatted, error } = useMemo(() => {
    if (!rawContent) return { formatted: '', error: null }
    try {
      const parsed = JSON.parse(rawContent)
      return { formatted: JSON.stringify(parsed, null, 2), error: null }
    } catch (e) {
      return { formatted: rawContent, error: (e as Error).message }
    }
  }, [rawContent])

  const tokens = useMemo(() => {
    if (error) return null
    return tokenizeJson(formatted)
  }, [formatted, error])

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <i className="bi bi-filetype-json" aria-hidden="true" />
        <span className={styles.toolbarTitle}>JSON Viewer</span>
        {error && <span className={styles.errorBadge}>Parse error: {error}</span>}
      </div>
      <div className={styles.scrollArea}>
        <pre className={styles.pre}>
          {error ? (
            <span className={styles.errorText}>{formatted}</span>
          ) : (
            tokens
          )}
        </pre>
      </div>
    </div>
  )
}
