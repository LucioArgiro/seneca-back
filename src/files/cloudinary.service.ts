import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  uploadFile(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'barberia_perfiles', // Nombre de la carpeta en tu Cloudinary
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
async deleteFile(url: string): Promise<any> {
    const publicId = this.extractPublicIdFromUrl(url);
    if (!publicId) return null;
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
  private extractPublicIdFromUrl(url: string): string | null {
    const regex = /\/v\d+\/([^/]+)\/([^/]+)\.[a-z]+$/;
    const match = url.match(regex);
    
    if (match) {
        // match[1] es la carpeta, match[2] es el nombre del archivo
        return `${match[1]}/${match[2]}`; 
    }
    return null;
  }
}