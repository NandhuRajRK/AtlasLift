import React from 'react';

export default function PhotoTimelineCard({
  photoSaving,
  onAddPhoto,
  photoMetrics,
  visiblePhotos,
  onReplacePhoto,
  onDeletePhoto,
  onLoadMorePhotos,
}) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Progress Photos</div>
        <label className="text-xs text-primary font-medium cursor-pointer">
          {photoSaving ? 'Saving...' : 'Add Photo'}
          <input type="file" accept="image/*" className="hidden" onChange={onAddPhoto} />
        </label>
      </div>
      {photoMetrics.length > 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {visiblePhotos.map((m) => (
              <div key={m.id} className="space-y-1">
                <img src={m.progressPhotoUrl} alt="Progress" className="w-full h-24 object-cover rounded-lg border border-border" />
                <div className="text-[10px] text-muted-foreground text-center">{m.date}</div>
                <div className="flex gap-1">
                  <label className="flex-1 h-7 rounded-md bg-secondary text-[10px] text-foreground flex items-center justify-center cursor-pointer">
                    Replace
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onReplacePhoto(m.id, e.target.files?.[0])} />
                  </label>
                  <button onClick={() => onDeletePhoto(m)} className="flex-1 h-7 rounded-md bg-secondary text-[10px] text-foreground">Delete</button>
                </div>
              </div>
            ))}
          </div>
          {photoMetrics.length > visiblePhotos.length && (
            <button onClick={onLoadMorePhotos} className="w-full h-9 rounded-lg bg-secondary text-sm text-foreground font-medium">
              Load more photos
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No progress photos yet.</p>
      )}
    </div>
  );
}

