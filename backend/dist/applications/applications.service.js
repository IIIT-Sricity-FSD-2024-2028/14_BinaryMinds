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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const applications_repository_1 = require("./applications.repository");
const application_status_enum_1 = require("../common/enums/application-status.enum");
const users_service_1 = require("../users/users.service");
let ApplicationsService = class ApplicationsService {
    applicationsRepository;
    usersService;
    constructor(applicationsRepository, usersService) {
        this.applicationsRepository = applicationsRepository;
        this.usersService = usersService;
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
        };
        return this.applicationsRepository.create(newAppRecord);
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
                application_status_enum_1.ApplicationStatus.DOCUMENTS_UPLOADED,
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
    __metadata("design:paramtypes", [applications_repository_1.ApplicationsRepository,
        users_service_1.UsersService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map