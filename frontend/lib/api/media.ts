import axios from "axios";
import { apiClient, unwrap } from "./client";
import type { SignedUploadPayload } from "@/lib/types";

export type { SignedUploadPayload };

export function getAvatarUploadSignature() {
  return unwrap(
    apiClient.post<{ success: true; data: SignedUploadPayload }>(
      "/media/avatar-upload-signature",
    ),
  );
}

/** Uploads straight to Cloudinary — never through our backend — using the signed params above. */
export async function uploadToCloudinary(payload: SignedUploadPayload, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", payload.apiKey);
  formData.append("timestamp", String(payload.timestamp));
  formData.append("signature", payload.signature);
  formData.append("folder", payload.folder);

  const response = await axios.post<{ secure_url: string }>(payload.uploadUrl, formData);
  return response.data.secure_url;
}
