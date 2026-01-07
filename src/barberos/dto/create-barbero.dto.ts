import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateBarberoDto {
  @IsString()
  fullname: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}