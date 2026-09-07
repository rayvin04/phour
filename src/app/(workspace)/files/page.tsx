'use client'

import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  ArchiveFileIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  FilmIcon,
  FolderIcon,
  GridIcon,
  ImageIcon,
  ListIcon,
  MoreHorizontalIcon,
  MusicIcon,
  UploadCloudIcon,
  XIcon,
} from '@/components/ui/icons'

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
type MenuPlacement = 'below' | 'above'

function useMenuPlacement(
  open: boolean,
  triggerRef: React.RefObject<HTMLDivElement | null>,
  menuRef: React.RefObject<HTMLDivElement | null>,
) {
  const [placement, setPlacement] = useState<MenuPlacement>('below')

  useEffect(() => {
    if (!open) return

    function measure() {
      const trigger = triggerRef.current?.getBoundingClientRect()
      const menu = menuRef.current
      if (!trigger || !menu) return

      const roomBelow = window.innerHeight - trigger.bottom - 12
      const roomAbove = trigger.top - 12
      const shouldFlip = menu.scrollHeight > roomBelow && roomAbove > roomBelow
      setPlacement(shouldFlip ? 'above' : 'below')
      menu.style.maxHeight = `${Math.max(120, Math.max(roomBelow, roomAbove))}px`
    }

    const frame = window.requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open, triggerRef, menuRef])

  return placement
}

function humanSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

function FileTypeIcon({
  mimeType,
  size = 18,
  className = '',
}: {
  mimeType: string
  size?: number
  className?: string
}) {
  if (!mimeType) return <FileTextIcon size={size} className={className} />
  if (mimeType.startsWith('image/')) return <ImageIcon size={size} className={className} />
  if (mimeType.startsWith('video/')) return <FilmIcon size={size} className={className} />
  if (mimeType.startsWith('audio/')) return <MusicIcon size={size} className={className} />
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('tar')) {
    return <ArchiveFileIcon size={size} className={className} />
  }
  return <FileTextIcon size={size} className={className} />
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
      <div
        className="file-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Delete file"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="file-modal-title">Delete file?</h3>
        <p className="file-modal-body">
          <strong>{filename}</strong> will be permanently removed from storage. This action cannot be undone.
        </p>
        <div className="file-modal-actions">
          <Button variant="quiet" onClick={onCancel} title="Keep file">
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} title="Permanently delete file">
            Delete
          </Button>
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
  useEffect(() => {
    inputRef.current?.select()
  }, [])

  return (
    <div className="file-modal-backdrop" onClick={onCancel}>
      <div
        className="file-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Rename file"
        onClick={(e) => e.stopPropagation()}
      >
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
          aria-label="New file name"
        />
        <div className="file-modal-actions">
          <Button variant="quiet" onClick={onCancel} title="Cancel rename">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(value.trim())}
            disabled={!value.trim()}
            title="Save new name"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

type ImageDrag = { x: number; y: number; panX: number; panY: number }

