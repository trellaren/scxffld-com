import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { setSidebarView, toggleSidebar } from '../../store/workspaceSlice'
import type { SidebarView } from '../../store/workspaceSlice'
import styles from './ActivityBar.module.css'

const VIEWS: { id: SidebarView; label: string; icon: string }[] = [
  { id: 'explorer', label: 'Explorer', icon: '📁' },
  { id: 'search', label: 'Search', icon: '🔍' },
]

export default function ActivityBar() {
  const dispatch = useDispatch()
  const sidebarOpen = useSelector((state: RootState) => state.workspace.sidebarOpen)
  const activeSidebarView = useSelector(
    (state: RootState) => state.workspace.activeSidebarView,
  )

  function handleViewClick(viewId: SidebarView) {
    if (sidebarOpen && activeSidebarView === viewId) {
      dispatch(toggleSidebar())
    } else {
      dispatch(setSidebarView(viewId))
    }
  }

  return (
    <div className={styles.activityBar}>
      {VIEWS.map((view) => (
        <button
          key={view.id}
          className={`${styles.iconButton} ${sidebarOpen && activeSidebarView === view.id ? styles.active : ''}`}
          onClick={() => handleViewClick(view.id)}
          title={view.label}
        >
          <span>{view.icon}</span>
          <span className={styles.tooltip}>{view.label}</span>
        </button>
      ))}
    </div>
  )
}
