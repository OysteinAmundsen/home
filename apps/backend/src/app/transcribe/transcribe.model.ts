import { ApiProperty } from '@nestjs/swagger';

export class TranscribeResponse {
  @ApiProperty({ type: 'string', description: 'The audio file to be transcribed' })
  status!: string;

  @ApiProperty({ type: 'string', description: 'The transcription of the audio file' })
  transcription!: string;
}
