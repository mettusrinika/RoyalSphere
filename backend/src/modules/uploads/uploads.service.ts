import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { UploadApiResponse } from 'cloudinary';
import cloudinary from '../../config/cloudinary.config';

@Injectable()
export class UploadsService {

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {

    if (!file) {
      throw new BadRequestException(
        'No file uploaded',
      );
    }

    return new Promise((resolve, reject) => {

      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'image',
          },
          (error, result) => {

            if (error) {
              return reject(error);
            }

            resolve(result as UploadApiResponse);

          },
        )
        .end(file.buffer);

    });
  }

  async deleteImage(
    publicId: string,
  ) {
    return cloudinary.uploader.destroy(publicId);
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder:string,
){
    const uploads =
        await Promise.all(

            files.map(file=>
                this.uploadImage(
                    file,
                    folder,
                ),
            ),

        );

    return uploads;
}
}