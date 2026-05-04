import { LicensesRepository } from './licenses.repository';
import { License } from './license.interface';
import { CreateLicenseDto } from './dto/create-license.dto';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';
export declare class LicensesService {
    private readonly repository;
    private readonly applicationsService;
    private readonly usersService;
    constructor(repository: LicensesRepository, applicationsService: ApplicationsService, usersService: UsersService);
    findAll(): License[];
    findOne(id: number): License;
    findByApplication(applicationId: number): License;
    findByLicenseNumber(licenseNumber: string): License;
    private generateLicenseNumber;
    create(data: CreateLicenseDto): License;
    update(id: number, updateData: Partial<License>): License;
    suspend(id: number): License;
    revoke(id: number): License;
    renew(id: number, newExpiryDate: Date): License;
    remove(id: number): void;
}
