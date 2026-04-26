import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { addFile, addFolder } from '../../store/fileTreeSlice'
import FileTree from './FileTree'
import styles from './SidePanel.module.css'

function ExplorerPanel() {
  const dispatch = useDispatch()

  function handleNewFile() {
    const name = window.prompt('New file name:')
    if (name?.trim()) {
      dispatch(addFile({ parentId: null, name: name.trim() }))
    }
  }

  function handleNewFolder() {
    const name = window.prompt('New folder name:')
    if (name?.trim()) {
      dispatch(addFolder({ parentId: null, name: name.trim() }))
    }
  }

  return (
    <div className={styles.sidePanel}>
      <div className={styles.header}>
        <span>Explorer</span>
        <div className={styles.headerActions}>
          <button
            className={styles.headerAction}
            onClick={handleNewFile}
            title="New File"
          >
            +
          </button>
          <button
            className={styles.headerAction}
            onClick={handleNewFolder}
            title="New Folder"
          >
            🗂
          </button>
        </div>
      </div>
      <div className={styles.content}>
        <FileTree />
      </div>
    </div>
  )
}

function SearchPanel() {
  return (
    <div className={styles.sidePanel}>
      <div className={styles.header}>
        <span>Search</span>
      </div>
      <div className={styles.content}>
        <div
          style={{
            padding: '12px 16px',
            color: '#9a9a9a',
            fontSize: '13px',
          }}
        >
          Search coming soon...
        </div>
      </div>
    </div>
  )
}

export default function SidePanel() {
  const activeSidebarView = useSelector(
    (state: RootState) => state.workspace.activeSidebarView,
  )

  switch (activeSidebarView) {
    case 'explorer':
      return <ExplorerPanel />
    case 'search':
      return <SearchPanel />
    default:
      return <ExplorerPanel />
  }
}
