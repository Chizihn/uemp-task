import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

/** Uploads a server-generated report PDF to Cloudinary and hands back a forced-download URL. */
@Injectable()
export class ReportExportService {
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

  async uploadPdf(buffer: Buffer, publicId: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Report export is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }

    const dataUri = `data:application/pdf;base64,${buffer.toString('base64')}`;
    // `raw` rather than `image`: Cloudinary blocks direct delivery of PDFs uploaded under the
    // `image` resource type by default (a security setting against untrusted-file execution),
    // silently serving a placeholder GIF instead. `raw` delivers the bytes as-is, no such block.
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'uemp/reports',
      public_id: `${publicId}.pdf`, // `raw` uploads need the extension in the public_id itself
      resource_type: 'raw',
      overwrite: true,
    });

    // fl_attachment forces a Content-Disposition: attachment response so the browser downloads
    // the file instead of trying to render it inline.
    return cloudinary.url(result.public_id, {
      resource_type: 'raw',
      type: 'upload',
      flags: 'attachment',
      secure: true,
      version: result.version,
    });
  }
}
