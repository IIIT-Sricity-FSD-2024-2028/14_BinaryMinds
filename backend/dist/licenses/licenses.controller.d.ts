import { LicensesService } from './licenses.service';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { RenewLicenseDto } from './dto/renew-license.dto';
export declare class LicensesController {
    private readonly service;
    constructor(service: LicensesService);
    create(createDto: CreateLicenseDto): import("./license.interface").License;
    findAll(): import("./license.interface").License[];
    findByApplication(applicationId: number): import("./license.interface").License;
    findByLicenseNumber(licenseNumber: string): import("./license.interface").License;
    findOne(id: number): import("./license.interface").License;
    update(id: number, updateDto: UpdateLicenseDto): import("./license.interface").License;
    suspend(id: number): import("./license.interface").License;
    revoke(id: number): import("./license.interface").License;
    renew(id: number, renewDto: RenewLicenseDto): import("./license.interface").License;
    remove(id: number): void;
}
