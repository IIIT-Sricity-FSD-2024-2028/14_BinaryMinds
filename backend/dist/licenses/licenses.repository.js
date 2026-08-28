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
exports.LicensesRepository = void 0;
const common_1 = require("@nestjs/common");
const license_status_enum_1 = require("../common/enums/license-status.enum");
const json_store_1 = require("../common/persistence/json-store");
let LicensesRepository = class LicensesRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    find() {
        return this.store.snapshot().licenses;
    }
    findById(id) {
        return this.find().find((l) => l.license_id === id);
    }
    findByApplication(applicationId) {
        return this.find().find((l) => l.application_id === applicationId);
    }
    findByLicenseNumber(licenseNumber) {
        return this.find().find((l) => l.license_number === licenseNumber);
    }
    create(license) {
        const newLicense = {
            ...license,
            license_id: this.store.snapshot().counters.licenses++,
        };
        if (!newLicense.status) {
            newLicense.status = license_status_enum_1.LicenseStatus.ACTIVE;
        }
        this.find().push(newLicense);
        this.store.save();
        return newLicense;
    }
    update(id, updateData) {
        const licenses = this.find();
        const index = licenses.findIndex((l) => l.license_id === id);
        if (index === -1)
            return undefined;
        licenses[index] = { ...licenses[index], ...updateData };
        this.store.save();
        return licenses[index];
    }
    delete(id) {
        const licenses = this.find();
        const initialLength = licenses.length;
        const remaining = licenses.filter((l) => l.license_id !== id);
        if (remaining.length === initialLength)
            return false;
        licenses.splice(0, licenses.length, ...remaining);
        this.store.save();
        return true;
    }
};
exports.LicensesRepository = LicensesRepository;
exports.LicensesRepository = LicensesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [json_store_1.JsonStore])
], LicensesRepository);
//# sourceMappingURL=licenses.repository.js.map