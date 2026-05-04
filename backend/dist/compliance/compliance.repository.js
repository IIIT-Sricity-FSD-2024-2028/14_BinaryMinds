"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceRepository = void 0;
const common_1 = require("@nestjs/common");
const compliance_status_enum_1 = require("../common/enums/compliance-status.enum");
let ComplianceRepository = class ComplianceRepository {
    records = [];
    idCounter = 1;
    find() {
        return this.records;
    }
    findById(id) {
        return this.records.find((r) => r.record_id === id);
    }
    findByLicense(licenseId) {
        return this.records.filter((r) => r.license_id === licenseId);
    }
    findByFieldOfficer(fieldOfficerId) {
        return this.records.filter((r) => r.field_officer_id === fieldOfficerId);
    }
    create(record) {
        const newRecord = {
            ...record,
            record_id: this.idCounter++,
            issued_at: new Date(),
        };
        if (!newRecord.status) {
            newRecord.status = compliance_status_enum_1.ComplianceStatus.ISSUED;
        }
        this.records.push(newRecord);
        return newRecord;
    }
    update(id, updateData) {
        const index = this.records.findIndex((r) => r.record_id === id);
        if (index === -1)
            return undefined;
        this.records[index] = { ...this.records[index], ...updateData };
        return this.records[index];
    }
    delete(id) {
        const initialLength = this.records.length;
        this.records = this.records.filter((r) => r.record_id !== id);
        return this.records.length !== initialLength;
    }
};
exports.ComplianceRepository = ComplianceRepository;
exports.ComplianceRepository = ComplianceRepository = __decorate([
    (0, common_1.Injectable)()
], ComplianceRepository);
//# sourceMappingURL=compliance.repository.js.map