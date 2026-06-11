"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { attachmentsApi } from "@/lib/api/attachments";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentSection({ taskId }: { taskId: string }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data } = useQuery({
    queryKey: ["attachments", taskId],
    queryFn: () => attachmentsApi.list(taskId).then((r) => r.data.attachments),
  });

  const upload = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(taskId, file).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments", taskId] }),
  });

  const remove = useMutation({
    mutationFn: (attId: string) => attachmentsApi.delete(taskId, attId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments", taskId] }),
  });

  function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (file.size > 1024 * 1024) {
      alert("File must be under 1 MB");
      return;
    }
    upload.mutate(file);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Attachments</h3>

      {/* drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {upload.isPending ? (
          <p className="text-sm text-muted-foreground">Uploading…</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Drop a file or <span className="text-primary font-medium">click to browse</span>
            <span className="block text-xs mt-0.5">Max 1 MB</span>
          </p>
        )}
      </div>

      {upload.isError && (
        <p className="text-xs text-destructive">Upload failed. Please try again.</p>
      )}

      {/* attachment list */}
      <ul className="space-y-2">
        <AnimatePresence initial={false} mode="popLayout">
          {(data ?? []).map((att) => (
            <motion.li
              key={att.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
            >
              <svg className="w-5 h-5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
              </svg>
              <div className="flex-1 min-w-0">
                <a
                  href={attachmentsApi.downloadUrl(taskId, att.id)}
                  download={att.filename}
                  className="text-sm font-medium text-foreground hover:text-primary truncate block"
                >
                  {att.filename}
                </a>
                <span className="text-xs text-muted-foreground">{formatBytes(att.size)}</span>
              </div>
              <button
                onClick={() => remove.mutate(att.id)}
                disabled={remove.isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                aria-label="Delete attachment"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
