"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectionsRepository = void 0;
const common_1 = require("@nestjs/common");
const inspection_status_enum_1 = require("../common/enums/inspection-status.enum");
let InspectionsRepository = class InspectionsRepository {
    inspections = [];
    idCounter = 1;
    find() {
        return this.inspections;
    }
    findById(id) {
        return this.inspections.find((i) => i.inspection_id === id);
    }
    findByAssignment(assignmentId) {
        return this.inspections.filter((i) => i.assignment_id === assignmentId);
    }
    findByFieldOfficer(fieldOfficerId) {
        return this.inspections.filter((i) => i.field_officer_id === fieldOfficerId);
    }
    create(inspection) {
        const newInspection = {
            ...inspection,
            inspection_id: this.idCounter++,
        };
        if (!newInspection.status) {
            newInspection.status = inspection_status_enum_1.InspectionStatus.PENDING;
        }
        this.inspections.push(newInspection);
        return newInspection;
    }
    update(id, updateData) {
        const index = this.inspections.findIndex((i) => i.inspection_id === id);
        if (index === -1)
            return undefined;
        this.inspections[index] = { ...this.inspections[index], ...updateData };
        return this.inspections[index];
    }
    delete(id) {
        const initialLength = this.inspections.length;
        this.inspections = this.inspections.filter((i) => i.inspection_id !== id);
        return this.inspections.length !== initialLength;
    }
};
exports.InspectionsRepository = InspectionsRepository;
exports.InspectionsRepository = InspectionsRepository = __decorate([
    (0, common_1.Injectable)()
], InspectionsRepository);
//# sourceMappingURL=inspections.repository.js.map