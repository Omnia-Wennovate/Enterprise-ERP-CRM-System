'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Loader2, ImageIcon, AlertCircle, Plus } from 'lucide-react'
import Image from 'next/image'
import {
  uploadActivityImage,
  deleteActivityImage,
  getActivityImages,
  validateImageFile,
  type ActivityImage,
} from '@/lib/services/activity-images'

interface ActivityImageUploaderProps {
  itemId: string | null          // null = new item not yet saved
  itineraryId: string
  /** Called after each successful upload so parent can know images exist */
  onImagesChange?: (images: ActivityImage[]) => void
}

interface PendingUpload {
  file: File
  previewUrl: string
  status: 'uploading' | 'error'
  error?: string
  progress?: number
}

export function ActivityImageUploader({
  itemId,
  itineraryId,
  onImagesChange,
}: ActivityImageUploaderProps) {
  const [savedImages, setSavedImages] = useState<ActivityImage[]>([])
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing images when itemId is available
  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    getActivityImages(itemId)
      .then(imgs => {
        setSavedImages(imgs)
        onImagesChange?.(imgs)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [itemId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!itemId) {
        alert('Save the activity first before uploading images.')
        return
      }
      const arr = Array.from(files)
      const newPending: PendingUpload[] = arr.map(f => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: 'uploading' as const,
      }))
      setPending(prev => [...prev, ...newPending])

      for (let i = 0; i < arr.length; i++) {
        const file = arr[i]
        const pendingEntry = newPending[i]
        const validationError = validateImageFile(file)

        if (validationError) {
          setPending(prev =>
            prev.map(p =>
              p.previewUrl === pendingEntry.previewUrl
                ? { ...p, status: 'error', error: validationError }
                : p
            )
          )
          continue
        }

        try {
          const img = await uploadActivityImage(
            file,
            itemId,
            itineraryId,
            savedImages.length + i
          )
          setSavedImages(prev => {
            const next = [...prev, img]
            onImagesChange?.(next)
            return next
          })
          // Remove from pending once saved
          setPending(prev => prev.filter(p => p.previewUrl !== pendingEntry.previewUrl))
          URL.revokeObjectURL(pendingEntry.previewUrl)
        } catch (err) {
          setPending(prev =>
            prev.map(p =>
              p.previewUrl === pendingEntry.previewUrl
                ? { ...p, status: 'error', error: 'Upload failed. Please retry.' }
                : p
            )
          )
        }
      }
    },
    [itemId, itineraryId, savedImages.length, onImagesChange]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDelete = async (image: ActivityImage) => {
    if (!confirm('Remove this image?')) return
    try {
      await deleteActivityImage(image.id, image.storage_path)
      setSavedImages(prev => {
        const next = prev.filter(i => i.id !== image.id)
        onImagesChange?.(next)
        return next
      })
    } catch {
      alert('Failed to delete image.')
    }
  }

  const removePending = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl)
    setPending(prev => prev.filter(p => p.previewUrl !== previewUrl))
  }

  const totalImages = savedImages.length + pending.length
  const hasImages = totalImages > 0

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Activity Images
        </label>
        {hasImages && (
          <span className="text-xs text-muted-foreground">{savedImages.length} uploaded</span>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-omnia-gold bg-omnia-gold/5 scale-[1.01]'
            : 'border-border hover:border-omnia-gold/50 hover:bg-muted/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">
          Click to upload or drag & drop
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          PNG, JPG, WebP up to 10MB each
        </p>
      </div>

      {/* Empty State */}
      {!hasImages && !loading && (
        <div className="text-center py-3">
          <ImageIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">No images added yet.</p>
          <p className="text-xs text-muted-foreground/70">
            Upload images to showcase this activity in the client&apos;s itinerary.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs">Loading images...</span>
        </div>
      )}

      {/* Image Grid */}
      {hasImages && (
        <div className={`grid gap-2 ${
          totalImages === 1 ? 'grid-cols-1' :
          totalImages === 2 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {/* Saved Images */}
          {savedImages.map(img => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden bg-muted aspect-video">
              <Image
                src={img.public_url}
                alt={img.file_name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 200px"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleDelete(img) }}
                className="absolute top-1.5 right-1.5 p-1 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Pending Uploads */}
          {pending.map(p => (
            <div key={p.previewUrl} className="relative rounded-lg overflow-hidden bg-muted aspect-video">
              <Image
                src={p.previewUrl}
                alt="Uploading..."
                fill
                className={`object-cover ${p.status === 'error' ? 'opacity-40' : 'opacity-70'}`}
                sizes="200px"
              />
              {/* Uploading Overlay */}
              {p.status === 'uploading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                  <Loader2 className="w-5 h-5 text-white animate-spin mb-1" />
                  <span className="text-white text-[10px] font-medium">Uploading...</span>
                </div>
              )}
              {/* Error Overlay */}
              {p.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/50 p-2">
                  <AlertCircle className="w-4 h-4 text-red-200 mb-1" />
                  <p className="text-[10px] text-red-100 text-center leading-tight">{p.error}</p>
                </div>
              )}
              {/* Dismiss Error */}
              {p.status === 'error' && (
                <button
                  type="button"
                  onClick={() => removePending(p.previewUrl)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/70 text-white rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Add More */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video rounded-lg border-2 border-dashed border-border hover:border-omnia-gold/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-omnia-gold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[10px]">Add More</span>
          </button>
        </div>
      )}

      {/* New item notice */}
      {!itemId && (
        <p className="text-[10px] text-amber-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Save the activity first, then you can upload images.
        </p>
      )}
    </div>
  )
}
