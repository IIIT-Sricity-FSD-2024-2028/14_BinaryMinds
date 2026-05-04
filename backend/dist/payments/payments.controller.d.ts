import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(createDto: CreatePaymentDto): import("./payment.interface").Payment;
    findAll(): import("./payment.interface").Payment[];
    findByApplication(applicationId: number): import("./payment.interface").Payment[];
    findOne(id: number): import("./payment.interface").Payment;
    update(id: number, updateDto: UpdatePaymentDto): import("./payment.interface").Payment;
    verifyPayment(id: number, verifyDto: VerifyPaymentDto): import("./payment.interface").Payment;
    remove(id: number): void;
}
