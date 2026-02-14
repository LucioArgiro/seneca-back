import { Body, Controller, Post, Res, Get, UseGuards, Req, Header, UseFilters } from '@nestjs/common';
import { type Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from '../usuario/dto/create-usuario.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { ThrottlerExceptionFilter } from '../common/filters/throttler-exception.filter'; // Ajusta la ruta

@Controller('auth')
@UseFilters(ThrottlerExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const { user, access_token } = await this.authService.login(body.email, body.password);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none', 
    });

    return { user };
  }


  @UseGuards(JwtAuthGuard)
  @Get('verify')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  async verify(@Req() req: any) {
    return { user: req.user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true
    });
    return { message: 'Sesión cerrada correctamente' };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() body: CreateUsuarioDto) {
    return this.authService.register(body);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('solicitar-recuperacion')
  solicitarRecuperacion(@Body() body: { email: string }) {
    return this.authService.solicitarRecuperacion(body.email);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('restablecer-password')
  restablecerPassword(@Body() body: { email: string, codigo: string, newPassword: string }) {
    return this.authService.restablecerPassword(body.email, body.codigo, body.newPassword);
  }
}