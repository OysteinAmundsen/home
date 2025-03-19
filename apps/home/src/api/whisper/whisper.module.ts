import { Module } from '@nestjs/common';
import { WhisperController } from './whisper.controller';

@Module({
  controllers: [WhisperController],
})
export class WhisperModule {}
