"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUploadAvatar } from "@/hooks/use-avatar-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB — fast client-side check before even attempting upload

interface AvatarUploadProps {
  src?: string | null;
  fallback: string;
}

export function AvatarUpload({ src, fallback }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Revoke the object URL whenever we're done with it, rather than leaking it.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file again later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function closeConfirm() {
    setPendingFile(null);
    setPreviewUrl(null);
  }

  function handleConfirm() {
    if (!pendingFile) return;
    uploadAvatar.mutate(pendingFile, { onSuccess: closeConfirm });
  }

  return (
    <>
      <div className="inline-block">
        <button
          type="button"
          aria-label="Upload profile photo"
          onClick={() => inputRef.current?.click()}
          className="group relative block rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar size="lg" className="size-20">
            <AvatarImage src={src ?? undefined} alt={fallback} />
            <AvatarFallback className="text-lg">{fallback}</AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-white opacity-0 transition-opacity group-hover:bg-black/40 group-hover:opacity-100">
            <Camera className="size-5" />
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Dialog open={!!pendingFile} onOpenChange={(open) => !open && closeConfirm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update profile photo?</DialogTitle>
            <DialogDescription>This replaces your current photo for everyone who can see your profile.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-2">
            <Avatar size="lg" className="size-24">
              <AvatarImage src={previewUrl ?? undefined} alt="Preview" />
              <AvatarFallback className="text-lg">{fallback}</AvatarFallback>
            </Avatar>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirm} disabled={uploadAvatar.isPending}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={uploadAvatar.isPending}>
              {uploadAvatar.isPending && <Loader2 className="size-4 animate-spin" />}
              Save photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
