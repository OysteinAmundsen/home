import {
  Controller,
  forwardRef,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(@Inject(forwardRef(() => UploadsService)) private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload image file (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        originalName: { type: 'string' },
        url: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Bad request - Invalid file type or size' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file);
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Serve uploaded file' })
  @ApiOkResponse({ description: 'File served successfully' })
  @ApiNotFoundResponse({ description: 'File not found' })
  async serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const { filePath, exists } = await this.uploadsService.getFile(filename);

    if (!exists) {
      throw new NotFoundException('File not found');
    }

    return res.sendFile(filePath);
  }
}