function FilePreviewContent({
  file,
  zoom,
  pan,
  dragRef,
  onPanChange,
}: {
  file: FileMeta
  zoom: number
  pan: { x: number; y: number }
  dragRef: React.MutableRefObject<ImageDrag | null>
  onPanChange: (pan: { x: number; y: number }) => void
}) {
  const isImage = file.mimeType.startsWith('image/')
  const isPdf = file.mimeType === 'application/pdf'
  const isText = file.mimeType.startsWith('text/') || /json|xml|javascript/.test(file.mimeType)
  const isVideo = file.mimeType.startsWith('video/')
  const isAudio = file.mimeType.startsWith('audio/')
  const viewSrc = `/api/files/preview/${file.$id}?view=1`
  const downloadSrc = `/api/files/preview/${file.$id}?download=1`

  if (isImage) {
    return (
      <div
        className={`file-viewer-image-wrap${zoom > 1 ? ' file-viewer-image-wrap--zoomed' : ''}`}
        onPointerDown={(event) => {
          if (zoom <= 1) return
          event.currentTarget.setPointerCapture(event.pointerId)
          dragRef.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current
          if (!drag) return
          onPanChange({ x: drag.panX + event.clientX - drag.x, y: drag.panY + event.clientY - drag.y })
        }}
        onPointerUp={() => { dragRef.current = null }}
        onPointerCancel={() => { dragRef.current = null }}
      >
        <img
          src={viewSrc}
          alt={file.filename}
          className="file-viewer-img"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          draggable={false}
        />
      </div>
    )
  }

  if (isPdf || isText) return <iframe src={viewSrc} title={file.filename} className="file-viewer-iframe" />
  if (isVideo) return <video src={viewSrc} controls autoPlay className="file-viewer-video" />
  if (isAudio) {
    return (
      <div className="file-viewer-audio-wrap">
        <span className="file-viewer-large-icon" aria-hidden="true"><MusicIcon size={48} /></span>
        <audio src={viewSrc} controls className="file-viewer-audio" />
      </div>
    )
  }

  return (
    <div className="file-viewer-fallback">
      <span className="file-viewer-large-icon" aria-hidden="true"><FileTypeIcon mimeType={file.mimeType} size={48} /></span>
      <p className="file-viewer-fallback-name">{file.filename}</p>
      <p className="file-viewer-fallback-meta">{file.mimeType} · {humanSize(file.size)}</p>
      <a href={downloadSrc} download={file.filename} className="button button-primary" title="Download file">
        <DownloadIcon size={15} />
        <span>Download file</span>
      </a>
    </div>
  )
}

