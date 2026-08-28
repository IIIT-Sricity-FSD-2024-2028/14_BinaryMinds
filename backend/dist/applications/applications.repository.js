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
exports.ApplicationsRepository = void 0;
const common_1 = require("@nestjs/common");
const json_store_1 = require("../common/persistence/json-store");
let ApplicationsRepository = class ApplicationsRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    find() {
        return this.store.snapshot().applications;
    }
    findById(id) {
        return this.find().find((app) => app.application_id === id);
    }
    findByApplicant(applicantId) {
        return this.find().filter((app) => app.applicant_id === applicantId);
    }
    create(application) {
        const data = this.store.snapshot();
        const applicationId = data.counters.applications++;
        const newApplication = {
            ...application,
            application_id: applicationId,
            application_ref: `TL-${new Date().getFullYear()}-${String(applicationId).padStart(6, '0')}`,
            submitted_at: new Date(),
        };
        data.applications.push(newApplication);
        this.store.save();
        return newApplication;
    }
    update(id, updateData) {
        const applications = this.find();
        const index = applications.findIndex((app) => app.application_id === id);
        if (index === -1)
            return undefined;
        applications[index] = { ...applications[index], ...updateData };
        this.store.save();
        return applications[index];
    }
    findByStatus(status) {
        return this.find().filter((app) => app.application_status === status);
    }
    findByOfficer(officerId) {
        return this.find().filter((app) => app.assignedOfficerId === officerId);
    }
    delete(id) {
        const applications = this.find();
        const initialLength = applications.length;
        const remaining = applications.filter((app) => app.application_id !== id);
        if (remaining.length === initialLength)
            return false;
        applications.splice(0, applications.length, ...remaining);
        this.store.save();
        return true;
    }
};
exports.ApplicationsRepository = ApplicationsRepository;
exports.ApplicationsRepository = ApplicationsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [json_store_1.JsonStore])
], ApplicationsRepository);
//# sourceMappingURL=applications.repository.js.map