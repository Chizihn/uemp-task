import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.interface';
import { MediaService } from './media.service';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_AVATAR_BYTES } }))
  uploadAvatar(@UploadedFile() file: Express.Multer.File, @CurrentUser() actor: AuthUser) {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }
    return this.mediaService.uploadAvatar(actor.id, file);
  }
}
