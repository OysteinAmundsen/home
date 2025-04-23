import { Controller, Post, UploadedFile } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags, ApiUnsupportedMediaTypeResponse } from '@nestjs/swagger';
import { spawn } from 'node:child_process';
import { ApiFile } from '../../shared/api-file.decorator';
import { fileMimetypeFilter } from '../../shared/file-mimetype.filter';
import { TranscribeResponse } from './transcribe.model';

/**
 * The controller for the /api/transcribe route.
 *
 * @param server
 */
@ApiTags('transcribe')
@Controller('api/transcribe')
export class TranscribeController {
  /**
   * Fetch all widgets.
   */
  @Post()
  @ApiOperation({ summary: 'Transcribe audio file' })
  @ApiFile({
    fieldName: 'file',
    description: 'The audio file to be transcribed',
    required: true,
    localOptions: { fileFilter: fileMimetypeFilter(['audio']) },
  })
  @ApiOkResponse({ description: 'The transcription', type: TranscribeResponse })
  @ApiUnsupportedMediaTypeResponse({ description: 'Only supports audio filetypes' })
  transscribe(@UploadedFile() file: Express.Multer.File): Promise<TranscribeResponse> {
    if (!file) {
      throw new Error('File is undefined');
    }
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', ['apps/whisper/transcribe.py'], { stdio: ['pipe', 'pipe', 'pipe'] });

      pythonProcess.stdin.write(file.buffer); // Ensure binary data is written
      pythonProcess.stdin.end();

      let output = '';
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString('utf8');
      });

      pythonProcess.stderr.on('data', (data) => {
        reject(data.toString('utf8'));
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ status: 'Audio response', transcription: output });
        } else {
          reject(`Process exited with code ${code}`);
        }
      });
    });
  }
}
