'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

export type FileMeta = {
  $id: string
  filename: string
  originalFilename?: string
  mimeType: string
  size: number
  uploadedAt: string
  expiresAt?: string
  isPermanent?: boolean
  storageFileId?: string
}

type ViewMode = 'gallery' | 'list'

function humanSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function fileIcon(mimeType: string): string {
  if (!mimeType) return '📁'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return '📊'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️'
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('tar')) return '🗜️'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.startsWith('text/')) return '📄'
  return '📁'
}

function daysUntil(date: string): number {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

// ─── Delete confirmation modal ────────────────────────────────────────────────
function DeleteModal({
  filename,
  onConfirm,
  onCancel,
}: {
  filename: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="file-modal-backdrop" onClick={onCancel}>
      <div className="file-modal" role="dialog" aria-modal="true" aria-label="Delete file" onClick={(e) => e.stopPropagation()}>
        <h3 className="file-modal-title">Delete file?</h3>
        <p className="file-modal-body">
          <strong>{filename}</strong> will be permanently removed from storage. This action cannot be undone.
        </p>
        <div className="file-modal-actions">
          <Button variant="quiet" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Rename modal ─────────────────────────────────────────────────────────────
function RenameModal({
  current,
  onConfirm,
  onCancel,
}: {
  current: string
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(current)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.select() }, [])

  return (
    <div className="file-modal-backdrop" onClick={onCancel}>
      <div className="file-modal" role="dialog" aria-modal="true" aria-label="Rename file" onClick={(e) => e.stopPropagation()}>
        <h3 className="file-modal-title">Rename file</h3>
        <input
          ref={inputRef}
          className="file-modal-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(value.trim())
            if (e.key === 'Escape') onCancel()
          }}
          autoFocus
        />
        <div className="file-modal-actions">
          <Button variant="quiet" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={() => onConfirm(value.trim())} disabled={!value.trim()}>Save</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Full File Preview Modal ─────────────────────────────────────────────────
function FileViewerModal({
  file,
  onClose,
}: {
  file: FileMeta
  onClose: () => void
}) {
  const isImage = file.mimeType.startsWith('image/')
  const isPdf = file.mimeType === 'application/pdf'
  const isVideo = file.mimeType.startsWith('video/')
  const isAudio = file.mimeType.startsWith('audio/')
  const previewSrc = `/api/files/preview/${file.$id}`
  const viewSrc = `/api/files/preview/${file.$id}?view=1`
  const downloadSrc = `/api/files/preview/${file.$id}?download=1`

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="file-modal-backdrop" onClick={onClose}>
      <div className="file-viewer-modal" role="dialog" aria-modal="true" aria-label="File Preview" onClick={(e) => e.stopPropagation()}>
        <div className="file-viewer-header">
          <div className="file-viewer-title-box">
            <span className="file-viewer-icon" aria-hidden>{fileIcon(file.mimeType)}</span>
            <div>
              <h3 className="file-viewer-title" title={file.filename}>{file.filename}</h3>
              <p className="file-viewer-sub">{humanSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="file-viewer-actions">
            <a href={downloadSrc} download={file.filename} className="button button-quiet file-viewer-btn" title="Download">
              ⬇ Download
            </a>
            <a href={viewSrc} target="_blank" rel="noopener noreferrer" className="button button-quiet file-viewer-btn" title="Open in new tab">
              ↗ Open
            </a>
            <button className="icon-button file-viewer-close" onClick={onClose} aria-label="Close preview">
              ✕
            </button>
          </div>
        </div>

        <div className="file-viewer-content">
          {isImage ? (
            <div className="file-viewer-image-wrap">
              <img src={viewSrc} alt={file.filename} className="file-viewer-img" />
            </div>
          ) : isPdf ? (
            <iframe src={viewSrc} title={file.filename} className="file-viewer-iframe" />
          ) : isVideo ? (
            <div className="file-viewer-media-wrap">
              <video src={viewSrc} controls autoPlay className="file-viewer-video" />
            </div>
          ) : isAudio ? (
            <div className="file-viewer-audio-wrap">
              <span className="file-viewer-large-icon" aria-hidden>🎵</span>
              <audio src={viewSrc} controls className="file-viewer-audio" />
            </div>
          ) : (
            <div className="file-viewer-fallback">
              <span className="file-viewer-large-icon" aria-hidden>{fileIcon(file.mimeType)}</span>
              <p className="file-viewer-fallback-name">{file.filename}</p>
              <p className="file-viewer-fallback-meta">{file.mimeType} · {humanSize(file.size)}</p>
              <a href={downloadSrc} download={file.filename} className="button button-primary">
                Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── File Card (Gallery View) ────────────────────────────────────────────────
function FileCard({
  file,
  onDelete,
  onRename,
  onMakePermanent,
  onRestore,
  onPreview,
}: {
  file: FileMeta
  onDelete: (id: string) => void
  onRename: (id: string, current: string) => void
  onMakePermanent: (id: string) => void
  onRestore: (id: string) => void
  onPreview: (file: FileMeta) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const canHaveThumbnail = (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') && !imgError
  const expiresIn = file.expiresAt ? daysUntil(file.expiresAt) : null
  const expiryWarning = !file.isPermanent && expiresIn !== null && expiresIn < 7

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <article className="fc" onClick={() => onPreview(file)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onPreview(file) }}>
      <div className="fc-preview">
        {canHaveThumbnail ? (
          <img
            src={`/api/files/preview/${file.$id}`}
            alt={file.filename}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="fc-icon" aria-hidden>{fileIcon(file.mimeType)}</span>
        )}
      </div>
      <div className="fc-body">
        <div className="fc-top">
          <p className="fc-name" title={file.filename}>{file.filename}</p>
          <div className="fc-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              className="icon-button fc-dots"
              aria-label="File options"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              •••
            </button>
            {menuOpen && (
              <div className="fc-dropdown" role="menu">
                <button role="menuitem" onClick={() => { setMenuOpen(false); onPreview(file) }}>
                  Preview
                </button>
                <a
                  role="menuitem"
                  href={`/api/files/preview/${file.$id}?download=1`}
                  download={file.filename}
                  className="fc-dropdown-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Download
                </a>
                <button role="menuitem" onClick={() => { setMenuOpen(false); onRename(file.$id, file.filename) }}>
                  Rename
                </button>
                {!file.isPermanent ? (
                  <button role="menuitem" onClick={() => { setMenuOpen(false); onMakePermanent(file.$id) }}>
                    Make permanent
                  </button>
                ) : (
                  <button role="menuitem" onClick={() => { setMenuOpen(false); onRestore(file.$id) }}>
                    Restore expiration
                  </button>
                )}
                <div className="fc-dropdown-divider" />
                <button role="menuitem" className="fc-dropdown-danger" onClick={() => { setMenuOpen(false); onDelete(file.$id) }}>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="fc-meta">{humanSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}</p>
        <div className="fc-badges">
          {file.isPermanent ? (
            <span className="fbadge fbadge-permanent">Permanent</span>
          ) : expiresIn !== null ? (
            <span className={`fbadge ${expiryWarning ? 'fbadge-warn' : ''}`}>Expires in {expiresIn}d</span>
          ) : (
            <span className="fbadge">Temporary</span>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── File Row (List View) ────────────────────────────────────────────────────
function FileRow({
  file,
  onDelete,
  onRename,
  onMakePermanent,
  onRestore,
  onPreview,
}: {
  file: FileMeta
  onDelete: (id: string) => void
  onRename: (id: string, current: string) => void
  onMakePermanent: (id: string) => void
  onRestore: (id: string) => void
  onPreview: (file: FileMeta) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const expiresIn = file.expiresAt ? daysUntil(file.expiresAt) : null
  const expiryWarning = !file.isPermanent && expiresIn !== null && expiresIn < 7

  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div className="fr" onClick={() => onPreview(file)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onPreview(file) }}>
      <span className="fr-icon" aria-hidden>{fileIcon(file.mimeType)}</span>
      <div className="fr-info">
        <span className="fr-name" title={file.filename}>{file.filename}</span>
        <span className="fr-sub">{humanSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}</span>
      </div>
      <div className="fc-badges fr-badges">
        {file.isPermanent ? (
          <span className="fbadge fbadge-permanent">Permanent</span>
        ) : expiresIn !== null ? (
          <span className={`fbadge ${expiryWarning ? 'fbadge-warn' : ''}`}>Expires {expiresIn}d</span>
        ) : (
          <span className="fbadge">Temporary</span>
        )}
      </div>
      <div className="fc-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button className="icon-button fc-dots" aria-label="File options" onClick={() => setMenuOpen((v) => !v)}>•••</button>
        {menuOpen && (
          <div className="fc-dropdown" role="menu">
            <button role="menuitem" onClick={() => { setMenuOpen(false); onPreview(file) }}>
              Preview
            </button>
            <a
              role="menuitem"
              href={`/api/files/preview/${file.$id}?download=1`}
              download={file.filename}
              className="fc-dropdown-link"
              onClick={() => setMenuOpen(false)}
            >
              Download
            </a>
            <button role="menuitem" onClick={() => { setMenuOpen(false); onRename(file.$id, file.filename) }}>Rename</button>
            {!file.isPermanent ? (
              <button role="menuitem" onClick={() => { setMenuOpen(false); onMakePermanent(file.$id) }}>Make permanent</button>
            ) : (
              <button role="menuitem" onClick={() => { setMenuOpen(false); onRestore(file.$id) }}>Restore expiration</button>
            )}
            <div className="fc-dropdown-divider" />
            <button role="menuitem" className="fc-dropdown-danger" onClick={() => { setMenuOpen(false); onDelete(file.$id) }}>Delete</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Files Page ─────────────────────────────────────────────────────────
export default function FilesPage() {
  const [files, setFiles] = useState<FileMeta[] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [view, setView] = useState<ViewMode>('gallery')
  const [previewTarget, setPreviewTarget] = useState<FileMeta | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FileMeta | null>(null)
  const [renameTarget, setRenameTarget] = useState<{ id: string; current: string } | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const toast = useToast()

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files', { cache: 'no-store' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to load files')
      }
      const data = await res.json()
      setFiles(Array.isArray(data) ? data : data.documents || [])
    } catch (err: any) {
      toast.notify(err.message || 'Error loading files', 'error')
      setFiles([])
    }
  }, [toast])

  useEffect(() => {
    // This is a client-only data hydration effect; the fetch is intentionally triggered once per mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchFiles()
  }, [fetchFiles])

  const uploadFile = useCallback((file: File) => {
    setUploading(true)
    setProgress(0)
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100))
    }
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        setUploading(false)
        setProgress(0)
        if (xhr.status >= 200 && xhr.status < 300) {
          toast.notify('File uploaded successfully', 'success')
          fetchFiles()
        } else {
          try {
            const json = JSON.parse(xhr.responseText)
            toast.notify(json.error || 'Upload failed', 'error')
          } catch {
            toast.notify('Upload failed', 'error')
          }
        }
      }
    }
    const fd = new FormData()
    fd.append('fileId', 'unique()')
    fd.append('file', file)
    xhr.open('POST', '/api/files')
    xhr.setRequestHeader('x-file-name', encodeURIComponent(file.name))
    xhr.setRequestHeader('x-file-size', String(file.size))
    xhr.setRequestHeader('x-file-type', file.type || 'application/octet-stream')
    xhr.send(fd)
  }, [fetchFiles, toast])

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragOver(true) }
  function onDragLeave() { setIsDragOver(false) }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) uploadFile(f)
  }
  function onBrowse() { inputRef.current?.click() }
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) uploadFile(f)
    e.target.value = ''
  }

  async function confirmDelete(id: string) {
    setDeleteTarget(null)
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.notify('File deleted', 'success')
      fetchFiles()
    } catch (err: any) {
      toast.notify(err.message || 'Delete failed', 'error')
    }
  }

  async function confirmRename(id: string, name: string) {
    setRenameTarget(null)
    if (!name) return
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        throw new Error(j?.error || 'Rename failed')
      }
      toast.notify('Renamed successfully', 'success')
      fetchFiles()
    } catch (err: any) {
      toast.notify(err.message || 'Rename failed', 'error')
    }
  }

  async function handleMakePermanent(id: string) {
    try {
      const res = await fetch(`/api/files/${id}/make-permanent`, { method: 'POST' })
      if (!res.ok) throw new Error('Operation failed')
      toast.notify('Marked as permanent', 'success')
      fetchFiles()
    } catch (err: any) {
      toast.notify(err.message || 'Operation failed', 'error')
    }
  }

  async function handleRestore(id: string) {
    try {
      const res = await fetch(`/api/files/${id}/restore-expiration`, { method: 'POST' })
      if (!res.ok) throw new Error('Operation failed')
      toast.notify('Expiration restored (30 days)', 'success')
      fetchFiles()
    } catch (err: any) {
      toast.notify(err.message || 'Operation failed', 'error')
    }
  }

  const totalUsed = files ? files.reduce((s, f) => s + (f.size || 0), 0) : 0
  const maxTotal = 500 * 1024 * 1024
  const usagePercent = Math.min(100, Math.round((totalUsed / maxTotal) * 100))
  const remaining = Math.max(0, maxTotal - totalUsed)

  return (
    <AppShell>
      {/* Hidden native file input for accessibility */}
      <input ref={inputRef} type="file" className="sr-only" onChange={onChange} tabIndex={-1} aria-hidden />

      {/* Modals */}
      {previewTarget && (
        <FileViewerModal
          file={previewTarget}
          onClose={() => setPreviewTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          filename={deleteTarget.filename}
          onConfirm={() => confirmDelete(deleteTarget.$id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {renameTarget && (
        <RenameModal
          current={renameTarget.current}
          onConfirm={(name) => confirmRename(renameTarget.id, name)}
          onCancel={() => setRenameTarget(null)}
        />
      )}

      <div className="files-page">
        {/* ─── Page Header ───────────────────────────────────────────── */}
        <div className="files-header">
          <div>
            <h1 className="files-title">Files</h1>
            <p className="files-subtitle">Upload, preview, and manage your study resources</p>
          </div>
          <Button variant="primary" onClick={onBrowse} disabled={uploading}>
            {uploading ? `Uploading ${progress}%…` : '+ Upload file'}
          </Button>
        </div>

        {/* ─── Storage Quota Card ────────────────────────────────────── */}
        <div className="storage-card">
          <div className="storage-card-top">
            <div>
              <p className="storage-label">Storage Quota</p>
              <p className="storage-used">{humanSize(totalUsed)} <span>of {humanSize(maxTotal)}</span></p>
            </div>
            <p className="storage-remaining">{remaining === 0 ? 'Quota full' : `${humanSize(remaining)} free`}</p>
          </div>
          <div className="storage-bar-track">
            <div
              className={`storage-bar-fill${usagePercent >= 90 ? ' storage-bar-danger' : usagePercent >= 70 ? ' storage-bar-warn' : ''}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>

        {/* ─── Drop Zone ─────────────────────────────────────────────── */}
        <div
          className={`drop-zone${isDragOver ? ' drop-zone-active' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onBrowse}
          role="button"
          tabIndex={0}
          aria-label="Upload area — drag and drop a file or click to browse"
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onBrowse() }}
        >
          <div className="drop-zone-inner">
            <span className="drop-zone-icon" aria-hidden>☁️</span>
            <p className="drop-zone-text">
              {isDragOver ? 'Drop file to upload' : 'Drag & drop a file here'}
            </p>
            <p className="drop-zone-sub">
              or <button type="button" className="drop-zone-link" onClick={(e) => { e.stopPropagation(); onBrowse() }}>browse files</button>
            </p>
          </div>
          {uploading && (
            <div className="drop-zone-progress">
              <div className="drop-zone-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* ─── Files Section Controls ─────────────────────────────────── */}
        <div className="files-section-head">
          <p className="files-count">
            {files === null ? 'Loading files…' : `${files.length} file${files.length !== 1 ? 's' : ''}`}
          </p>
          <div className="view-toggle" role="group" aria-label="View mode">
            <button
              className={`view-btn${view === 'gallery' ? ' view-btn-active' : ''}`}
              onClick={() => setView('gallery')}
              aria-pressed={view === 'gallery'}
              title="Gallery view"
            >
              ⊞
            </button>
            <button
              className={`view-btn${view === 'list' ? ' view-btn-active' : ''}`}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              title="List view"
            >
              ≡
            </button>
          </div>
        </div>

        {/* ─── Files Gallery / List View ──────────────────────────────── */}
        {files === null ? (
          <div className={view === 'gallery' ? 'files-gallery' : 'files-list'}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={view === 'gallery' ? 'fc-skeleton' : 'fr-skeleton'} />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="files-empty">
            <span className="files-empty-icon" aria-hidden>📁</span>
            <p className="files-empty-title">No files uploaded yet</p>
            <p className="files-empty-sub">Upload notes, PDFs, assignments, or study media to keep them organized.</p>
          </div>
        ) : view === 'gallery' ? (
          <div className="files-gallery">
            {files.map((f) => (
              <FileCard
                key={f.$id}
                file={f}
                onDelete={(id) => setDeleteTarget(files.find((x) => x.$id === id) || null)}
                onRename={(id, current) => setRenameTarget({ id, current })}
                onMakePermanent={handleMakePermanent}
                onRestore={handleRestore}
                onPreview={setPreviewTarget}
              />
            ))}
          </div>
        ) : (
          <div className="files-list">
            {files.map((f) => (
              <FileRow
                key={f.$id}
                file={f}
                onDelete={(id) => setDeleteTarget(files.find((x) => x.$id === id) || null)}
                onRename={(id, current) => setRenameTarget({ id, current })}
                onMakePermanent={handleMakePermanent}
                onRestore={handleRestore}
                onPreview={setPreviewTarget}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
