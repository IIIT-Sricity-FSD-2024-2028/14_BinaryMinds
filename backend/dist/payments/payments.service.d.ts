import { PaymentsRepository } from './payments.repository';
import { Payment } from './payment.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApplicationsService } from '../applications/applications.service';
export declare class PaymentsService {
    private readonly repository;
    private readonly applicationsService;
    constructor(repository: PaymentsRepository, applicationsService: ApplicationsService);
    findAll(): Payment[];
    findOne(id: number): Payment;
    findByApplication(applicationId: number): Payment[];
    create(data: CreatePaymentDto): Payment;
    update(id: number, updateData: Partial<Payment>): Payment;
    verifyPayment(id: number, transactionId: string | undefined, isSuccessful: boolean): Payment;
    remove(id: number): void;
}
