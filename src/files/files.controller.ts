import {Controller, Post, Body, UseInterceptors, UploadedFile, BadRequestException, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('files')
export class FilesController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // Sin opciones = guarda en memoria (Buffer)
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // Máx 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }), // Solo imágenes
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se envió ningún archivo');
    const result = await this.cloudinaryService.uploadFile(file);
    return {
      url: result.secure_url, 
    };
  }

  @Post('delete')
  async deleteImage(@Body('url') url: string) {
    if (!url) return { message: 'URL no proporcionada' };
    
    await this.cloudinaryService.deleteFile(url);
    return { message: 'Imagen eliminada correctamente' };
  }
}