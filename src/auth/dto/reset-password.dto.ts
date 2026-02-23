import { IsEmail, IsString, Matches, IsNotEmpty } from 'class-validator';

export class VerifyCodeDto {
    @IsEmail({}, { message: 'Formato de email inválido' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'El código es requerido' })
    codigo: string;
}

export class ResetPasswordDto {
    @IsEmail({}, { message: 'Formato de email inválido' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'El código es requerido' })
    codigo: string;

    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
        message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo especial.',
    })

    newPassword: string;
}