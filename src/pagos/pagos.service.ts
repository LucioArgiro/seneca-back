import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { Pago } from './entities/pago.entity';
import { Turno, EstadoTurno } from '../turno/entities/turno.entity';

@Injectable()
export class PagosService {
    private client: MercadoPagoConfig;
    private readonly logger = new Logger(PagosService.name);

    constructor(
        @InjectRepository(Pago) private readonly pagoRepo: Repository<Pago>,
        @InjectRepository(Turno) private readonly turnoRepo: Repository<Turno>,
        private readonly dataSource: DataSource // Para transacciones seguras
    ) {
        this.client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN ?? ''
        });
    }

    async crearPreferencia(turno: any, tipoPago: 'SENIA' | 'TOTAL') {
        const webhookBaseUrl = process.env.WEBHOOK_URL;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        if (!webhookBaseUrl) {
            console.warn('⚠️ OJO: No configuraste WEBHOOK_URL en el .env');
        }
        const precioTotal = Number(turno.servicio.precio);
        const precioSenia = turno.barbero.precioSenia || 2000;
        let montoACobrar = 0;
        let tituloItem = '';

        if (tipoPago === 'SENIA') {
            montoACobrar = precioSenia;
            const saldo = precioTotal - precioSenia;
            tituloItem = `Seña: ${turno.servicio.nombre} (Saldo a pagar en local: $${saldo})`;
        } else {
            montoACobrar = precioTotal;
            tituloItem = `Servicio Completo: ${turno.servicio.nombre}`;
        }
        const preference = new Preference(this.client);
        const fechaExpiracion = new Date();
        fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 15); // Expira en 15 minutos
        const resultado = await preference.create({
            body: {
                items: [
                    {
                        id: turno.servicio.id,
                        title: tituloItem,
                        quantity: 1,
                        unit_price: montoACobrar,
                        currency_id: 'ARS',
                    },
                ],
                external_reference: turno.id,
                back_urls: {
                    success: `${frontendUrl}/panel?status=success`,
                    failure: `${frontendUrl}/reservar?status=failure`,
                    pending: `${frontendUrl}/panel?status=pending`,
                },
                auto_return: 'approved',
                notification_url: webhookBaseUrl,
                date_of_expiration: fechaExpiracion.toISOString(),
            }
        });
        return { url: resultado.init_point };
    } catch(error) {
        this.logger.error(`❌ Error al crear preferencia en Mercado Pago: ${error.message}`);
        throw new ConflictException('Hubo un error al generar el link de pago. Intenta nuevamente.');
    }


    async checkPayment(paymentId: string) {
        const payment = new Payment(this.client);
        const pago = await payment.get({ id: paymentId });
        return {
            status: pago.status,
            turnoId: pago.external_reference
        };
    }

    async procesarPagoExitoso(paymentId: string) {

        const paymentClient = new Payment(this.client);
        const pagoMP = await paymentClient.get({ id: paymentId });
        if (pagoMP.status !== 'approved') {
            this.logger.warn(`Pago ${paymentId} no aprobado. Status: ${pagoMP.status}`);
            return;
        }
        const pagoExistente = await this.pagoRepo.findOne({ where: { paymentId: String(pagoMP.id) } });
        if (pagoExistente) {
            this.logger.log(`El pago ${paymentId} ya fue procesado.`);
            return;
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const turnoId = pagoMP.external_reference;
            const turno = await queryRunner.manager.findOne(Turno, {
                where: { id: turnoId }
            });

            if (!turno) throw new NotFoundException('Turno no encontrado para este pago');
            const nuevoPago = this.pagoRepo.create({
                paymentId: String(pagoMP.id),
                monto: pagoMP.transaction_amount,
                montoNeto: pagoMP.transaction_details?.net_received_amount ?? pagoMP.transaction_amount,
                estado: pagoMP.status,
                tipoPago: pagoMP.payment_type_id,
                marcaTarjeta: pagoMP.payment_method_id,
                turno: turno
            });
            await queryRunner.manager.save(nuevoPago);
            turno.estado = EstadoTurno.CONFIRMADO;
            await queryRunner.manager.save(turno);
            await queryRunner.commitTransaction();

            this.logger.log(`✅ Turno ${turnoId} confirmado con pago ${paymentId}`);

        } catch (error) {
            this.logger.error(`Error en transacción: ${error.message}`);
            await queryRunner.rollbackTransaction();
        } finally {

            await queryRunner.release();
        }
    }
}