import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseUUIDPipe } from '@nestjs/common';
import { MensajesService } from './mensajes.service';
import { CreateMensajeDto } from './dto/create-mensaje.dto';
import { ReplyMensajeDto } from './dto/reply-mensaje.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // 👈 Importamos tu Guard
import { Roles } from 'src/auth/roles.decorator';

@Controller('mensajes')
@UseGuards(JwtAuthGuard) // 👈 Protege TODAS las rutas de este controlador
export class MensajesController {
    constructor(private readonly mensajesService: MensajesService) { }

    @Post()
    create(@Body() createDto: CreateMensajeDto, @Req() req: any) {
        return this.mensajesService.create(createDto, req.user.id);
    }

    @Get('mis-mensajes')
    findMyMessages(@Req() req: any) {
        return this.mensajesService.findMyMessages(req.user.id);
    }

    // STAFF: Ver buzón general (Todos los mensajes)
    // Recomendación: Agrega aquí un decorador de roles si tienes uno, ej: @Roles('ADMIN', 'BARBER')
    @Get('buzon-general')
    @Roles('ADMIN', 'BARBER')
    findAll() {
        return this.mensajesService.findAll();
    }

    // STAFF: Responder mensaje
    @Patch(':id/responder')
    reply(
        @Param('id', ParseUUIDPipe) id: string, // Valida que el ID sea UUID válido
        @Body() replyDto: ReplyMensajeDto,
        @Req() req: any
    ) {
        return this.mensajesService.reply(id, replyDto, req.user.id);
    }
    @Post(':id/reply')
    addReply(
        @Param('id') id: string,
        @Body('texto') texto: string,
        @Req() req: any
    ) {
        return this.mensajesService.addReply(id, texto, req.user.id);
    }

    // 🆕 BORRAR MENSAJE
    @Delete(':id') 
    remove(@Param('id') id: string, @Req() req: any) {
        const usuario = req.user;
        const esStaff = usuario.role === 'ADMIN' || usuario.role === 'BARBER';
        return this.mensajesService.softDeleteMensaje(id, esStaff);
    }
}