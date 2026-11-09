import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export interface SignedUploadPayload {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

/**
 * Issues a signed Cloudinary upload (the client uploads the file bytes
 * directly to Cloudinary with this signature, never through our server)
 * is saved by the caller via the existing `PATCH /users/me/profile`
 * endpoint, so no separate "save" endpoint is needed here.
 */
@Injectable()
export class MediaService {
  private readonly cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  private readonly apiKey = process.env.CLOUDINARY_API_KEY;
  private readonly apiSecret = process.env.CLOUDINARY_API_SECRET;

  constructor() {
    if (this.isConfigured()) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        secure: true,
      });
    }
  }

  private isConfigured(): boolean {
    return !!(this.cloudName && this.apiKey && this.apiSecret);
  }

  createAvatarUploadSignature(): SignedUploadPayload {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Avatar uploads are not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }

    const folder = 'uemp/avatars';
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, this.apiSecret!);

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      apiKey: this.apiKey!,
      timestamp,
      signature,
      folder,
    };
  }
}
