'use client'

import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNotes, type CanvasAsset, type CanvasNote, type CanvasState, type NoteType } from '@/features/notes/notes-provider'
import { MoreHorizontalIcon, PlusIcon, StickyNoteIcon, TrashIcon, ChevronDownIcon } from '@/components/ui/icons'

type View = 'canvas' | 'list'
type AddKind = 'note' | 'image' | 'pdf' | 'task' | 'habit'
const presetColors = ['#a9d6ff', '#ffe49a', '#bde8c8', '#ffc1c1', '#d7c4ff', '#ffc48c', '#d1d5db']

function inlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|~~.*?~~|`.*?`|\*.*?\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith('~~') && part.endsWith('~~')) return <s key={index}>{part.slice(2, -2)}</s>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/)
    return link ? <a key={index} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a> : part
  })
}

function markdown(text: string) {
  const lines = text.split('\n')
  const output: React.ReactNode[] = []
  let code = false
  let codeLines: string[] = []
  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (code) output.push(<pre key={`code-${index}`}><code>{codeLines.join('\n')}</code></pre>)
      code = !code
      codeLines = []
      return
    }
    if (code) { codeLines.push(line); return }
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    const bullet = line.match(/^[-*]\s+(.*)$/)
    const numbered = line.match(/^\d+\.\s+(.*)$/)
    const checklist = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/)
    if (heading) output.push(React.createElement(`h${heading[1].length}`, { key: index }, inlineMarkdown(heading[2])))
    else if (checklist) output.push(<label className="note-checklist" key={index}><input type="checkbox" checked={checklist[1].toLowerCase() === 'x'} readOnly />{inlineMarkdown(checklist[2])}</label>)
    else if (bullet) output.push(<li key={index}>{inlineMarkdown(bullet[1])}</li>)
    else if (numbered) output.push(<li key={index}>{inlineMarkdown(numbered[1])}</li>)
    else output.push(<p key={index}>{inlineMarkdown(line || '\u00a0')}</p>)
  })
  return output
}

function readableText(color: string) {
  const hex = color.replace('#', '')
  const rgb = hex.length === 6 ? [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16)) : [169, 214, 255]
  return ((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000) > 155 ? '#20242b' : '#ffffff'
}

