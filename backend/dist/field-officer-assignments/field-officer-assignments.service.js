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
exports.FieldOfficerAssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const field_officer_assignments_repository_1 = require("./field-officer-assignments.repository");
const assignment_status_enum_1 = require("../common/enums/assignment-status.enum");
const applications_service_1 = require("../applications/applications.service");
const users_service_1 = require("../users/users.service");
let FieldOfficerAssignmentsService = class FieldOfficerAssignmentsService {
    repository;
    applicationsService;
    usersService;
    SLA_DAYS = 7;
    constructor(repository, applicationsService, usersService) {
        this.repository = repository;
        this.applicationsService = applicationsService;
        this.usersService = usersService;
    }
    findAll() {
        return this.repository.find();
    }
    findOne(id) {
        const assignment = this.repository.findById(id);
        if (!assignment) {
            throw new common_1.NotFoundException(`Assignment with ID ${id} not found`);
        }
        return assignment;
    }
    findByApplication(applicationId) {
        return this.repository.findByApplication(applicationId);
    }
    findByFieldOfficer(fieldOfficerId) {
        return this.repository.findByFieldOfficer(fieldOfficerId);
    }
    create(data) {
        this.applicationsService.findOne(data.application_id);
        this.usersService.findOne(data.field_officer_id);
        this.usersService.findOne(data.assigned_by);
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + this.SLA_DAYS);
        const createData = {
            ...data,
            status: data.status || assignment_status_enum_1.AssignmentStatus.PENDING,
            deadline,
        };
        return this.repository.create(createData);
    }
    update(id, updateData) {
        const existing = this.findOne(id);
        if (existing.status === assignment_status_enum_1.AssignmentStatus.COMPLETED ||
            existing.status === assignment_status_enum_1.AssignmentStatus.CANCELLED) {
            if (updateData.status && updateData.status !== existing.status) {
                throw new common_1.BadRequestException('Cannot change status of a completed or cancelled assignment');
            }
        }
        const updated = this.repository.update(id, updateData);
        if (!updated) {
            throw new common_1.NotFoundException(`Assignment with ID ${id} not found`);
        }
        return updated;
    }
    checkSLA(id) {
        const existing = this.findOne(id);
        if (!existing.deadline) {
            return { breached: false, daysRemaining: 0 };
        }
        const now = new Date();
        const diffTime = existing.deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
            breached: diffDays < 0,
            daysRemaining: diffDays,
        };
    }
    remove(id) {
        this.findOne(id);
        this.repository.delete(id);
    }
};
exports.FieldOfficerAssignmentsService = FieldOfficerAssignmentsService;
exports.FieldOfficerAssignmentsService = FieldOfficerAssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [field_officer_assignments_repository_1.FieldOfficerAssignmentsRepository,
        applications_service_1.ApplicationsService,
        users_service_1.UsersService])
], FieldOfficerAssignmentsService);
//# sourceMappingURL=field-officer-assignments.service.js.map