"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsRepository = void 0;
const common_1 = require("@nestjs/common");
let ApplicationsRepository = class ApplicationsRepository {
    applications = [];
    idCounter = 1;
    find() {
        return this.applications;
    }
    findById(id) {
        return this.applications.find((app) => app.application_id === id);
    }
    findByApplicant(applicantId) {
        return this.applications.filter((app) => app.applicant_id === applicantId);
    }
    create(application) {
        const newApplication = {
            ...application,
            application_id: this.idCounter++,
            submitted_at: new Date(),
        };
        this.applications.push(newApplication);
        return newApplication;
    }
    update(id, updateData) {
        const index = this.applications.findIndex((app) => app.application_id === id);
        if (index === -1)
            return undefined;
        this.applications[index] = { ...this.applications[index], ...updateData };
        return this.applications[index];
    }
    delete(id) {
        const initialLength = this.applications.length;
        this.applications = this.applications.filter((app) => app.application_id !== id);
        return this.applications.length !== initialLength;
    }
};
exports.ApplicationsRepository = ApplicationsRepository;
exports.ApplicationsRepository = ApplicationsRepository = __decorate([
    (0, common_1.Injectable)()
], ApplicationsRepository);
//# sourceMappingURL=applications.repository.js.map