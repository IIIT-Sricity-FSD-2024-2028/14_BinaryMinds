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
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const role_enum_1 = require("../common/enums/role.enum");
const json_store_1 = require("../common/persistence/json-store");
let UsersRepository = class UsersRepository {
    store;
    defaultUsers = [
        {
            user_id: 1,
            full_name: 'Rajesh Kumar',
            email: 'rajesh@example.com',
            phone: '9876543210',
            password_hash: 'demo',
            role: role_enum_1.Role.APPLICANT,
            created_at: new Date('2026-02-20T10:00:00Z'),
        },
        {
            user_id: 2,
            full_name: 'Vikram Singh',
            email: 'vikram@example.com',
            phone: '9876543211',
            password_hash: 'demo',
            role: role_enum_1.Role.APPLICANT,
            created_at: new Date('2026-02-18T14:30:00Z'),
        },
        {
            user_id: 3,
            full_name: 'Priya Sharma',
            email: 'priya@example.com',
            phone: '9876543213',
            password_hash: 'demo',
            role: role_enum_1.Role.APPLICANT,
            created_at: new Date('2026-02-12T09:15:00Z'),
        },
        {
            user_id: 4,
            full_name: 'Department Officer',
            email: 'do@tradezo.gov.in',
            phone: '9000000000',
            employee_id: 'DO-1001',
            password_hash: 'demo',
            role: role_enum_1.Role.DEPARTMENT_OFFICER,
            created_at: new Date('2026-01-01T00:00:00Z'),
        },
        {
            user_id: 5,
            full_name: 'Rajesh Kumar',
            email: 'rajesh@applicant.com',
            phone: '9876543220',
            password_hash: 'applicant123',
            role: role_enum_1.Role.APPLICANT,
            created_at: new Date('2026-02-20T10:00:00Z'),
        },
        {
            user_id: 6,
            full_name: 'Myra Singh',
            email: 'myra@fieldofficer.com',
            phone: '9876543221',
            employee_id: 'FO-2026-042',
            password_hash: 'field@123',
            role: role_enum_1.Role.FIELD_OFFICER,
            created_at: new Date('2026-02-18T14:30:00Z'),
        },
        {
            user_id: 7,
            full_name: 'Anjali Mehta',
            email: 'admin@deptofficer.com',
            phone: '9876543223',
            employee_id: 'DO-001',
            password_hash: 'dept123',
            role: role_enum_1.Role.DEPARTMENT_OFFICER,
            created_at: new Date('2026-02-12T09:15:00Z'),
        },
        {
            user_id: 8,
            full_name: 'Admin User',
            email: 'admin@tradezo.gov.in',
            phone: '9000000020',
            employee_id: 'SU-001',
            password_hash: 'super123',
            role: role_enum_1.Role.SUPER_USER,
            created_at: new Date('2026-01-01T00:00:00Z'),
        },
    ];
    constructor(store) {
        this.store = store;
        const data = this.store.snapshot();
        const existingEmails = new Set(data.users.map((user) => user.email.trim().toLowerCase()));
        const missingDefaultUsers = this.defaultUsers.filter((user) => !existingEmails.has(user.email.toLowerCase()));
        if (missingDefaultUsers.length) {
            data.users.push(...missingDefaultUsers);
            data.counters.users =
                Math.max(data.counters.users, ...data.users.map((user) => user.user_id + 1));
            this.store.save();
        }
    }
    find() {
        return this.store.snapshot().users;
    }
    findById(id) {
        return this.find().find((user) => user.user_id === id);
    }
    findByEmail(email) {
        return this.find().find((user) => user.email === email);
    }
    create(user) {
        const newUser = {
            ...user,
            user_id: this.store.snapshot().counters.users++,
            created_at: new Date(),
        };
        this.find().push(newUser);
        this.store.save();
        return newUser;
    }
    update(id, updateData) {
        const users = this.find();
        const userIndex = users.findIndex((user) => user.user_id === id);
        if (userIndex === -1)
            return undefined;
        users[userIndex] = { ...users[userIndex], ...updateData };
        this.store.save();
        return users[userIndex];
    }
    delete(id) {
        const users = this.find();
        const initialLength = users.length;
        const remaining = users.filter((user) => user.user_id !== id);
        if (remaining.length === initialLength)
            return false;
        users.splice(0, users.length, ...remaining);
        this.store.save();
        return true;
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [json_store_1.JsonStore])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map