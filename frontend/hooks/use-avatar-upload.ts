"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as mediaApi from "@/lib/api/media";
import * as authApi from "@/lib/api/auth";
import { authKeys } from "@/lib/query-keys";
import { getErrorMessage } from "@/lib/api/client";

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const signature = await mediaApi.getAvatarUploadSignature();
      const avatarUrl = await mediaApi.uploadToCloudinary(signature, file);
      await authApi.updateMyProfile({ avatarUrl });
      return avatarUrl;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
      toast.success("Avatar updated");
    },
    onError: (error) => toast.error(getErrorMessage(error, "Could not upload avatar")),
  });
}
