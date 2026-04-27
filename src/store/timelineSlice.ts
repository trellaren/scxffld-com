import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface TimelineItem {
  id: string
  title: string
  /** ISO 8601 date string (YYYY-MM-DD) */
  date: string
  color?: string
}

export interface TimelineState {
  items: TimelineItem[]
  open: boolean
}

const initialState: TimelineState = {
  items: [],
  open: false,
}

const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    toggleTimeline(state) {
      state.open = !state.open
    },
    addTimelineItem(state, action: PayloadAction<TimelineItem>) {
      state.items.push(action.payload)
    },
    removeTimelineItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    updateTimelineItem(state, action: PayloadAction<TimelineItem>) {
      const idx = state.items.findIndex((i) => i.id === action.payload.id)
      if (idx !== -1) state.items[idx] = action.payload
    },
    loadTimeline(state, action: PayloadAction<TimelineItem[]>) {
      state.items = action.payload
    },
  },
})

export const { toggleTimeline, addTimelineItem, removeTimelineItem, updateTimelineItem, loadTimeline } =
  timelineSlice.actions
export default timelineSlice.reducer