const NoteObject = memo(function NoteObject({ note, zoom, selected, onSelect, onUpdate, onDelete, onDuplicate, onConvert }: { note: CanvasNote; zoom: number; selected: boolean; onSelect: (id: string) => void; onUpdate: (id: string, patch: Partial<CanvasNote>) => void; onDelete: (id: string) => void; onDuplicate: (note: CanvasNote) => void; onConvert: (note: CanvasNote, type: NoteType) => void }) {
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [colorsOpen, setColorsOpen] = useState(false)
  const textColor = readableText(note.color)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const resize = useRef<{ x: number; y: number; width: number; height: number; mode: 'right' | 'bottom' | 'corner' } | null>(null)
  const noteRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!menuOpen && !colorsOpen && !editing) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); setColorsOpen(false); setEditing(false) }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [colorsOpen, editing, menuOpen])

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (noteRef.current && !noteRef.current.contains(event.target as Node)) { setMenuOpen(false); setColorsOpen(false) }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  function move(event: React.PointerEvent) {
    if (!drag.current) return
    onUpdate(note.id, { x: drag.current.left + (event.clientX - drag.current.x) / zoom, y: drag.current.top + (event.clientY - drag.current.y) / zoom })
  }
  function resizeNote(event: React.PointerEvent) {
    if (!resize.current) return
    const nextWidth = Math.min(560, Math.max(180, resize.current.width + (event.clientX - resize.current.x) / zoom))
    const nextHeight = Math.min(520, Math.max(130, resize.current.height + (event.clientY - resize.current.y) / zoom))
    onUpdate(note.id, { width: resize.current.mode === 'bottom' ? note.width : nextWidth, height: resize.current.mode === 'right' ? note.height : nextHeight })
  }

  return (
    <article ref={noteRef} className={`note-object${selected ? ' note-object--selected' : ''}${editing ? ' note-object--editing' : ''}`} style={{ left: note.x, top: note.y, width: note.width, height: note.height, zIndex: note.zIndex, transform: `rotate(${note.rotation}deg)`, background: note.color, color: textColor }} onPointerDown={(event) => { event.stopPropagation(); onSelect(note.id); if (!editing && !(event.target as HTMLElement).closest('button, input, textarea, label, .note-menu, .note-color-palette, .note-resize')) { event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, left: note.x, top: note.y } } }} onPointerMove={(event) => { move(event); resizeNote(event) }} onPointerUp={() => { drag.current = null; resize.current = null }} onPointerCancel={() => { drag.current = null; resize.current = null }}>
      <header className="note-object-header">
        <span className="note-type-indicator">{note.type === 'normal' ? 'Note' : note.type}</span>
        <div className="note-object-actions" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" className="note-icon-button" onClick={() => setColorsOpen((open) => !open)} aria-label="Change note color" title="Change note color">●</button>
          {colorsOpen && <div className="note-color-palette" role="menu">{presetColors.map((color) => <button key={color} type="button" style={{ background: color }} onClick={() => { onUpdate(note.id, { color }); setColorsOpen(false) }} aria-label={`Use ${color} note color`} />)}<label className="note-custom-color"><input type="color" value={note.color} onChange={(event) => onUpdate(note.id, { color: event.target.value })} aria-label="Choose custom note color" /></label></div>}
          <button type="button" className="note-icon-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Note actions" aria-expanded={menuOpen}><MoreHorizontalIcon size={16} /></button>
          {menuOpen && <div className="note-menu" role="menu">
            <button type="button" onClick={() => { setEditing(true); setMenuOpen(false) }}>Edit</button>
            <button type="button" onClick={() => { onDuplicate(note); setMenuOpen(false) }}>Duplicate</button>
            <label className="note-due-date">Set due date<input type="date" value={note.dueDate || ''} onChange={(event) => onUpdate(note.id, { dueDate: event.target.value || undefined })} /></label>
            {note.type === 'normal' && <><button type="button" onClick={() => { onConvert(note, 'task'); setMenuOpen(false) }}>Convert to Task</button><button type="button" onClick={() => { onConvert(note, 'habit'); setMenuOpen(false) }}>Convert to Habit</button></>}
            {note.type === 'task' && <><button type="button" onClick={() => { onConvert(note, 'habit'); setMenuOpen(false) }}>Convert to Habit</button><button type="button" onClick={() => { onConvert(note, 'normal'); setMenuOpen(false) }}>Remove Task Status</button></>}
            {note.type === 'habit' && <><button type="button" onClick={() => { onConvert(note, 'task'); setMenuOpen(false) }}>Convert to Task</button><button type="button" onClick={() => { onConvert(note, 'normal'); setMenuOpen(false) }}>Remove Habit Status</button></>}
            <button type="button" onClick={() => onDelete(note.id)} className="note-menu-danger">Delete</button>
          </div>}
        </div>
      </header>
      {note.type !== 'normal' && <span className="note-relationship-badge">{note.type}</span>}
      {editing ? <textarea autoFocus className="note-editor" onPointerDown={(event) => event.stopPropagation()} value={note.content} onChange={(event) => { onUpdate(note.id, { content: event.target.value }); event.currentTarget.style.height = 'auto'; event.currentTarget.style.height = `${event.currentTarget.scrollHeight}px` }} onBlur={() => setEditing(false)} aria-label="Edit note content" /> : <div className="note-content" onDoubleClick={() => setEditing(true)}>{markdown(note.content || 'Double-click to write…')}</div>}
      <input className="note-title" onPointerDown={(event) => event.stopPropagation()} onDoubleClick={() => setEditing(true)} value={note.title} onChange={(event) => onUpdate(note.id, { title: event.target.value })} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} aria-label="Note title" />
      <button type="button" className="note-resize note-resize-right" aria-label="Resize note width" onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); resize.current = { x: event.clientX, y: event.clientY, width: note.width, height: note.height, mode: 'right' } }} />
      <button type="button" className="note-resize note-resize-bottom" aria-label="Resize note height" onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); resize.current = { x: event.clientX, y: event.clientY, width: note.width, height: note.height, mode: 'bottom' } }} />
      <button type="button" className="note-resize note-resize-corner" aria-label="Resize note" onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); resize.current = { x: event.clientX, y: event.clientY, width: note.width, height: note.height, mode: 'corner' } }} />
    </article>
  )
})

