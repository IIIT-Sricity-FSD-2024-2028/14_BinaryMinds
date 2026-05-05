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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficersService = void 0;
const common_1 = require("@nestjs/common");
const officers_repository_1 = require("./officers.repository");
const applications_repository_1 = require("../applications/applications.repository");
const application_status_enum_1 = require("../common/enums/application-status.enum");
let OfficersService = class OfficersService {
    officersRepository;
    applicationsRepository;
    constructor(officersRepository, applicationsRepository) {
        this.officersRepository = officersRepository;
        this.applicationsRepository = applicationsRepository;
    }
    findAll() {
        const officers = this.officersRepository.find();
        const allApps = this.applicationsRepository.find();
        return officers.map((officer) => {
            const assignedCount = allApps.filter((a) => a.assignedOfficerId === officer.id &&
                a.application_status === application_status_enum_1.ApplicationStatus.ASSIGNED).length;
            const verifiedCount = allApps.filter((a) => a.assignedOfficerId === officer.id &&
                a.application_status === application_status_enum_1.ApplicationStatus.VERIFIED).length;
            return { ...officer, assignedCount, verifiedCount };
        });
    }
    findOne(id) {
        const officer = this.officersRepository.findById(id);
        if (!officer) {
            throw new common_1.NotFoundException(`Officer with ID ${id} not found`);
        }
        const allApps = this.applicationsRepository.find();
        const assignedCount = allApps.filter((a) => a.assignedOfficerId === id &&
            a.application_status === application_status_enum_1.ApplicationStatus.ASSIGNED).length;
        const verifiedCount = allApps.filter((a) => a.assignedOfficerId === id &&
            a.application_status === application_status_enum_1.ApplicationStatus.VERIFIED).length;
        return { ...officer, assignedCount, verifiedCount };
    }
    findLeastLoaded() {
        const officersWithCounts = this.findAll();
        if (officersWithCounts.length === 0) {
            throw new common_1.NotFoundException('No officers available for assignment');
        }
        let leastLoaded = officersWithCounts[0];
        for (let i = 1; i < officersWithCounts.length; i++) {
            if (officersWithCounts[i].assignedCount < leastLoaded.assignedCount) {
                leastLoaded = officersWithCounts[i];
            }
        }
        return leastLoaded;
    }
    create(name) {
        return this.officersRepository.create(name);
    }
};
exports.OfficersService = OfficersService;
exports.OfficersService = OfficersService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => applications_repository_1.ApplicationsRepository))),
    __metadata("design:paramtypes", [officers_repository_1.OfficersRepository,
        applications_repository_1.ApplicationsRepository])
], OfficersService);
//# sourceMappingURL=officers.service.js.map