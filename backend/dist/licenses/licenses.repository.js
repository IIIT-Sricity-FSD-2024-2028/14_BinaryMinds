"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensesRepository = void 0;
const common_1 = require("@nestjs/common");
const license_status_enum_1 = require("../common/enums/license-status.enum");
let LicensesRepository = class LicensesRepository {
    licenses = [];
    idCounter = 1;
    find() {
        return this.licenses;
    }
    findById(id) {
        return this.licenses.find((l) => l.license_id === id);
    }
    findByApplication(applicationId) {
        return this.licenses.find((l) => l.application_id === applicationId);
    }
    findByLicenseNumber(licenseNumber) {
        return this.licenses.find((l) => l.license_number === licenseNumber);
    }
    create(license) {
        const newLicense = {
            ...license,
            license_id: this.idCounter++,
        };
        if (!newLicense.status) {
            newLicense.status = license_status_enum_1.LicenseStatus.ACTIVE;
        }
        this.licenses.push(newLicense);
        return newLicense;
    }
    update(id, updateData) {
        const index = this.licenses.findIndex((l) => l.license_id === id);
        if (index === -1)
            return undefined;
        this.licenses[index] = { ...this.licenses[index], ...updateData };
        return this.licenses[index];
    }
    delete(id) {
        const initialLength = this.licenses.length;
        this.licenses = this.licenses.filter((l) => l.license_id !== id);
        return this.licenses.length !== initialLength;
    }
};
exports.LicensesRepository = LicensesRepository;
exports.LicensesRepository = LicensesRepository = __decorate([
    (0, common_1.Injectable)()
], LicensesRepository);
//# sourceMappingURL=licenses.repository.js.map