const AssetObject = memo(function AssetObject({ asset, zoom, selected, onSelect, onUpdate, onDelete }: { asset: CanvasAsset; zoom: number; selected: boolean; onSelect: () => void; onUpdate: (patch: Partial<CanvasAsset>) => void; onDelete: () => void }) {
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const isPdf = asset.mimeType === 'application/pdf'
  return <article className={`canvas-asset${selected ? ' canvas-asset--selected' : ''}`} style={{ left: asset.x, top: asset.y, width: asset.width, height: asset.height, zIndex: asset.zIndex }} onPointerDown={(event) => { event.stopPropagation(); onSelect(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, left: asset.x, top: asset.y } }} onPointerMove={(event) => { if (drag.current) onUpdate({ x: drag.current.left + (event.clientX - drag.current.x) / zoom, y: drag.current.top + (event.clientY - drag.current.y) / zoom }) }} onPointerUp={() => { drag.current = null }} onDoubleClick={() => { if (isPdf) window.location.href = `/api/notes/images/${asset.id}` }}>
    {isPdf ? <iframe src={`/api/notes/images/${asset.id}`} title={asset.filename} /> : <img src={`/api/notes/images/${asset.id}`} alt={asset.filename} draggable={false} />}
    <div className="canvas-asset-label">{asset.filename}</div><button type="button" className="canvas-asset-delete" onClick={(event) => { event.stopPropagation(); onDelete() }} aria-label={`Delete ${asset.filename}`}><TrashIcon size={13} /></button><button type="button" className="canvas-asset-resize" onPointerDown={(event) => { event.stopPropagation(); const start = { x: event.clientX, y: event.clientY, width: asset.width, height: asset.height }; event.currentTarget.setPointerCapture(event.pointerId); const move = (moveEvent: PointerEvent) => onUpdate({ width: Math.max(160, start.width + (moveEvent.clientX - start.x) / zoom), height: Math.max(120, start.height + (moveEvent.clientY - start.y) / zoom) }); const stop = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop) }; window.addEventListener('pointermove', move); window.addEventListener('pointerup', stop, { once: true }) }} aria-label={`Resize ${asset.filename}`} />
  </article>
})