// ─── Full File Preview Modal ─────────────────────────────────────────────────
function FileViewerModal({
  file,
  files,
  onNavigate,
  onClose,
}: {
  file: FileMeta
  files: FileMeta[]
  onNavigate: (file: FileMeta) => void
  onClose: () => void
}) {
  const isImage = file.mimeType.startsWith('image/')
  const viewSrc = `/api/files/preview/${file.$id}?view=1`
  const downloadSrc = `/api/files/preview/${file.$id}?download=1`
  const fileIndex = files.findIndex((item) => item.$id === file.$id)
  const canGoPrevious = fileIndex > 0
  const canGoNext = fileIndex >= 0 && fileIndex < files.length - 1
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<ImageDrag | null>(null)
  const [compareFile, setCompareFile] = useState<FileMeta | null>(null)
  const [compareZoom, setCompareZoom] = useState(1)
  const [comparePan, setComparePan] = useState({ x: 0, y: 0 })
  const compareDragRef = useRef<ImageDrag | null>(null)
  const compareBodyRef = useRef<HTMLDivElement>(null)
  const [splitPercent, setSplitPercent] = useState(50)

  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [file.$id])

  useEffect(() => {
    setCompareZoom(1)
    setComparePan({ x: 0, y: 0 })
  }, [compareFile?.$id])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && canGoPrevious) onNavigate(files[fileIndex - 1])
      if (e.key === 'ArrowRight' && canGoNext) onNavigate(files[fileIndex + 1])
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canGoNext, canGoPrevious, fileIndex, files, onClose, onNavigate])

  function changeZoom(nextZoom: number) {
    const clamped = Math.min(3, Math.max(1, nextZoom))
    setZoom(clamped)
    if (clamped === 1) setPan({ x: 0, y: 0 })
  }

  function openBeside() {
    const beside = files[fileIndex + 1] ?? files[fileIndex - 1]
    if (beside) setCompareFile(beside)
  }

  function changeCompareZoom(nextZoom: number) {
    const clamped = Math.min(3, Math.max(1, nextZoom))
    setCompareZoom(clamped)
    if (clamped === 1) setComparePan({ x: 0, y: 0 })
  }

  function resizeCompare(event: React.PointerEvent<HTMLDivElement>) {
    const body = compareBodyRef.current
    if (!body) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const vertical = window.matchMedia('(max-width: 640px)').matches
    const move = (moveEvent: PointerEvent) => {
      const bounds = body.getBoundingClientRect()
      const position = vertical ? moveEvent.clientY - bounds.top : moveEvent.clientX - bounds.left
      const size = vertical ? bounds.height : bounds.width
      setSplitPercent(Math.min(80, Math.max(20, (position / size) * 100)))
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop, { once: true })
  }

  function nudgeCompareSplit(delta: number) {
    setSplitPercent((current) => Math.min(80, Math.max(20, current + delta)))
  }

  return (
    <div className="file-modal-backdrop" onClick={onClose}>
      <div
        className="file-viewer-modal"
        role="dialog"
        aria-modal="true"
        aria-label="File Preview"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="file-viewer-header">
          <div className="file-viewer-title-box">
            <span className="file-viewer-icon" aria-hidden="true">
              <FileTypeIcon mimeType={file.mimeType} size={22} />
            </span>
            <div>
              <h3 className="file-viewer-title" title={file.filename}>
                {file.filename}
              </h3>
              <p className="file-viewer-sub">
                {humanSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="file-viewer-actions">
            {isImage && (
              <div className="file-viewer-zoom" aria-label="Image zoom controls">
                <button type="button" className="file-viewer-control" onClick={() => changeZoom(zoom - 0.25)} disabled={zoom <= 1} aria-label="Zoom out">−</button>
                <span aria-live="polite">{Math.round(zoom * 100)}%</span>
                <button type="button" className="file-viewer-control" onClick={() => changeZoom(zoom + 0.25)} disabled={zoom >= 3} aria-label="Zoom in">+</button>
              </div>
            )}
            {canGoPrevious && <button type="button" className="button button-quiet file-viewer-nav" onClick={() => onNavigate(files[fileIndex - 1])} aria-label="Previous file">←</button>}
            {canGoNext && <button type="button" className="button button-quiet file-viewer-nav" onClick={() => onNavigate(files[fileIndex + 1])} aria-label="Next file">→</button>}
            {!compareFile && files.length > 1 && (
              <button type="button" className="button button-quiet file-viewer-btn" onClick={openBeside} title="Open another file beside this preview">
                <span>Open beside</span>
              </button>
            )}
            <a
              href={downloadSrc}
              download={file.filename}
              className="button button-quiet file-viewer-btn"
              title="Download file"
            >
              <DownloadIcon size={14} />
              <span>Download</span>
            </a>
            <a
              href={viewSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-quiet file-viewer-btn"
              title="Open file in new tab"
            >
              <ExternalLinkIcon size={14} />
              <span>Open</span>
            </a>
            <button
              className="icon-button file-viewer-close"
              onClick={onClose}
              aria-label="Close preview"
              title="Close preview (Esc)"
              type="button"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        <div ref={compareBodyRef} className={`file-viewer-body${compareFile ? ' file-viewer-body--compare' : ''}`}>
          <section className="file-viewer-pane" style={compareFile ? { flexBasis: `${splitPercent}%` } : undefined} aria-label={`Preview of ${file.filename}`}>
            <div className="file-viewer-content">
              <FilePreviewContent file={file} zoom={zoom} pan={pan} dragRef={dragRef} onPanChange={setPan} />
            </div>
          </section>
          {compareFile && (
            <>
              <div
                className="file-viewer-divider"
                role="separator"
                aria-label="Resize comparison panes"
                aria-valuemin={20}
                aria-valuemax={80}
                aria-valuenow={Math.round(splitPercent)}
                tabIndex={0}
                onPointerDown={resizeCompare}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    event.preventDefault()
                    nudgeCompareSplit(-5)
                  }
                  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    event.preventDefault()
                    nudgeCompareSplit(5)
                  }
                }}
              />
              <section className="file-viewer-pane file-viewer-pane--compare" style={{ flexBasis: `${100 - splitPercent}%` }} aria-label={`Preview of ${compareFile.filename}`}>
              <div className="file-viewer-compare-header">
                <div className="file-viewer-title-box">
                  <span className="file-viewer-icon" aria-hidden="true"><FileTypeIcon mimeType={compareFile.mimeType} size={18} /></span>
                  <h3 className="file-viewer-title" title={compareFile.filename}>{compareFile.filename}</h3>
                </div>
                <div className="file-viewer-actions">
                  {compareFile.mimeType.startsWith('image/') && (
                    <div className="file-viewer-zoom" aria-label="Compare image zoom controls">
                      <button type="button" className="file-viewer-control" onClick={() => changeCompareZoom(compareZoom - 0.25)} disabled={compareZoom <= 1} aria-label="Zoom out compare image">−</button>
                      <span aria-live="polite">{Math.round(compareZoom * 100)}%</span>
                      <button type="button" className="file-viewer-control" onClick={() => changeCompareZoom(compareZoom + 0.25)} disabled={compareZoom >= 3} aria-label="Zoom in compare image">+</button>
                    </div>
                  )}
                  <button type="button" className="icon-button file-viewer-close" onClick={() => setCompareFile(null)} aria-label="Close comparison pane" title="Close comparison pane">
                    <XIcon size={15} />
                  </button>
                </div>
              </div>
              <div className="file-viewer-content">
                <FilePreviewContent file={compareFile} zoom={compareZoom} pan={comparePan} dragRef={compareDragRef} onPanChange={setComparePan} />
              </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── File Card (Gallery View) ────────────────────────────────────────────────
const FileCard = memo(function FileCard({
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
  const menuPopupRef = useRef<HTMLDivElement>(null)
  const menuPlacement = useMenuPlacement(menuOpen, menuRef, menuPopupRef)

  const canHaveThumbnail =
    (file.mimeType.startsWith('image/') || file.mimeType === 'application/pdf') && !imgError
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
    <article
      className="fc"
      onClick={() => onPreview(file)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onPreview(file)
      }}
    >
      <div className="fc-preview">
        {canHaveThumbnail ? (
          <img
            src={`/api/files/preview/${file.$id}`}
            alt={file.filename}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="fc-icon" aria-hidden="true">
            <FileTypeIcon mimeType={file.mimeType} size={32} />
          </span>
        )}
      </div>
      <div className="fc-body">
        <div className="fc-top">
          <p className="fc-name" title={file.filename}>
            {file.filename}
          </p>
          <div className="fc-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <button
              className="icon-button fc-dots"
              aria-label="File options"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              title="File options"
              type="button"
            >
              <MoreHorizontalIcon size={14} />
            </button>
            {menuOpen && (
              <div ref={menuPopupRef} className={`fc-dropdown fc-dropdown--${menuPlacement}`} role="menu">
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onPreview(file)
                  }}
                  title="Open file preview"
                >
                  Preview
                </button>
                <a
                  role="menuitem"
                  href={`/api/files/preview/${file.$id}?download=1`}
                  download={file.filename}
                  className="fc-dropdown-link"
                  onClick={() => setMenuOpen(false)}
                  title="Download file"
                >
                  Download
                </a>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    onRename(file.$id, file.filename)
                  }}
                  title="Rename this file"
                >
                  Rename
                </button>
                {!file.isPermanent ? (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      onMakePermanent(file.$id)
                    }}
                    title="Keep this file permanently"
                  >
                    Make permanent
                  </button>
                ) : (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false)
                      onRestore(file.$id)
                    }}
                    title="Restore automatic 30-day expiration"
                  >
                    Restore expiration
                  </button>
                )}
                <div className="fc-dropdown-divider" />
                <button
                  role="menuitem"
                  className="fc-dropdown-danger"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete(file.$id)
                  }}
                  title="Delete this file"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="fc-meta">
          {humanSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}
        </p>
        <div className="fc-badges">
          {file.isPermanent ? (
            <span className="fbadge fbadge-permanent">Permanent</span>
          ) : expiresIn !== null ? (
            <span className={`fbadge ${expiryWarning ? 'fbadge-warn' : ''}`}>
              Expires in {expiresIn}d
            </span>
          ) : (
            <span className="fbadge">Temporary</span>
          )}
        </div>
      </div>
    </article>
  )
})

