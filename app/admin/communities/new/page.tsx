"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { useNotification } from "@/context/notification-context";

export default function NewCommunityPage() {
  const router = useRouter();
  const { show } = useNotification();
  const [name, setName] = useState("");
  const [sectionsText, setSectionsText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const sections = sectionsText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await apiFetch("api/admin/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ community: name, sections }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.msg ?? "Failed to create community");

      show({ msg: "Community created", type: "success", duration: 2000 });
      router.push(
        `/admin/communities/${encodeURIComponent(json.community.community)}`,
      );
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Failed",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 pb-4 mx-3">
      <Link
        href="/admin/communities"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Communities
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Create community</h1>
        <p className="text-sm text-muted-foreground">
          Add a housing community and optional initial sections
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Community name</Label>
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Student Apartments"
          />
        </div>
        <div className="space-y-1">
          <Label>Sections (optional)</Label>
          <Textarea
            value={sectionsText}
            onChange={(e) => setSectionsText(e.target.value)}
            placeholder="One per line or comma-separated"
            rows={4}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create community"}
        </Button>
      </form>
    </div>
  );
}
