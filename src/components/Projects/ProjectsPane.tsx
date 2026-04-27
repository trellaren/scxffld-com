import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { openFolder } from '../../store/workspaceSlice'
import type { FileEntry } from '../../store/workspaceSlice'
import styles from './ProjectsPane.module.css'

interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: string
  createFiles: (projectName: string) => FileEntry[]
}

const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start with a clean, empty project folder.',
    icon: '📁',
    createFiles: () => [],
  },
  {
    id: 'webapp',
    name: 'Web App',
    description: 'HTML, CSS, and JavaScript starter project.',
    icon: '🌐',
    createFiles: (name) => [
      { name: 'src', path: `${name}/src`, kind: 'folder', virtual: true },
      { name: 'index.html', path: `${name}/index.html`, kind: 'file', virtual: true },
      { name: 'styles.css', path: `${name}/src/styles.css`, kind: 'file', virtual: true },
      { name: 'app.js', path: `${name}/src/app.js`, kind: 'file', virtual: true },
      { name: 'README.md', path: `${name}/README.md`, kind: 'file', virtual: true },
    ],
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    description: 'Node.js application with a standard folder layout.',
    icon: '🟩',
    createFiles: (name) => [
      { name: 'src', path: `${name}/src`, kind: 'folder', virtual: true },
      { name: 'package.json', path: `${name}/package.json`, kind: 'file', virtual: true },
      { name: 'index.js', path: `${name}/src/index.js`, kind: 'file', virtual: true },
      { name: '.gitignore', path: `${name}/.gitignore`, kind: 'file', virtual: true },
      { name: 'README.md', path: `${name}/README.md`, kind: 'file', virtual: true },
    ],
  },
  {
    id: 'react',
    name: 'React App',
    description: 'React component-based front-end project.',
    icon: '⚛️',
    createFiles: (name) => [
      { name: 'src', path: `${name}/src`, kind: 'folder', virtual: true },
      { name: 'public', path: `${name}/public`, kind: 'folder', virtual: true },
      { name: 'package.json', path: `${name}/package.json`, kind: 'file', virtual: true },
      { name: 'index.html', path: `${name}/public/index.html`, kind: 'file', virtual: true },
      { name: 'App.tsx', path: `${name}/src/App.tsx`, kind: 'file', virtual: true },
      { name: 'main.tsx', path: `${name}/src/main.tsx`, kind: 'file', virtual: true },
      { name: 'README.md', path: `${name}/README.md`, kind: 'file', virtual: true },
    ],
  },
  {
    id: 'python',
    name: 'Python Script',
    description: 'Python project with a module and requirements file.',
    icon: '🐍',
    createFiles: (name) => [
      { name: 'src', path: `${name}/src`, kind: 'folder', virtual: true },
      { name: 'main.py', path: `${name}/src/main.py`, kind: 'file', virtual: true },
      { name: 'requirements.txt', path: `${name}/requirements.txt`, kind: 'file', virtual: true },
      { name: '.gitignore', path: `${name}/.gitignore`, kind: 'file', virtual: true },
      { name: 'README.md', path: `${name}/README.md`, kind: 'file', virtual: true },
    ],
  },
  {
    id: 'diagram',
    name: 'Diagram Project',
    description: 'Architecture or flow diagram workspace.',
    icon: '🔷',
    createFiles: (name) => [
      { name: 'diagrams', path: `${name}/diagrams`, kind: 'folder', virtual: true },
      { name: 'main.diagram', path: `${name}/diagrams/main.diagram`, kind: 'file', virtual: true },
      { name: 'README.md', path: `${name}/README.md`, kind: 'file', virtual: true },
    ],
  },
]

interface AddTemplateDialogProps {
  onAdd: (template: ProjectTemplate) => void
  onClose: () => void
}

