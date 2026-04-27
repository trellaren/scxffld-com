import { useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import {
  closeSettings,
  updateTheme,
  addPlugin,
  updatePlugin,
  removePlugin,
  addUser,
  updateUser,
  removeUser,
  addTeam,
  updateTeam,
  removeTeam,
  addRepository,
  updateRepository,
  removeRepository,
  loadSettingsFromJson,
} from '../../store/settingsSlice'
import type {
  AppSettings,
  PluginEntry,
  UserRecord,
  TeamRecord,
  RepositoryRecord,
  RepositoryType,
} from '../../store/settingsSlice'
import styles from './SettingsModal.module.css'

type TabId = 'plugins' | 'themes' | 'users' | 'teams' | 'repositories'

const TABS: { id: TabId; label: string }[] = [
  { id: 'plugins', label: 'Plugins' },
  { id: 'themes', label: 'Themes' },
  { id: 'users', label: 'Users' },
  { id: 'teams', label: 'Teams' },
  { id: 'repositories', label: 'Repositories' },
]

const REPO_TYPES: { value: RepositoryType; label: string }[] = [
  { value: 'git', label: 'Git Repository' },
  { value: 'filestore', label: 'File Store' },
  { value: 'database', label: 'DB Connection' },
  { value: 'versioning', label: 'Versioning' },
]

const BUILT_IN_THEMES = [
  {
    id: 'dark',
    label: 'Dark',
    barColor: '#323233',
    bodyColor: '#1e1e1e',
  },
  {
    id: 'light',
    label: 'Light',
    barColor: '#dddddd',
    bodyColor: '#f3f3f3',
  },
  {
    id: 'hc-dark',
    label: 'High Contrast Dark',
    barColor: '#000000',
    bodyColor: '#000000',
  },
  {
    id: 'hc-light',
    label: 'High Contrast Light',
    barColor: '#ffffff',
    bodyColor: '#ffffff',
  },
  {
    id: 'unicorn',
    label: 'Unicorn Poop',
    barColor: '#4a1a6a',
    bodyColor: '#1a0a2e',
  },
  {
    id: 'blue',
    label: 'Blue',
    barColor: '#0f2244',
    bodyColor: '#0a1628',
  },
  {
    id: 'purple',
    label: 'Purple',
    barColor: '#281260',
    bodyColor: '#1a0a2e',
  },
  {
    id: 'red',
    label: 'Red',
    barColor: '#440e0e',
    bodyColor: '#1a0808',
  },
]

function persistSettings(settings: AppSettings) {
  try {
    localStorage.setItem('scxffld:settings', JSON.stringify(settings))
  } catch {
    // ignore
  }
}

// ─── Sub-tab components ───────────────────────────────────────────────────────

function PluginsTab() {
  const dispatch = useDispatch()
  const plugins = useSelector((state: RootState) => state.settings.settings.plugins)
  const [newName, setNewName] = useState('')

  function handleToggle(plugin: PluginEntry) {
    dispatch(updatePlugin({ ...plugin, enabled: !plugin.enabled }))
  }

  function handleRemove(id: string) {
    dispatch(removePlugin(id))
  }

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    dispatch(addPlugin({ name, enabled: true, config: {} }))
    setNewName('')
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Plugins</div>

      <div className={styles.listContainer}>
        {plugins.length === 0 && (
          <div className={styles.emptyState}>No plugins configured.</div>
        )}
        {plugins.map((plugin) => (
          <div key={plugin.id} className={styles.listItem}>
            <label className={styles.toggleSwitch}>
              <input
                className={styles.toggleInput}
                type="checkbox"
                checked={plugin.enabled}
                onChange={() => handleToggle(plugin)}
              />
              <span className={styles.toggleTrack} />
              <span className={styles.toggleThumb} />
            </label>
            <span className={styles.listItemName}>{plugin.name}</span>
            <div className={styles.listItemActions}>
              <button className={styles.buttonDanger} onClick={() => handleRemove(plugin.id)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.addForm}>
        <div className={styles.addFormTitle}>Add Plugin</div>
        <div className={styles.addFormRow}>
          <input
            className={styles.fieldInput}
            type="text"
            placeholder="Plugin name or identifier"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className={styles.addFormActions}>
          <button className={styles.buttonSmall} onClick={handleAdd} disabled={!newName.trim()}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

function ThemesTab() {
  const dispatch = useDispatch()
  const activeTheme = useSelector(
    (state: RootState) => state.settings.settings.theme.activeTheme,
  )

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Color Theme</div>
      <div className={styles.themeGrid}>
        {BUILT_IN_THEMES.map((theme) => (
          <div
            key={theme.id}
            className={`${styles.themeCard} ${activeTheme === theme.id ? styles.themeCardActive : ''}`}
            onClick={() => dispatch(updateTheme({ activeTheme: theme.id }))}
            title={theme.label}
          >
            <div className={styles.themePreview}>
              <div className={styles.themePreviewBar} style={{ backgroundColor: theme.barColor }} />
              <div className={styles.themePreviewBody} style={{ backgroundColor: theme.bodyColor }} />
            </div>
            <div className={styles.themeCardLabel}>{theme.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UsersTab() {
  const dispatch = useDispatch()
  const users = useSelector((state: RootState) => state.settings.settings.users)
  const [form, setForm] = useState({ username: '', displayName: '', role: 'viewer' })
  const [editingId, setEditingId] = useState<string | null>(null)

  function handleAdd() {
    if (!form.username.trim()) return
    dispatch(addUser(form))
    setForm({ username: '', displayName: '', role: 'viewer' })
  }

  function handleEdit(user: UserRecord) {
    setEditingId(user.id)
    setForm({ username: user.username, displayName: user.displayName, role: user.role })
  }

  function handleSaveEdit(id: string) {
    dispatch(updateUser({ id, ...form }))
    setEditingId(null)
    setForm({ username: '', displayName: '', role: 'viewer' })
  }

  function handleCancel() {
    setEditingId(null)
    setForm({ username: '', displayName: '', role: 'viewer' })
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Users</div>

      <div className={styles.listContainer}>
        {users.length === 0 && (
          <div className={styles.emptyState}>No users configured.</div>
        )}
        {users.map((user) =>
          editingId === user.id ? (
            <div key={user.id} className={styles.addForm}>
              <div className={styles.addFormRow}>
                <input
                  className={styles.fieldInput}
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                />
                <input
                  className={styles.fieldInput}
                  placeholder="Display Name"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                />
                <select
                  className={styles.fieldSelect}
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div className={styles.addFormActions}>
                <button className={styles.buttonSecondary} onClick={handleCancel}>
                  Cancel
                </button>
                <button className={styles.buttonSmall} onClick={() => handleSaveEdit(user.id)}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div key={user.id} className={styles.listItem}>
              <span className={styles.listItemName}>{user.displayName || user.username}</span>
              <span className={styles.listItemMeta}>{user.username}</span>
              <span className={styles.listItemMeta}>{user.role}</span>
              <div className={styles.listItemActions}>
                <button className={styles.buttonSmall} onClick={() => handleEdit(user)}>
                  Edit
                </button>
                <button className={styles.buttonDanger} onClick={() => dispatch(removeUser(user.id))}>
                  Remove
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {editingId === null && (
        <div className={styles.addForm}>
          <div className={styles.addFormTitle}>Add User</div>
          <div className={styles.addFormRow}>
            <input
              className={styles.fieldInput}
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              className={styles.fieldInput}
              placeholder="Display Name"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            />
            <select
              className={styles.fieldSelect}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className={styles.addFormActions}>
            <button
              className={styles.buttonSmall}
              onClick={handleAdd}
              disabled={!form.username.trim()}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TeamsTab() {
  const dispatch = useDispatch()
  const teams = useSelector((state: RootState) => state.settings.settings.teams)
  const users = useSelector((state: RootState) => state.settings.settings.users)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    dispatch(addTeam({ name, members: [] }))
    setNewName('')
  }

  function handleEdit(team: TeamRecord) {
    setEditingId(team.id)
    setEditName(team.name)
  }

  function handleSaveEdit(team: TeamRecord) {
    dispatch(updateTeam({ ...team, name: editName.trim() || team.name }))
    setEditingId(null)
  }

  function handleToggleMember(team: TeamRecord, userId: string) {
    const members = team.members.includes(userId)
      ? team.members.filter((m) => m !== userId)
      : [...team.members, userId]
    dispatch(updateTeam({ ...team, members }))
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Teams</div>

      <div className={styles.listContainer}>
        {teams.length === 0 && (
          <div className={styles.emptyState}>No teams configured.</div>
        )}
        {teams.map((team) => (
          <div key={team.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div className={styles.listItem}>
              {editingId === team.id ? (
                <input
                  className={styles.fieldInput}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(team)}
                  autoFocus
                  style={{ flex: 1 }}
                />
              ) : (
                <span className={styles.listItemName}>{team.name}</span>
              )}
              <span className={styles.listItemMeta}>{team.members.length} member(s)</span>
              <div className={styles.listItemActions}>
                {editingId === team.id ? (
                  <>
                    <button
                      className={styles.buttonSecondary}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                    <button className={styles.buttonSmall} onClick={() => handleSaveEdit(team)}>
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button className={styles.buttonSmall} onClick={() => handleEdit(team)}>
                      Edit
                    </button>
                    <button
                      className={styles.buttonDanger}
                      onClick={() => dispatch(removeTeam(team.id))}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
            {users.length > 0 && (
              <div style={{ paddingLeft: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {users.map((u) => (
                  <label
                    key={u.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: '#aaaaaa',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={team.members.includes(u.id)}
                      onChange={() => handleToggleMember(team, u.id)}
                    />
                    {u.displayName || u.username}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.addForm}>
        <div className={styles.addFormTitle}>Add Team</div>
        <div className={styles.addFormRow}>
          <input
            className={styles.fieldInput}
            type="text"
            placeholder="Team name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className={styles.addFormActions}>
          <button className={styles.buttonSmall} onClick={handleAdd} disabled={!newName.trim()}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

function RepositoriesTab() {
  const dispatch = useDispatch()
  const repositories = useSelector((state: RootState) => state.settings.settings.repositories)
  const [form, setForm] = useState<{ name: string; type: RepositoryType; url: string }>({
    name: '',
    type: 'git',
    url: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  function handleAdd() {
    if (!form.name.trim()) return
    dispatch(addRepository(form))
    setForm({ name: '', type: 'git', url: '' })
  }

  function handleEdit(repo: RepositoryRecord) {
    setEditingId(repo.id)
    setForm({ name: repo.name, type: repo.type, url: repo.url })
  }

  function handleSaveEdit(id: string) {
    dispatch(updateRepository({ id, ...form }))
    setEditingId(null)
    setForm({ name: '', type: 'git', url: '' })
  }

  function handleCancel() {
    setEditingId(null)
    setForm({ name: '', type: 'git', url: '' })
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Repositories / File Store / DB Connections / Versioning</div>

      <div className={styles.listContainer}>
        {repositories.length === 0 && (
          <div className={styles.emptyState}>No repositories configured.</div>
        )}
        {repositories.map((repo) =>
          editingId === repo.id ? (
            <div key={repo.id} className={styles.addForm}>
              <div className={styles.addFormRow}>
                <input
                  className={styles.fieldInput}
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                <select
                  className={styles.fieldSelect}
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RepositoryType }))}
                >
                  {REPO_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <input
                  className={styles.fieldInput}
                  placeholder="URL / Connection string"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                />
              </div>
              <div className={styles.addFormActions}>
                <button className={styles.buttonSecondary} onClick={handleCancel}>
                  Cancel
                </button>
                <button className={styles.buttonSmall} onClick={() => handleSaveEdit(repo.id)}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div key={repo.id} className={styles.listItem}>
              <span className={styles.listItemName}>{repo.name}</span>
              <span className={styles.listItemMeta}>
                {REPO_TYPES.find((t) => t.value === repo.type)?.label ?? repo.type}
              </span>
              <span className={styles.listItemMeta} style={{ maxWidth: 160 }}>
                {repo.url}
              </span>
              <div className={styles.listItemActions}>
                <button className={styles.buttonSmall} onClick={() => handleEdit(repo)}>
                  Edit
                </button>
                <button
                  className={styles.buttonDanger}
                  onClick={() => dispatch(removeRepository(repo.id))}
                >
                  Remove
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {editingId === null && (
        <div className={styles.addForm}>
          <div className={styles.addFormTitle}>Add Connection</div>
          <div className={styles.addFormRow}>
            <input
              className={styles.fieldInput}
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <select
              className={styles.fieldSelect}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as RepositoryType }))}
            >
              {REPO_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              className={styles.fieldInput}
              placeholder="URL / Connection string"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            />
          </div>
          <div className={styles.addFormActions}>
            <button
              className={styles.buttonSmall}
              onClick={handleAdd}
              disabled={!form.name.trim()}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function SettingsModal() {
  const dispatch = useDispatch()
  const settings = useSelector((state: RootState) => state.settings.settings)
  const [activeTab, setActiveTab] = useState<TabId>('plugins')
  const importRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    dispatch(closeSettings())
  }

  function handleSave() {
    persistSettings(settings)
    dispatch(closeSettings())
  }

  function handleExport() {
    const json = JSON.stringify(settings, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scxffld-settings.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    importRef.current?.click()
  }

  function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string) as unknown

        // Validate the imported object before applying it to guard against
        // malicious JSON files that could inject unexpected data.
        if (
          parsed === null ||
          typeof parsed !== 'object' ||
          Array.isArray(parsed)
        ) {
          return
        }

        const raw = parsed as Record<string, unknown>

        // Validate aiApi sub-object
        const aiApi = raw.aiApi
        if (
          aiApi !== undefined && (
            typeof aiApi !== 'object' ||
            aiApi === null ||
            Array.isArray(aiApi)
          )
        ) {
          return
        }

        // Validate plugins is an array (if present)
        if (raw.plugins !== undefined && !Array.isArray(raw.plugins)) {
          return
        }

        // Validate theme sub-object (if present)
        const theme = raw.theme
        if (
          theme !== undefined && (
            typeof theme !== 'object' ||
            theme === null ||
            Array.isArray(theme)
          )
        ) {
          return
        }

        // Validate users/teams/repositories are arrays (if present)
        if (raw.users !== undefined && !Array.isArray(raw.users)) { return }
        if (raw.teams !== undefined && !Array.isArray(raw.teams)) { return }
        if (raw.repositories !== undefined && !Array.isArray(raw.repositories)) { return }

        dispatch(loadSettingsFromJson(raw as unknown as AppSettings))
      } catch {
        // ignore malformed JSON
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Settings</span>
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <nav className={styles.sidebar}>
            {TABS.map((tab) => (
              <div
                key={tab.id}
                className={`${styles.sidebarItem} ${activeTab === tab.id ? styles.sidebarItemActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </div>
            ))}
          </nav>

          <div className={styles.content}>
            {activeTab === 'plugins' && <PluginsTab />}
            {activeTab === 'themes' && <ThemesTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'teams' && <TeamsTab />}
            {activeTab === 'repositories' && <RepositoriesTab />}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportChange}
            />
            <button className={styles.buttonSecondary} onClick={handleImportClick}>
              Import…
            </button>
            <button className={styles.buttonSecondary} onClick={handleExport}>
              Export
            </button>
          </div>
          <div className={styles.footerRight}>
            <button className={styles.buttonSecondary} onClick={handleClose}>
              Cancel
            </button>
            <button className={styles.buttonPrimary} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
