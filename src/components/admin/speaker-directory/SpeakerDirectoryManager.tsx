"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Mic,
  Plus,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  fetchAdminSpeakers,
  createAdminSpeaker,
  updateAdminSpeaker,
  deleteAdminSpeaker,
  reorderAdminSpeakers,
} from "@/lib/api";
import type {
  EventSpeaker,
  EventSpeakerCreate,
  EventSpeakerUpdate,
  EventSpeakerOrderItem,
} from "@/lib/types";
import { COMMUNITY_DAY_EVENT_SLUG } from "@/components/sponsor/communityDayConfig";

interface SpeakerFormData {
  name: string;
  role: string;
  company: string;
  photoUrl: string;
  topicImageUrl: string;
  talkTitle: string;
  talkFormat: string;
  bio: string;
  socialUrl: string;
  isActive: boolean;
}

const INITIAL_FORM: SpeakerFormData = {
  name: "",
  role: "",
  company: "",
  photoUrl: "",
  topicImageUrl: "",
  talkTitle: "",
  talkFormat: "Keynote",
  bio: "",
  socialUrl: "",
  isActive: true,
};

export function SpeakerDirectoryManager() {
  const [eventSlug] = useState(COMMUNITY_DAY_EVENT_SLUG);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Form Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<EventSpeaker | null>(null);
  const [formData, setFormData] = useState<SpeakerFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Dialog state
  const [deleteTarget, setDeleteTarget] = useState<EventSpeaker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load speakers
  const loadSpeakers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminSpeakers(eventSlug);
      setSpeakers(res.speakers || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load speakers directory");
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    loadSpeakers();
  }, [loadSpeakers]);

  // Filtered speakers
  const filteredSpeakers = useMemo(() => {
    return speakers.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.talkTitle.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        (s.company && s.company.toLowerCase().includes(q)) ||
        (s.talkFormat && s.talkFormat.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && s.isActive) ||
        (statusFilter === "INACTIVE" && !s.isActive);

      return matchSearch && matchStatus;
    });
  }, [speakers, searchQuery, statusFilter]);

  // Derived stats
  const stats = useMemo(() => {
    const total = speakers.length;
    const active = speakers.filter((s) => s.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [speakers]);

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingSpeaker(null);
    setFormData(INITIAL_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (speaker: EventSpeaker) => {
    setEditingSpeaker(speaker);
    setFormData({
      name: speaker.name,
      role: speaker.role,
      company: speaker.company || "",
      photoUrl: speaker.photoUrl,
      topicImageUrl: speaker.topicImageUrl || "",
      talkTitle: speaker.talkTitle,
      talkFormat: speaker.talkFormat || "Keynote",
      bio: speaker.bio || "",
      socialUrl: speaker.socialUrl || "",
      isActive: speaker.isActive,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  // Submit Form (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.role.trim() || !formData.talkTitle.trim() || !formData.photoUrl.trim()) {
      setFormError("Please fill out Speaker Name, Role, Photo URL, and Talk Title.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (editingSpeaker) {
        const payload: EventSpeakerUpdate = {
          name: formData.name.trim(),
          role: formData.role.trim(),
          company: formData.company.trim() || null,
          photoUrl: formData.photoUrl.trim(),
          topicImageUrl: formData.topicImageUrl.trim() || null,
          talkTitle: formData.talkTitle.trim(),
          talkFormat: formData.talkFormat.trim() || null,
          bio: formData.bio.trim() || null,
          socialUrl: formData.socialUrl.trim() || null,
          isActive: formData.isActive,
        };
        const updated = await updateAdminSpeaker(eventSlug, editingSpeaker.id, payload);
        setSpeakers((prev) =>
          prev.map((s) => (s.id === editingSpeaker.id ? updated : s))
        );
      } else {
        const payload: EventSpeakerCreate = {
          name: formData.name.trim(),
          role: formData.role.trim(),
          company: formData.company.trim() || null,
          photoUrl: formData.photoUrl.trim(),
          topicImageUrl: formData.topicImageUrl.trim() || null,
          talkTitle: formData.talkTitle.trim(),
          talkFormat: formData.talkFormat.trim() || null,
          bio: formData.bio.trim() || null,
          socialUrl: formData.socialUrl.trim() || null,
          isActive: formData.isActive,
        };
        const created = await createAdminSpeaker(eventSlug, payload);
        setSpeakers((prev) => [...prev, created]);
      }
      setDialogOpen(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save speaker");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active
  const handleToggleActive = async (speaker: EventSpeaker) => {
    const nextState = !speaker.isActive;
    // Optimistic update
    setSpeakers((prev) =>
      prev.map((s) => (s.id === speaker.id ? { ...s, isActive: nextState } : s))
    );
    try {
      await updateAdminSpeaker(eventSlug, speaker.id, {
        name: speaker.name,
        role: speaker.role,
        company: speaker.company,
        photoUrl: speaker.photoUrl,
        topicImageUrl: speaker.topicImageUrl,
        talkTitle: speaker.talkTitle,
        talkFormat: speaker.talkFormat,
        bio: speaker.bio,
        socialUrl: speaker.socialUrl,
        isActive: nextState,
      });
    } catch (err: any) {
      // Revert on error
      setSpeakers((prev) =>
        prev.map((s) => (s.id === speaker.id ? { ...s, isActive: !nextState } : s))
      );
      alert(err?.message || "Failed to update speaker status");
    }
  };

  // Delete Speaker
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteAdminSpeaker(eventSlug, deleteTarget.id);
      setSpeakers(res.speakers || []);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err?.message || "Failed to delete speaker");
    } finally {
      setIsDeleting(false);
    }
  };

  // Reorder up/down
  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= speakers.length) return;

    const newSpeakers = [...speakers];
    const temp = newSpeakers[index];
    newSpeakers[index] = newSpeakers[targetIndex];
    newSpeakers[targetIndex] = temp;

    // Optimistically update
    setSpeakers(newSpeakers);

    const items: EventSpeakerOrderItem[] = newSpeakers.map((s, idx) => ({
      id: s.id,
      displayOrder: idx + 1,
    }));

    try {
      await reorderAdminSpeakers(eventSlug, items);
    } catch (err: any) {
      // Revert on error
      setSpeakers(speakers);
      alert(err?.message || "Failed to save speaker order");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Speakers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">
                {stats.total}
              </span>
              <Mic className="h-5 w-5 text-primary opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active / Visible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-emerald-500">
                {stats.active}
              </span>
              <CheckCircle2 className="h-5 w-5 text-emerald-500 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Hidden / Draft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-muted-foreground">
                {stats.inactive}
              </span>
              <XCircle className="h-5 w-5 text-muted-foreground opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar: Search, Filters, Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/80 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search speaker, talk title, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              value={statusFilter}
              onValueChange={(v: "ALL" | "ACTIVE" | "INACTIVE") => setStatusFilter(v)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active Only</SelectItem>
                <SelectItem value="INACTIVE">Hidden Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={loadSpeakers}
            title="Refresh list"
            className="cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={handleOpenAdd}
            className="gap-2 cursor-pointer bg-primary text-primary-foreground font-semibold shadow"
          >
            <Plus className="h-4 w-4" />
            Add Speaker
          </Button>
        </div>
      </div>

      {/* Main Speakers List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-card border border-border/80 rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading speakers…</p>
        </div>
      ) : error ? (
        <div className="bg-card border border-border/80 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={loadSpeakers} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      ) : filteredSpeakers.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
          <Mic className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="font-semibold text-foreground">No speakers found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || statusFilter !== "ALL"
              ? "No speakers match the current filter criteria."
              : "No speakers added yet. Click 'Add Speaker' to get started."}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm divide-y divide-border/60">
          {filteredSpeakers.map((speaker, index) => {
            const rawIndex = speakers.findIndex((s) => s.id === speaker.id);
            const canMoveUp = rawIndex > 0;
            const canMoveDown = rawIndex < speakers.length - 1;

            return (
              <div
                key={speaker.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                {/* Speaker Info, Topic Banner & Avatar */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    {speaker.topicImageUrl && (
                      <div className="hidden sm:block w-20 aspect-[16/9] rounded-xl overflow-hidden border border-border bg-muted shrink-0">
                        <img
                          src={speaker.topicImageUrl}
                          alt={speaker.talkTitle}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <Avatar className="h-12 w-12 rounded-xl border border-border shrink-0 shadow-sm">
                      <AvatarImage src={speaker.photoUrl} alt={speaker.name} className="object-cover" />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
                        {speaker.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-foreground text-base truncate">
                        {speaker.name}
                      </h4>
                      {speaker.talkFormat && (
                        <Badge
                          variant="secondary"
                          className="text-[11px] px-2 py-0 bg-orange-500/10 text-orange-400 border border-orange-500/20"
                        >
                          {speaker.talkFormat}
                        </Badge>
                      )}
                      {speaker.isActive ? (
                        <Badge className="text-[11px] px-2 py-0 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] px-2 py-0 text-muted-foreground">
                          Hidden
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground truncate">
                      {speaker.role} {speaker.company ? `· ${speaker.company}` : ""}
                    </p>

                    <p className="text-xs font-semibold text-foreground truncate max-w-xl">
                      🎙️ {speaker.talkTitle}
                    </p>
                  </div>
                </div>

                {/* Actions: Reorder, Active Toggle, Edit, Delete */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 mr-2 border border-border/50">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={!canMoveUp}
                      onClick={() => handleMoveOrder(rawIndex, "up")}
                      className="h-7 w-7 rounded cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={!canMoveDown}
                      onClick={() => handleMoveOrder(rawIndex, "down")}
                      className="h-7 w-7 rounded cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-2 mr-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(speaker)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                        speaker.isActive ? "bg-emerald-500" : "bg-muted-foreground/30"
                      )}
                      role="switch"
                      aria-checked={speaker.isActive}
                      title={speaker.isActive ? "Visible on site (Click to hide)" : "Hidden from site (Click to show)"}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                          speaker.isActive ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {/* Edit */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(speaker)}
                    className="gap-1.5 cursor-pointer text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>

                  {/* Delete */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(speaker)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Speaker Modal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSpeaker ? "Edit Speaker" : "Add New Speaker"}
            </DialogTitle>
            <DialogDescription>
              Configure the featured speaker details, session topic, and public visibility.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 text-xs rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sp-name">Speaker Name *</Label>
                <Input
                  id="sp-name"
                  placeholder="e.g. Donnie Prakoso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sp-role">Role / Job Title *</Label>
                <Input
                  id="sp-role"
                  placeholder="e.g. Principal Developer Advocate"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sp-company">Company</Label>
                <Input
                  id="sp-company"
                  placeholder="e.g. AWS"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sp-photo">Profile Photo URL *</Label>
                <Input
                  id="sp-photo"
                  placeholder="https://..."
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sp-topic-img">Topic / Session Banner Image URL</Label>
              <Input
                id="sp-topic-img"
                placeholder="https://... (16:9 cover banner image for session topic)"
                value={formData.topicImageUrl}
                onChange={(e) => setFormData({ ...formData, topicImageUrl: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="sp-talk">Talk / Session Title *</Label>
                <Input
                  id="sp-talk"
                  placeholder="e.g. Keynote: The Future of Cloud & Generative AI"
                  value={formData.talkTitle}
                  onChange={(e) => setFormData({ ...formData, talkTitle: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sp-format">Talk Format</Label>
                <Select
                  value={formData.talkFormat}
                  onValueChange={(val) => setFormData({ ...formData, talkFormat: val })}
                >
                  <SelectTrigger id="sp-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Keynote">Keynote</SelectItem>
                    <SelectItem value="Technical Track">Technical Track</SelectItem>
                    <SelectItem value="Lightning Talk">Lightning Talk</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Panel Discussion">Panel Discussion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sp-bio">Short Bio</Label>
              <Textarea
                id="sp-bio"
                placeholder="Brief background of the speaker..."
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="space-y-1.5">
                <Label htmlFor="sp-social">Social / LinkedIn URL</Label>
                <Input
                  id="sp-social"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.socialUrl}
                  onChange={(e) => setFormData({ ...formData, socialUrl: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2 sm:pt-6">
                <Checkbox
                  id="sp-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: Boolean(checked) })}
                />
                <Label htmlFor="sp-active" className="cursor-pointer text-xs font-medium">
                  Visible to Public
                </Label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingSpeaker ? (
                  "Update Speaker"
                ) : (
                  "Create Speaker"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Speaker</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-semibold text-foreground">{deleteTarget?.name}</span> from the speaker directory? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Speaker"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