function AddTemplateDialog({ onAdd, onClose }: AddTemplateDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📦')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Custom project template.',
      icon: icon || '📦',
      createFiles: () => [],
    })
  }

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <span className={styles.dialogTitle}>Add Project Template</span>
          <button className={styles.dialogClose} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className={styles.dialogBody} onSubmit={handleSubmit}>
          <div className={styles.dialogField}>
            <label className={styles.dialogLabel}>Icon (emoji)</label>
            <input
              className={styles.dialogInput}
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={2}
              placeholder="📦"
            />
          </div>
          <div className={styles.dialogField}>
            <label className={styles.dialogLabel}>Template Name</label>
            <input
              className={styles.dialogInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Template"
              autoFocus
            />
          </div>
          <div className={styles.dialogField}>
            <label className={styles.dialogLabel}>Description</label>
            <input
              className={styles.dialogInput}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this template."
            />
          </div>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={!name.trim()}>Add Template</button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface CreateProjectDialogProps {
  template: ProjectTemplate
  onConfirm: (projectName: string) => void
  onClose: () => void
}

function CreateProjectDialog({ template, onConfirm, onClose }: CreateProjectDialogProps) {
  const [projectName, setProjectName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = projectName.trim()
    if (!name) return
    onConfirm(name)
  }

  return (
    <div className={styles.dialogOverlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogHeader}>
          <span className={styles.dialogTitle}>
            {template.icon} New {template.name}
          </span>
          <button className={styles.dialogClose} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className={styles.dialogBody} onSubmit={handleSubmit}>
          <div className={styles.dialogField}>
            <label className={styles.dialogLabel}>Project Name</label>
            <input
              className={styles.dialogInput}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-project"
              autoFocus
            />
          </div>
          <div className={styles.dialogActions}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={!projectName.trim()}>
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProjectsPane() {
  const dispatch = useDispatch()
  const [search, setSearch] = useState('')
  const [customTemplates, setCustomTemplates] = useState<ProjectTemplate[]>([])
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates]

  const filtered = search.trim()
    ? allTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()),
      )
    : allTemplates

  function handleAddTemplate(template: ProjectTemplate) {
    setCustomTemplates((prev) => [...prev, template])
    setShowAddTemplate(false)
  }

  function handleCreateProject(projectName: string) {
    if (!selectedTemplate) return
    const name = projectName.trim()
    const files = selectedTemplate.createFiles(name)
    dispatch(openFolder({ name, files }))
    setSelectedTemplate(null)
  }

  const DEFAULT_IDS = new Set(DEFAULT_TEMPLATES.map((t) => t.id))

  function handleDeleteTemplate(id: string) {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button
          className={styles.addTemplateBtn}
          onClick={() => setShowAddTemplate(true)}
          title="Add a project template"
          aria-label="Add a project template"
        >
          <span className={styles.addTemplateBtnIcon}>＋</span>
          <span>Add Template</span>
        </button>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search templates"
          />
          {search && (
            <button
              className={styles.searchClear}
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={styles.templatesGrid}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>No templates match "{search}"</div>
        ) : (
          filtered.map((template) => (
            <div key={template.id} className={styles.templateCardWrapper}>
              <button
                className={styles.templateCard}
                onClick={() => setSelectedTemplate(template)}
              >
                <span className={styles.templateIcon}>{template.icon}</span>
                <span className={styles.templateName}>{template.name}</span>
                <span className={styles.templateDescription}>{template.description}</span>
              </button>
              {!DEFAULT_IDS.has(template.id) && (
                <button
                  className={styles.templateDeleteBtn}
                  onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id) }}
                  title="Delete template"
                  aria-label={`Delete ${template.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showAddTemplate && (
        <AddTemplateDialog onAdd={handleAddTemplate} onClose={() => setShowAddTemplate(false)} />
      )}

      {selectedTemplate && (
        <CreateProjectDialog
          template={selectedTemplate}
          onConfirm={handleCreateProject}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  )
}
