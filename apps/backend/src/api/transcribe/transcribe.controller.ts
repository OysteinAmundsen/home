import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { spawn } from 'node:child_process';

/**
 * The controller for the /api/transcribe route.
 *
 * @param server
 */
@Controller('api/transcribe')
export class TranscribeController {
  /**
   * Fetch all widgets.
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  transscribe(@UploadedFile() file: Express.Multer.File) {
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
