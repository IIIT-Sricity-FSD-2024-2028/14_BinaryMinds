"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensesService = void 0;
const common_1 = require("@nestjs/common");
const licenses_repository_1 = require("./licenses.repository");
const license_status_enum_1 = require("../common/enums/license-status.enum");
const applications_service_1 = require("../applications/applications.service");
const users_service_1 = require("../users/users.service");
let LicensesService = class LicensesService {
    repository;
    applicationsService;
    usersService;
    constructor(repository, applicationsService, usersService) {
        this.repository = repository;
        this.applicationsService = applicationsService;
        this.usersService = usersService;
    }
    findAll() {
        return this.repository.find();
    }
    findOne(id) {
        const license = this.repository.findById(id);
        if (!license) {
            throw new common_1.NotFoundException(`License with ID ${id} not found`);
        }
        return license;
    }
    findByApplication(applicationId) {
        const license = this.repository.findByApplication(applicationId);
        if (!license) {
            throw new common_1.NotFoundException(`License for Application ID ${applicationId} not found`);
        }
        return license;
    }
    findByLicenseNumber(licenseNumber) {
        const license = this.repository.findByLicenseNumber(licenseNumber);
        if (!license) {
            throw new common_1.NotFoundException(`License with number ${licenseNumber} not found`);
        }
        return license;
    }
    generateLicenseNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const randomPortion = Math.floor(1000 + Math.random() * 9000);
        return `LIC-${year}${month}${day}-${randomPortion}`;
    }
    create(data) {
        this.applicationsService.findOne(data.application_id);
        this.usersService.findOne(data.issued_by);
        const existing = this.repository.findByApplication(data.application_id);
        if (existing) {
            throw new common_1.BadRequestException('Application already has an issued license');
        }
        const licenseNumber = this.generateLicenseNumber();
        return this.repository.create({
            application_id: data.application_id,
            issued_by: data.issued_by,
            license_number: licenseNumber,
            issued_date: new Date(),
            expiry_date: data.expiry_date,
            status: license_status_enum_1.LicenseStatus.ACTIVE,
        });
    }
    update(id, updateData) {
        this.findOne(id);
        const updated = this.repository.update(id, updateData);
        if (!updated) {
            throw new common_1.NotFoundException(`License with ID ${id} not found`);
        }
        return updated;
    }
    suspend(id) {
        const existing = this.findOne(id);
        if (existing.status === license_status_enum_1.LicenseStatus.REVOKED) {
            throw new common_1.BadRequestException('Cannot suspend a revoked license');
        }
        if (existing.status === license_status_enum_1.LicenseStatus.SUSPENDED) {
            throw new common_1.BadRequestException('License is already suspended');
        }
        return this.update(id, { status: license_status_enum_1.LicenseStatus.SUSPENDED });
    }
    revoke(id) {
        const existing = this.findOne(id);
        if (existing.status === license_status_enum_1.LicenseStatus.REVOKED) {
            throw new common_1.BadRequestException('License is already revoked');
        }
        return this.update(id, { status: license_status_enum_1.LicenseStatus.REVOKED });
    }
    renew(id, newExpiryDate) {
        const existing = this.findOne(id);
        if (existing.status === license_status_enum_1.LicenseStatus.REVOKED) {
            throw new common_1.BadRequestException('Cannot renew a revoked license');
        }
        const now = new Date();
        if (new Date(newExpiryDate) <= now) {
            throw new common_1.BadRequestException('Renewal expiry date must be in the future');
        }
        return this.update(id, {
            expiry_date: newExpiryDate,
            status: license_status_enum_1.LicenseStatus.ACTIVE,
        });
    }
    remove(id) {
        this.findOne(id);
        this.repository.delete(id);
    }
};
exports.LicensesService = LicensesService;
exports.LicensesService = LicensesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [licenses_repository_1.LicensesRepository,
        applications_service_1.ApplicationsService,
        users_service_1.UsersService])
], LicensesService);
//# sourceMappingURL=licenses.service.js.map