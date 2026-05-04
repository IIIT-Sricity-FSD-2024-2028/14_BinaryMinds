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
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const compliance_repository_1 = require("./compliance.repository");
const compliance_status_enum_1 = require("../common/enums/compliance-status.enum");
const licenses_service_1 = require("../licenses/licenses.service");
const users_service_1 = require("../users/users.service");
let ComplianceService = class ComplianceService {
    repository;
    licensesService;
    usersService;
    constructor(repository, licensesService, usersService) {
        this.repository = repository;
        this.licensesService = licensesService;
        this.usersService = usersService;
    }
    findAll() {
        return this.repository.find();
    }
    findOne(id) {
        const record = this.repository.findById(id);
        if (!record) {
            throw new common_1.NotFoundException(`Compliance Record with ID ${id} not found`);
        }
        return record;
    }
    findByLicense(licenseId) {
        return this.repository.findByLicense(licenseId);
    }
    findByFieldOfficer(fieldOfficerId) {
        return this.repository.findByFieldOfficer(fieldOfficerId);
    }
    create(data) {
        this.licensesService.findOne(data.license_id);
        this.usersService.findOne(data.field_officer_id);
        return this.repository.create({
            ...data,
            status: data.status || compliance_status_enum_1.ComplianceStatus.ISSUED,
        });
    }
    update(id, updateData) {
        this.findOne(id);
        const updated = this.repository.update(id, updateData);
        if (!updated) {
            throw new common_1.NotFoundException(`Compliance Record with ID ${id} not found`);
        }
        return updated;
    }
    resolveWarning(id) {
        const existing = this.findOne(id);
        if (existing.status === compliance_status_enum_1.ComplianceStatus.RESOLVED) {
            throw new common_1.BadRequestException('Warning is already resolved');
        }
        return this.update(id, {
            status: compliance_status_enum_1.ComplianceStatus.RESOLVED,
            resolved_at: new Date(),
        });
    }
    escalateWarning(id) {
        const existing = this.findOne(id);
        if (existing.status === compliance_status_enum_1.ComplianceStatus.ESCALATED) {
            throw new common_1.BadRequestException('Warning is already escalated');
        }
        if (existing.status === compliance_status_enum_1.ComplianceStatus.RESOLVED) {
            throw new common_1.BadRequestException('Cannot escalate a resolved warning');
        }
        return this.update(id, {
            status: compliance_status_enum_1.ComplianceStatus.ESCALATED,
        });
    }
    remove(id) {
        this.findOne(id);
        this.repository.delete(id);
    }
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [compliance_repository_1.ComplianceRepository,
        licenses_service_1.LicensesService,
        users_service_1.UsersService])
], ComplianceService);
//# sourceMappingURL=compliance.service.js.map