function NotesCanvas({ onList }: { onList: () => void }) {
  const { notes, assets, canvas, saveCanvas, addNote, addAsset, duplicateNote, updateNote, updateAsset, deleteNote, deleteAsset, convertNote } = useNotes()
  const viewportRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; canvasX: number; canvasY: number } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const pan = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const panFrame = useRef<number | null>(null)
  const pendingPan = useRef<CanvasState | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const handler = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      zoom({ preventDefault: () => undefined, clientX: event.clientX, clientY: event.clientY, deltaY: event.deltaY, deltaX: event.deltaX, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey } as unknown as React.WheelEvent)
    }
    element.addEventListener('wheel', handler, { passive: false })
    return () => element.removeEventListener('wheel', handler)
  }, [canvas, saveCanvas])

  useEffect(() => {
    if (!contextMenu || !contextMenuRef.current) return
    const menu = contextMenuRef.current
    const left = Math.min(contextMenu.x, window.innerWidth - menu.offsetWidth - 8)
    const top = Math.min(contextMenu.y, window.innerHeight - menu.offsetHeight - 8)
    if (left !== contextMenu.x || top !== contextMenu.y) setContextMenu({ ...contextMenu, x: Math.max(8, left), y: Math.max(8, top) })
  }, [contextMenu])

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setSelectedId(null); setContextMenu(null); return }
      if (event.key === 'a' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); return }
      if (!selectedId) return
      const note = notes.find((item) => item.id === selectedId)
      if (!note) return
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); void deleteNote(note.id); setSelectedId(null) }
      if (event.key.toLowerCase() === 'd' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void duplicateNote(note) }
      const amount = event.shiftKey ? 10 : 1
      const moves: Record<string, { x: number; y: number }> = { ArrowLeft: { x: -amount, y: 0 }, ArrowRight: { x: amount, y: 0 }, ArrowUp: { x: 0, y: -amount }, ArrowDown: { x: 0, y: amount } }
      const move = moves[event.key]
      if (move) { event.preventDefault(); updateNote(note.id, { x: note.x + move.x, y: note.y + move.y }) }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [deleteNote, duplicateNote, notes, selectedId, updateNote])

  useEffect(() => {
    const down = (event: KeyboardEvent) => { if (event.code === 'Space' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) { event.preventDefault(); setSpaceDown(true) } }
    const up = (event: KeyboardEvent) => { if (event.code === 'Space') setSpaceDown(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      const shortcuts: Record<string, AddKind> = { n: 'note', i: 'image', p: 'pdf', t: 'task', h: 'habit' }
      const kind = shortcuts[event.key.toLowerCase()]
      if (kind) { event.preventDefault(); setAddOpen(true); if (kind === 'note') addAtViewport(window.innerWidth / 2, window.innerHeight / 2) }
      if ((event.ctrlKey || event.metaKey) && event.key === '0') { event.preventDefault(); saveCanvas({ ...canvas, zoom: 1 }) }
      if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=')) { event.preventDefault(); saveCanvas({ ...canvas, zoom: Math.min(2.4, canvas.zoom * 1.1) }) }
      if ((event.ctrlKey || event.metaKey) && event.key === '-') { event.preventDefault(); saveCanvas({ ...canvas, zoom: Math.max(.45, canvas.zoom * .9) }) }
      if (!selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault()
        const delta = event.shiftKey ? 40 : 16
        saveCanvas({ ...canvas, panX: canvas.panX + (event.key === 'ArrowLeft' ? delta : event.key === 'ArrowRight' ? -delta : 0), panY: canvas.panY + (event.key === 'ArrowUp' ? delta : event.key === 'ArrowDown' ? -delta : 0) })
      }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [canvas, saveCanvas, selectedId])

  function zoom(event: React.WheelEvent) {
    if (event.ctrlKey || event.metaKey) event.preventDefault()
    event.preventDefault()
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    if (!event.ctrlKey && !event.metaKey) {
      saveCanvas({ ...canvas, panX: canvas.panX - (event.shiftKey ? event.deltaY : event.deltaX), panY: canvas.panY - (event.shiftKey ? 0 : event.deltaY) })
      return
    }
    const next = Math.min(2.4, Math.max(0.45, canvas.zoom * (event.deltaY > 0 ? 0.92 : 1.08)))
    const worldX = (event.clientX - rect.left - canvas.panX) / canvas.zoom
    const worldY = (event.clientY - rect.top - canvas.panY) / canvas.zoom
    saveCanvas({ zoom: next, panX: event.clientX - rect.left - worldX * next, panY: event.clientY - rect.top - worldY * next })
  }
  function startPan(event: React.PointerEvent) {
    if (event.button !== 1 && event.button !== 0 && !spaceDown) return
    if (event.button === 0 && !spaceDown && (event.target as HTMLElement).closest('.notes-canvas-world') === null) return
    if ((event.target as HTMLElement).closest('.note-object')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    pan.current = { x: event.clientX, y: event.clientY, panX: canvas.panX, panY: canvas.panY }
  }
  function movePan(event: React.PointerEvent) {
    if (!pan.current) return
    pendingPan.current = { ...canvas, panX: pan.current.panX + event.clientX - pan.current.x, panY: pan.current.panY + event.clientY - pan.current.y }
    if (panFrame.current === null) panFrame.current = requestAnimationFrame(() => { if (pendingPan.current) saveCanvas(pendingPan.current); pendingPan.current = null; panFrame.current = null })
  }
  function finishPan() { pan.current = null }
  function addAtCanvas(x: number, y: number) { void addNote({ x, y }) }
  function addAtViewport(x: number, y: number) {
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    addAtCanvas((x - rect.left - canvas.panX) / canvas.zoom, (y - rect.top - canvas.panY) / canvas.zoom)
  }

  function fitCanvas() {
    if (!notes.length) { saveCanvas({ zoom: 1, panX: 0, panY: 0 }); return }
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    const minX = Math.min(...notes.map((note) => note.x))
    const minY = Math.min(...notes.map((note) => note.y))
    const maxX = Math.max(...notes.map((note) => note.x + note.width))
    const maxY = Math.max(...notes.map((note) => note.y + note.height))
    const zoom = Math.min(1.4, Math.max(.45, Math.min((rect.width - 160) / Math.max(320, maxX - minX), (rect.height - 180) / Math.max(240, maxY - minY))))
    saveCanvas({ zoom, panX: (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom, panY: (rect.height - (maxY - minY) * zoom) / 2 - minY * zoom })
  }

  function addObject(kind: AddKind) {
    setAddOpen(false)
    if (kind === 'image' || kind === 'pdf') { fileInput.current?.click(); return }
    if (kind === 'note' || kind === 'task' || kind === 'habit') {
      const rect = viewportRef.current?.getBoundingClientRect()
      if (!rect) return
      void addNote({ x: (rect.width / 2 - canvas.panX) / canvas.zoom, y: (rect.height / 2 - canvas.panY) / canvas.zoom }).then((note) => {
        if (note && (kind === 'task' || kind === 'habit')) void convertNote(note, kind)
      })
    }
  }

  const minimapBounds = useMemo(() => {
    if (!notes.length) return { minX: 0, minY: 0, width: 1000, height: 700 }
    const minX = Math.min(...notes.map((note) => note.x))
    const minY = Math.min(...notes.map((note) => note.y))
    const maxX = Math.max(...notes.map((note) => note.x + note.width))
    const maxY = Math.max(...notes.map((note) => note.y + note.height))
    return { minX: minX - 100, minY: minY - 100, width: Math.max(1000, maxX - minX + 200), height: Math.max(700, maxY - minY + 200) }
  }, [notes])

  function navigateFromMinimap(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const worldX = minimapBounds.minX + ((event.clientX - rect.left) / rect.width) * minimapBounds.width
    const worldY = minimapBounds.minY + ((event.clientY - rect.top) / rect.height) * minimapBounds.height
    const viewport = viewportRef.current?.getBoundingClientRect()
    if (!viewport) return
    saveCanvas({ ...canvas, panX: viewport.width / 2 - worldX * canvas.zoom, panY: viewport.height / 2 - worldY * canvas.zoom })
  }

  const selectNote = React.useCallback((id: string) => {
    setSelectedId(id)
    const highestZIndex = notes.reduce((highest, note) => Math.max(highest, note.zIndex), 0)
    const selected = notes.find((note) => note.id === id)
    if (selected && selected.zIndex < highestZIndex) updateNote(id, { zIndex: highestZIndex + 1 })
  }, [notes, updateNote])
  const updateCanvasNote = React.useCallback((id: string, patch: Partial<CanvasNote>) => updateNote(id, patch), [updateNote])
  const deleteCanvasNote = React.useCallback((id: string) => { void deleteNote(id) }, [deleteNote])
  const duplicateCanvasNote = React.useCallback((note: CanvasNote) => { void duplicateNote(note) }, [duplicateNote])
  const convertCanvasNote = React.useCallback((note: CanvasNote, type: NoteType) => { void convertNote(note, type) }, [convertNote])

  return <div ref={viewportRef} className="notes-canvas" onWheel={zoom} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={finishPan} onPointerCancel={finishPan} onContextMenu={(event) => { event.preventDefault(); const rect = viewportRef.current?.getBoundingClientRect(); if (!rect) return; setContextMenu({ x: event.clientX, y: event.clientY, canvasX: (event.clientX - rect.left - canvas.panX) / canvas.zoom, canvasY: (event.clientY - rect.top - canvas.panY) / canvas.zoom }) }} onClick={() => { setContextMenu(null); setMoreOpen(false) }}>
    <div className="notes-toolbar" onClick={(event) => event.stopPropagation()}>
      <div className="notes-view-toggle" role="group" aria-label="Notes view"><button className="active" type="button">Canvas</button><button type="button" onClick={onList}>List</button></div>
      <button type="button" className="notes-add-menu-trigger" onClick={() => setAddOpen((open) => !open)} aria-expanded={addOpen}><PlusIcon size={16} /> Add <ChevronDownIcon size={14} /></button>
      <div className="notes-zoom-controls"><button type="button" onClick={() => saveCanvas({ ...canvas, zoom: Math.min(2.4, canvas.zoom * 1.1) })} aria-label="Zoom in">+</button><span>{Math.round(canvas.zoom * 100)}%</span><button type="button" onClick={() => saveCanvas({ ...canvas, zoom: Math.max(.45, canvas.zoom * .9) })} aria-label="Zoom out">−</button><button type="button" onClick={() => saveCanvas({ ...canvas, zoom: 1 })}>100%</button><button type="button" onClick={fitCanvas}>Fit</button></div>
      <button type="button" className="notes-more-trigger" onClick={() => setMoreOpen((open) => !open)} aria-label="Canvas options"><MoreHorizontalIcon size={17} /></button>
      {addOpen && <div className="notes-add-menu" role="menu">{(['note', 'image', 'pdf', 'task', 'habit'] as AddKind[]).map((kind) => <button key={kind} type="button" onClick={() => addObject(kind)}><span>{kind === 'note' ? 'Sticky Note' : kind[0].toUpperCase() + kind.slice(1)}</span><kbd>{kind[0].toUpperCase()}</kbd></button>)}</div>}
      {moreOpen && <div className="notes-more-menu" role="menu"><button type="button" onClick={fitCanvas}>Fit view</button><button type="button" onClick={() => saveCanvas({ ...canvas, zoom: 1 })}>Reset zoom</button></div>}
    </div>
    <input ref={fileInput} type="file" accept="image/*,application/pdf" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void addAsset(file, { x: (window.innerWidth / 2 - canvas.panX) / canvas.zoom, y: (window.innerHeight / 2 - canvas.panY) / canvas.zoom }); event.currentTarget.value = '' }} />
    <div className="notes-canvas-world" style={{ transform: `translate(${canvas.panX}px, ${canvas.panY}px) scale(${canvas.zoom})` }}>
      {assets.map((asset) => <AssetObject key={asset.id} asset={asset} zoom={canvas.zoom} selected={selectedId === asset.id} onSelect={() => setSelectedId(asset.id)} onUpdate={(patch) => updateAsset(asset.id, patch)} onDelete={() => void deleteAsset(asset.id)} />)}
      {notes.map((note) => <NoteObject key={note.id} note={note} zoom={canvas.zoom} selected={selectedId === note.id} onSelect={selectNote} onUpdate={updateCanvasNote} onDelete={deleteCanvasNote} onDuplicate={duplicateCanvasNote} onConvert={convertCanvasNote} />)}
    </div>
    <button type="button" className="notes-add-button" onClick={() => addAtViewport(180, 160)} aria-label="Add sticky note" title="Add sticky note"><PlusIcon size={20} /></button>
    {contextMenu && <div ref={contextMenuRef} className="notes-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} role="menu"><button type="button" onClick={() => { addAtCanvas(contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null) }}><StickyNoteIcon size={15} /> Add Sticky Note</button></div>}
  </div>
}

function NotesList({ onCanvas }: { onCanvas: () => void }) {
  const { notes, updateNote, deleteNote } = useNotes()
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | NoteType>('all')
  const filtered = useMemo(() => notes.filter((note) => (!search || `${note.title} ${note.content}`.toLowerCase().includes(search.toLowerCase())) && (type === 'all' || note.type === type)), [notes, search, type])
  return <div className="notes-list-view"><div className="notes-list-toolbar"><button type="button" onClick={onCanvas}>Back to canvas</button></div><div className="notes-list-controls"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes" aria-label="Search notes" /><select value={type} onChange={(event) => setType(event.target.value as typeof type)} aria-label="Filter notes"><option value="all">All types</option><option value="normal">Normal</option><option value="task">Task</option><option value="habit">Habit</option></select></div><div className="notes-table-wrap"><table className="notes-table"><thead><tr><th>Title</th><th>Type</th><th>Created</th><th>Updated</th><th>Due date</th><th /></tr></thead><tbody>{filtered.map((note) => <tr key={note.id}><td><input value={note.title} onChange={(event) => updateNote(note.id, { title: event.target.value })} aria-label={`Title for ${note.title}`} /></td><td>{note.type}</td><td>{new Date(note.createdAt).toLocaleDateString()}</td><td>{new Date(note.updatedAt).toLocaleDateString()}</td><td>{note.dueDate || '—'}</td><td><button type="button" className="note-list-delete" onClick={() => void deleteNote(note.id)} aria-label={`Delete ${note.title}`}><TrashIcon size={15} /></button></td></tr>)}</tbody></table>{!filtered.length && <div className="notes-empty"><h2>No notes found</h2><p>Create a sticky note on the canvas to begin.</p></div>}</div></div>
}

export default function NotesPage() {
  const { isLoading, addNote } = useNotes()
  const [view, setView] = useState<View>('canvas')
  return <div className="notes-page"><header className="notes-page-header"><div><h1>Notes</h1><p className="lede">A flexible space for ideas, tasks, and momentum.</p></div></header>{isLoading ? <div className="notes-loading" aria-busy="true">Loading notes…</div> : view === 'canvas' ? <NotesCanvas onList={() => setView('list')} /> : <NotesList onCanvas={() => setView('canvas')} />}</div>
}