// ─── File Row (List View) ────────────────────────────────────────────────────
const FileRow = memo(function FileRow({
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
  const menuPopupRef = useRef<HTMLDivElement>(null)
  const menuPlacement = useMenuPlacement(menuOpen, menuRef, menuPopupRef)
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
    <div
      className="fr"
      onClick={() => onPreview(file)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onPreview(file)
      }}
    >
      <span className="fr-icon" aria-hidden="true">
        <FileTypeIcon mimeType={file.mimeType} size={18} />
      </span>
      <div className="fr-info">
        <span className="fr-name" title={file.filename}>
          {file.filename}
        </span>
        <span className="fr-sub">
          {humanSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()}
        </span>
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
      <div className="fc-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <button
          className="icon-button fc-dots"
          aria-label="File options"
          onClick={() => setMenuOpen((v) => !v)}
          title="File options"
          type="button"
        >
          <MoreHorizontalIcon size={14} />
        </button>
        {menuOpen && (
          <div ref={menuPopupRef} className={`fc-dropdown fc-dropdown--${menuPlacement}`} role="menu">
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                onPreview(file)
              }}
              title="Open file preview"
            >
              Preview
            </button>
            <a
              role="menuitem"
              href={`/api/files/preview/${file.$id}?download=1`}
              download={file.filename}
              className="fc-dropdown-link"
              onClick={() => setMenuOpen(false)}
              title="Download file"
            >
              Download
            </a>
            <button
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                onRename(file.$id, file.filename)
              }}
              title="Rename this file"
            >
              Rename
            </button>
            {!file.isPermanent ? (
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onMakePermanent(file.$id)
                }}
                title="Keep this file permanently"
              >
                Make permanent
              </button>
            ) : (
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  onRestore(file.$id)
                }}
                title="Restore automatic 30-day expiration"
              >
                Restore expiration
              </button>
            )}
            <div className="fc-dropdown-divider" />
            <button
              role="menuitem"
              className="fc-dropdown-danger"
              onClick={() => {
                setMenuOpen(false)
                onDelete(file.$id)
              }}
              title="Delete this file"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

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

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }
  function onDragLeave() {
    setIsDragOver(false)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) uploadFile(f)
  }
  function onBrowse() {
    inputRef.current?.click()
  }
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) uploadFile(f)
    e.target.value = ''
  }

  // Optimistic delete with rollback
  const confirmDelete = useCallback(async (id: string) => {
    setDeleteTarget(null)
    const previousFiles = files
    setFiles((curr) => (curr ? curr.filter((f) => f.$id !== id) : curr))
    try {
      const res = await fetch(`/api/files/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.notify('File deleted', 'success')
    } catch (err: any) {
      setFiles(previousFiles)
      toast.notify(err.message || 'Delete failed', 'error')
    }
  }, [files, toast])

  // Optimistic rename with rollback
  const confirmRename = useCallback(async (id: string, name: string) => {
    setRenameTarget(null)
    if (!name) return
    const previousFiles = files
    setFiles((curr) => (curr ? curr.map((f) => f.$id === id ? { ...f, filename: name } : f) : curr))
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
    } catch (err: any) {
      setFiles(previousFiles)
      toast.notify(err.message || 'Rename failed', 'error')
    }
  }, [files, toast])

  // Optimistic make permanent with rollback
  const handleMakePermanent = useCallback(async (id: string) => {
    const previousFiles = files
    setFiles((curr) => (curr ? curr.map((f) => f.$id === id ? { ...f, isPermanent: true } : f) : curr))
    try {
      const res = await fetch(`/api/files/${id}/make-permanent`, { method: 'POST' })
      if (!res.ok) throw new Error('Operation failed')
      toast.notify('Marked as permanent', 'success')
    } catch (err: any) {
      setFiles(previousFiles)
      toast.notify(err.message || 'Operation failed', 'error')
    }
  }, [files, toast])

  // Optimistic restore expiration with rollback
  const handleRestore = useCallback(async (id: string) => {
    const previousFiles = files
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    setFiles((curr) => (curr ? curr.map((f) => f.$id === id ? { ...f, isPermanent: false, expiresAt: futureDate } : f) : curr))
    try {
      const res = await fetch(`/api/files/${id}/restore-expiration`, { method: 'POST' })
      if (!res.ok) throw new Error('Operation failed')
      toast.notify('Expiration restored (30 days)', 'success')
    } catch (err: any) {
      setFiles(previousFiles)
      toast.notify(err.message || 'Operation failed', 'error')
    }
  }, [files, toast])

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteTarget(files?.find((x) => x.$id === id) || null)
  }, [files])

  const handleRenameClick = useCallback((id: string, current: string) => {
    setRenameTarget({ id, current })
  }, [])

  const totalUsed = files ? files.reduce((s, f) => s + (f.size || 0), 0) : 0
  const maxTotal = 500 * 1024 * 1024
  const usagePercent = Math.min(100, Math.round((totalUsed / maxTotal) * 100))
  const remaining = Math.max(0, maxTotal - totalUsed)

  return (
    <>
      {/* Hidden native file input for accessibility */}
      <input ref={inputRef} type="file" className="sr-only" onChange={onChange} tabIndex={-1} aria-hidden />

      {/* Modals rendered conditionally */}
      {previewTarget && (
        <FileViewerModal
          file={previewTarget}
          files={files ?? []}
          onNavigate={setPreviewTarget}
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
            <p className="files-subtitle">Upload, preview, and organize your workspace assets</p>
          </div>
          <Button
            variant="primary"
            onClick={onBrowse}
            disabled={uploading}
            title="Upload new file from computer"
          >
            <UploadCloudIcon size={16} />
            <span>{uploading ? `Uploading ${progress}%…` : 'Upload file'}</span>
          </Button>
        </div>

        {/* ─── Storage Quota Card ────────────────────────────────────── */}
        <div className="storage-card">
          <div className="storage-card-top">
            <div>
              <p className="storage-label">Storage Quota</p>
              <p className="storage-used">
                {humanSize(totalUsed)} <span>of {humanSize(maxTotal)}</span>
              </p>
            </div>
            <p className="storage-remaining">
              {remaining === 0 ? 'Quota full' : `${humanSize(remaining)} free`}
            </p>
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onBrowse()
            }
          }}
        >
          <div className="drop-zone-inner">
            <span className="drop-zone-icon" aria-hidden="true">
              <UploadCloudIcon size={32} />
            </span>
            <p className="drop-zone-text">
              {isDragOver ? 'Drop file to upload' : 'Drag & drop a file here'}
            </p>
            <p className="drop-zone-sub">
              or{' '}
              <span
                className="drop-zone-link"
              >
                browse files
              </span>
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
              type="button"
            >
              <GridIcon size={14} />
            </button>
            <button
              className={`view-btn${view === 'list' ? ' view-btn-active' : ''}`}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              title="List view"
              type="button"
            >
              <ListIcon size={14} />
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
            <span className="files-empty-icon" aria-hidden="true">
              <FolderIcon size={40} />
            </span>
            <p className="files-empty-title">No files uploaded yet</p>
            <p className="files-empty-sub">
              Upload documents, media, or resources to keep them organized in your workspace.
            </p>
          </div>
        ) : view === 'gallery' ? (
          <div className="files-gallery">
            {files.map((f) => (
              <FileCard
                key={f.$id}
                file={f}
                onDelete={handleDeleteClick}
                onRename={handleRenameClick}
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
                onDelete={handleDeleteClick}
                onRename={handleRenameClick}
                onMakePermanent={handleMakePermanent}
                onRestore={handleRestore}
                onPreview={setPreviewTarget}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
