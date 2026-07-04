import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';

import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

import { UploadsService } from './uploads.service';
import { UploadResponseDto } from './dto/upload-response.dto';


@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly uploadsService: UploadsService,
  ) {}

  // =====================================================
  // Avatar Upload
  // =====================================================

  @Post('avatar')
@ApiOperation({
  summary: 'Upload user avatar',
})
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@ApiResponse({
  status: 201,
  type: UploadResponseDto,
})
@UseInterceptors(
  FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
      if (
        !file.mimetype.match(
          /^image\/(jpeg|jpg|png|webp)$/i,
        )
      ) {
        return callback(
          new BadRequestException(
            'Only JPG, PNG and WEBP images are allowed.',
          ),
          false,
        );
      }

      callback(null, true);
    },
  }),
)
async uploadAvatar(
  @UploadedFile()
  file: Express.Multer.File,
) {
  return this.uploadsService.uploadImage(
    file,
    'OMIQORA/avatars',
  );
}

  // =====================================================
  // Service Images
  // =====================================================

  @Post('service-image')
@UseInterceptors(
  FileInterceptor('file', {
    storage: memoryStorage(),

    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  }),
)
async uploadServiceImage(
  @UploadedFile()
  file: Express.Multer.File,
) {
  return this.uploadsService.uploadImage(
    file,
    'OMIQORA/services',
  );
}
@Post('service-images')
@ApiOperation({
  summary: 'Upload multiple service images',
})
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      files: {
        type: 'array',
        items: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  },
})
@UseInterceptors(
  FilesInterceptor(
    'files',
    10,
    {
      storage: memoryStorage(),

      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    },
  ),
)
async uploadServiceImages(
  @UploadedFiles()
  files: Express.Multer.File[],
) {
  return this.uploadsService.uploadMultipleImages(
    files,
    'OMIQORA/services',
  );
}
  // =====================================================
  // Review Images
  // =====================================================

  @Post('review-image')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async uploadReviewImage(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadImage(
      file,
      'OMIQORA/reviews',
    );
  }

  // =====================================================
  // Vendor Documents
  // =====================================================

  @Post('vendor-document')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
  FileInterceptor('file', {
    storage: memoryStorage(),

    limits: {
      fileSize: 20 * 1024 * 1024,
    },

    fileFilter: (req, file, callback) => {
      if (
        !file.mimetype.match(
          /^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/i,
        )
      ) {
        return callback(
          new BadRequestException(
            'Only PDF, JPG, PNG and WEBP are allowed.',
          ),
          false,
        );
      }

      callback(null, true);
    },
  }),
)
  async uploadVendorDocument(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.uploadsService.uploadImage(
      file,
      'OMIQORA/vendor-documents',
    );
  }

  // =====================================================
  // Delete
  // =====================================================

  @Delete(':publicId')
  @ApiOperation({
    summary: 'Delete uploaded image',
  })
  async delete(
    @Param('publicId')
    publicId: string,
  ) {
    return this.uploadsService.deleteImage(
      publicId,
    );
  }
}