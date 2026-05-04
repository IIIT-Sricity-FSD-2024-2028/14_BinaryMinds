"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldOfficerAssignmentsRepository = void 0;
const common_1 = require("@nestjs/common");
const assignment_status_enum_1 = require("../common/enums/assignment-status.enum");
let FieldOfficerAssignmentsRepository = class FieldOfficerAssignmentsRepository {
    assignments = [];
    idCounter = 1;
    find() {
        return this.assignments;
    }
    findById(id) {
        return this.assignments.find((a) => a.assignment_id === id);
    }
    findByApplication(applicationId) {
        return this.assignments.filter((a) => a.application_id === applicationId);
    }
    findByFieldOfficer(fieldOfficerId) {
        return this.assignments.filter((a) => a.field_officer_id === fieldOfficerId);
    }
    create(assignment) {
        const newAssignment = {
            ...assignment,
            assignment_id: this.idCounter++,
            assigned_at: new Date(),
        };
        if (!newAssignment.status) {
            newAssignment.status = assignment_status_enum_1.AssignmentStatus.PENDING;
        }
        this.assignments.push(newAssignment);
        return newAssignment;
    }
    update(id, updateData) {
        const index = this.assignments.findIndex((a) => a.assignment_id === id);
        if (index === -1)
            return undefined;
        this.assignments[index] = { ...this.assignments[index], ...updateData };
        return this.assignments[index];
    }
    delete(id) {
        const initialLength = this.assignments.length;
        this.assignments = this.assignments.filter((a) => a.assignment_id !== id);
        return this.assignments.length !== initialLength;
    }
};
exports.FieldOfficerAssignmentsRepository = FieldOfficerAssignmentsRepository;
exports.FieldOfficerAssignmentsRepository = FieldOfficerAssignmentsRepository = __decorate([
    (0, common_1.Injectable)()
], FieldOfficerAssignmentsRepository);
//# sourceMappingURL=field-officer-assignments.repository.js.map