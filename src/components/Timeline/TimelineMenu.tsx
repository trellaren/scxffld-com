import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import {
  toggleTimeline,
  addTimelineItem,
  removeTimelineItem,
} from '../../store/timelineSlice'
import type { TimelineItem } from '../../store/timelineSlice'
import styles from './TimelineMenu.module.css'

function generateId() {
  return `tl-${crypto.randomUUID()}`
}

const ITEM_COLORS = ['#007acc', '#e9562e', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4']

export default function TimelineMenu() {
  const dispatch = useDispatch()
  const open = useSelector((state: RootState) => state.timeline.open)
  const items = useSelector((state: RootState) => state.timeline.items)

  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [colorIndex, setColorIndex] = useState(0)

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    const item: TimelineItem = {
      id: generateId(),
      title: newTitle.trim(),
      date: newDate,
      color: ITEM_COLORS[colorIndex % ITEM_COLORS.length],
    }
    dispatch(addTimelineItem(item))
    setNewTitle('')
    setNewDate('')
    setColorIndex((prev) => prev + 1)
    setAdding(false)
  }

  function handleCancelAdd() {
    setNewTitle('')
    setNewDate('')
    setAdding(false)
  }

  return (
    <div className={styles.timelineMenuContainer}>
      {/* Collapsible header row */}
      <button
        className={styles.toggleBar}
        onClick={() => dispatch(toggleTimeline())}
        aria-expanded={open}
        aria-label={open ? 'Collapse timeline' : 'Expand timeline'}
      >
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>›</span>
        <span className={styles.label}>TIMELINE</span>
        {items.length > 0 && !open && (
          <span className={styles.badge}>{items.length}</span>
        )}
      </button>

      {/* Expanded timeline content */}
      {open && (
        <div className={styles.timelineContent}>
          {/* Horizontal scrollable track */}
          <div className={styles.track}>
            {items.length === 0 && !adding && (
              <span className={styles.emptyHint}>No events yet — click + Add Event to get started</span>
            )}

            {items.map((item, index) => (
              <div key={item.id} className={styles.eventWrapper}>
                {/* Connector line */}
                {index > 0 && <div className={styles.connector} />}

                {/* Event card / clickable window */}
                <button
                  className={`${styles.eventCard} ${selectedId === item.id ? styles.eventCardSelected : ''}`}
                  style={{ borderTopColor: item.color ?? '#007acc' }}
                  onClick={() => setSelectedId((prev) => (prev === item.id ? null : item.id))}
                  aria-pressed={selectedId === item.id}
                >
                  <span className={styles.eventDot} style={{ backgroundColor: item.color ?? '#007acc' }} />
                  <span className={styles.eventTitle}>{item.title}</span>
                  {item.date && <span className={styles.eventDate}>{item.date}</span>}
                  <button
                    className={styles.removeBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      dispatch(removeTimelineItem(item.id))
                      if (selectedId === item.id) setSelectedId(null)
                    }}
                    aria-label={`Remove ${item.title}`}
                    title="Remove event"
                  >
                    ×
                  </button>
                </button>
              </div>
            ))}

            {/* Inline add-event form */}
            {adding && (
              <div className={styles.eventWrapper}>
                {items.length > 0 && <div className={styles.connector} />}
                <form className={styles.addForm} onSubmit={handleAddSubmit}>
                  <input
                    className={styles.addInput}
                    type="text"
                    placeholder="Event title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    autoFocus
                  />
                  <input
                    className={styles.addInput}
                    type="date"
                    placeholder="Date (optional)"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                  <div className={styles.addFormActions}>
                    <button type="submit" className={styles.addConfirmBtn}>Add</button>
                    <button type="button" className={styles.addCancelBtn} onClick={handleCancelAdd}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Actions bar */}
          {!adding && (
            <button className={styles.addEventBtn} onClick={() => setAdding(true)}>
              + Add Event
            </button>
          )}
        </div>
      )}
    </div>
  )
}
