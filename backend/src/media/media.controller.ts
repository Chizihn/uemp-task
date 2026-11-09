import { Controller, Post } from '@nestjs/common';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('avatar-upload-signature')
  getAvatarUploadSignature() {
    return this.mediaService.createAvatarUploadSignature();
  }
}
