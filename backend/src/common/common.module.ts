import { Global, Module } from '@nestjs/common';
import { ProfileLookupService } from './profile-lookup.service';

@Global()
@Module({
  providers: [ProfileLookupService],
  exports: [ProfileLookupService],
})
export class CommonModule {}
