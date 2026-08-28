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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const applications_repository_1 = require("./applications.repository");
const application_status_enum_1 = require("../common/enums/application-status.enum");
const users_service_1 = require("../users/users.service");
const officers_service_1 = require("../officers/officers.service");
let ApplicationsService = class ApplicationsService {
    applicationsRepository;
    usersService;
    officersService;
    constructor(applicationsRepository, usersService, officersService) {
        this.applicationsRepository = applicationsRepository;
        this.usersService = usersService;
        this.officersService = officersService;
    }
    findAll() {
        return this.applicationsRepository.find();
    }
    findAllWithApplicantDetails() {
        const apps = this.findAll();
        return apps.map((app) => {
            const applicant = this.usersService.findOne(app.applicant_id);
            return {
                ...app,
                applicant,
            };
        });
    }
    findOne(id) {
        const application = this.applicationsRepository.findById(id);
        if (!application) {
            throw new common_1.NotFoundException(`Application with ID ${id} not found`);
        }
        return application;
    }
    findOneWithApplicantDetails(id) {
        const application = this.findOne(id);
        const applicant = this.usersService.findOne(application.applicant_id);
        return {
            ...application,
            applicant,
        };
    }
    findByApplicant(applicantId) {
        this.usersService.findOne(applicantId);
        return this.applicationsRepository.findByApplicant(applicantId);
    }
    create(applicationData) {
        this.usersService.findOne(applicationData.applicant_id);
        const newAppRecord = {
            ...applicationData,
            application_status: application_status_enum_1.ApplicationStatus.SUBMITTED,
            paymentDone: true,
            assignedOfficerId: null,
        };
        return this.applicationsRepository.create(newAppRecord);
    }
    createSimple(data, applicantId) {
        this.usersService.findOne(applicantId);
        const newAppRecord = {
            applicant_id: applicantId,
            full_name: data.applicantName,
            business_name: data.businessName || 'N/A',
            business_type: data.tradeCategory || 'General',
            trade_category: data.tradeCategory || 'General',
            shop_address: data.shopAddress || '',
            applicant_phone: data.phone || '',
            application_status: application_status_enum_1.ApplicationStatus.SUBMITTED,
            paymentDone: false,
            assignedOfficerId: null,
        };
        return this.applicationsRepository.create(newAppRecord);
    }
    findSubmitted() {
        return this.applicationsRepository
            .findByStatus(application_status_enum_1.ApplicationStatus.SUBMITTED)
            .filter((app) => app.paymentDone === true);
    }
    assignToOfficer(id, officerId) {
        const application = this.findOne(id);
        if (application.application_status !== application_status_enum_1.ApplicationStatus.SUBMITTED) {
            throw new common_1.BadRequestException(`Application ${id} is not in 'submitted' status (current: ${application.application_status})`);
        }
        const assignedId = officerId !== undefined ? officerId : this.officersService.findLeastLoaded().id;
        const updated = this.applicationsRepository.update(id, {
            assignedOfficerId: assignedId,
            application_status: application_status_enum_1.ApplicationStatus.ASSIGNED,
        });
        if (!updated) {
            throw new common_1.NotFoundException(`Application with ID ${id} not found during assignment`);
        }
        return updated;
    }
    findByOfficer(officerId) {
        return this.applicationsRepository.findByOfficer(officerId);
    }
    verify(id) {
        const application = this.findOne(id);
        if (application.application_status !== application_status_enum_1.ApplicationStatus.ASSIGNED) {
            throw new common_1.BadRequestException(`Application ${id} is not in 'assigned' status (current: ${application.application_status})`);
        }
        const updated = this.applicationsRepository.update(id, {
            application_status: application_status_enum_1.ApplicationStatus.VERIFIED,
        });
        if (!updated) {
            throw new common_1.NotFoundException(`Application with ID ${id} not found during verification`);
        }
        return updated;
    }
    update(id, updateData) {
        const existingApplication = this.findOne(id);
        if (updateData.application_status &&
            updateData.application_status !== existingApplication.application_status) {
            this.validateStatusTransition(existingApplication.application_status, updateData.application_status);
        }
        const updatedApplication = this.applicationsRepository.update(id, updateData);
        if (!updatedApplication) {
            throw new common_1.NotFoundException(`Application with ID ${id} not found during update`);
        }
        return updatedApplication;
    }
    remove(id) {
        this.findOne(id);
        this.applicationsRepository.delete(id);
    }
    validateStatusTransition(currentStatus, newStatus) {
        const allowedTransitions = {
            [application_status_enum_1.ApplicationStatus.SUBMITTED]: [
                application_status_enum_1.ApplicationStatus.ASSIGNED,
                application_status_enum_1.ApplicationStatus.VERIFIED,
                application_status_enum_1.ApplicationStatus.DOCUMENTS_UPLOADED,
                application_status_enum_1.ApplicationStatus.APPROVED,
                application_status_enum_1.ApplicationStatus.REJECTED,
            ],
            [application_status_enum_1.ApplicationStatus.ASSIGNED]: [
                application_status_enum_1.ApplicationStatus.VERIFIED,
                application_status_enum_1.ApplicationStatus.REJECTED,
            ],
            [application_status_enum_1.ApplicationStatus.VERIFIED]: [
                application_status_enum_1.ApplicationStatus.DOCUMENTS_UPLOADED,
                application_status_enum_1.ApplicationStatus.INSPECTION_SCHEDULED,
                application_status_enum_1.ApplicationStatus.APPROVED,
                application_status_enum_1.ApplicationStatus.REJECTED,
            ],
            [application_status_enum_1.ApplicationStatus.DOCUMENTS_UPLOADED]: [
                application_status_enum_1.ApplicationStatus.INSPECTION_SCHEDULED,
                application_status_enum_1.ApplicationStatus.REJECTED,
            ],
            [application_status_enum_1.ApplicationStatus.INSPECTION_SCHEDULED]: [
                application_status_enum_1.ApplicationStatus.INSPECTION_COMPLETED,
                application_status_enum_1.ApplicationStatus.REJECTED,
            ],
            [application_status_enum_1.ApplicationStatus.INSPECTION_COMPLETED]: [
                application_status_enum_1.ApplicationStatus.DEPARTMENT_REVIEW,
                application_status_enum_1.ApplicationStatus.REJECTED,
            ],
            [application_status_enum_1.ApplicationStatus.DEPARTMENT_REVIEW]: [
                application_status_enum_1.ApplicationStatus.APPROVED,
                application_status_enum_1.ApplicationStatus.REJECTED,
            ],
            [application_status_enum_1.ApplicationStatus.APPROVED]: [],
            [application_status_enum_1.ApplicationStatus.REJECTED]: [],
        };
        const validNextStates = allowedTransitions[currentStatus] || [];
        if (!validNextStates.includes(newStatus)) {
            throw new common_1.BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => officers_service_1.OfficersService))),
    __metadata("design:paramtypes", [applications_repository_1.ApplicationsRepository,
        users_service_1.UsersService,
        officers_service_1.OfficersService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map