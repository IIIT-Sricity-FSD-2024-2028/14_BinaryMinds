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
exports.InspectionsService = void 0;
const common_1 = require("@nestjs/common");
const inspections_repository_1 = require("./inspections.repository");
const inspection_status_enum_1 = require("../common/enums/inspection-status.enum");
const field_officer_assignments_service_1 = require("../field-officer-assignments/field-officer-assignments.service");
let InspectionsService = class InspectionsService {
    repository;
    assignmentsService;
    constructor(repository, assignmentsService) {
        this.repository = repository;
        this.assignmentsService = assignmentsService;
    }
    findAll() {
        return this.repository.find();
    }
    findOne(id) {
        const inspection = this.repository.findById(id);
        if (!inspection) {
            throw new common_1.NotFoundException(`Inspection with ID ${id} not found`);
        }
        return inspection;
    }
    findByAssignment(assignmentId) {
        return this.repository.findByAssignment(assignmentId);
    }
    findByFieldOfficer(fieldOfficerId) {
        return this.repository.findByFieldOfficer(fieldOfficerId);
    }
    create(data) {
        this.assignmentsService.findOne(data.assignment_id);
        return this.repository.create({
            ...data,
            status: data.status || inspection_status_enum_1.InspectionStatus.PENDING,
        });
    }
    update(id, updateData) {
        this.findOne(id);
        const updated = this.repository.update(id, updateData);
        if (!updated) {
            throw new common_1.NotFoundException(`Inspection with ID ${id} not found`);
        }
        return updated;
    }
    submitReport(id, reportData) {
        const existing = this.findOne(id);
        if (existing.status === inspection_status_enum_1.InspectionStatus.COMPLETED) {
            throw new common_1.BadRequestException('Inspection is already completed');
        }
        if (reportData.status !== inspection_status_enum_1.InspectionStatus.COMPLETED &&
            reportData.status !== inspection_status_enum_1.InspectionStatus.FAILED) {
            throw new common_1.BadRequestException('Report submission must result in COMPLETED or FAILED status');
        }
        const updated = this.repository.update(id, {
            notes: reportData.notes,
            report_url: reportData.report_url,
            status: reportData.status,
            completed_date: new Date(),
        });
        if (!updated) {
            throw new common_1.NotFoundException(`Inspection with ID ${id} not found`);
        }
        return updated;
    }
    remove(id) {
        this.findOne(id);
        this.repository.delete(id);
    }
};
exports.InspectionsService = InspectionsService;
exports.InspectionsService = InspectionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inspections_repository_1.InspectionsRepository,
        field_officer_assignments_service_1.FieldOfficerAssignmentsService])
], InspectionsService);
//# sourceMappingURL=inspections.service.js.map