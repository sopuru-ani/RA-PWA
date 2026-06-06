"use client";

import { useState } from "react";
import { Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNotification } from "@/context/notification-context";
import {
  addProgramAttachment,
  removeProgramAttachment,
} from "@/lib/programs-api";
import type { Program } from "@/types/programs";

type Props = {
  program: Program;
  editable?: boolean;
  onUpdate?: (program: Program) => void;
};

export default function ProgramAttachmentsEditor({
  program,
  editable = false,
  onUpdate,
}: Props) {
  const { show } = useNotification();
  const [filename, setFilename] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const attachments = program.attachments ?? [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!filename.trim() || !url.trim()) return;

    setLoading(true);
    try {
      const updated = await addProgramAttachment(program._id, {
        filename: filename.trim(),
        bucket: url.trim(),
        mimeType: "text/uri-list",
      });
      setFilename("");
      setUrl("");
      onUpdate?.(updated);
      show({ msg: "Attachment added", type: "success", duration: 2000 });
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Failed to add attachment",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(attachmentId: string) {
    setLoading(true);
    try {
      const updated = await removeProgramAttachment(program._id, attachmentId);
      onUpdate?.(updated);
      show({ msg: "Attachment removed", type: "success", duration: 2000 });
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Failed to remove attachment",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Attachments</p>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
            >
              <a
                href={a.bucket.startsWith("http") ? a.bucket : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 min-w-0 hover:underline"
              >
                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{a.filename}</span>
              </a>
              {editable && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  disabled={loading}
                  onClick={() => handleRemove(a.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <form onSubmit={handleAdd} className="space-y-2 border-t pt-3">
          <div className="space-y-1">
            <Label htmlFor="att-name">Label</Label>
            <Input
              id="att-name"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Training handout"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="att-url">Link URL</Label>
            <Input
              id="att-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={loading}>
            Add link
          </Button>
        </form>
      )}
    </div>
  );
}
