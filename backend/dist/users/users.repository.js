"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const role_enum_1 = require("../common/enums/role.enum");
let UsersRepository = class UsersRepository {
    users = [
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
    idCounter = 9;
    find() {
        return this.users;
    }
    findById(id) {
        return this.users.find((user) => user.user_id === id);
    }
    findByEmail(email) {
        return this.users.find((user) => user.email === email);
    }
    create(user) {
        const newUser = {
            ...user,
            user_id: this.idCounter++,
            created_at: new Date(),
        };
        this.users.push(newUser);
        return newUser;
    }
    update(id, updateData) {
        const userIndex = this.users.findIndex((user) => user.user_id === id);
        if (userIndex === -1)
            return undefined;
        this.users[userIndex] = { ...this.users[userIndex], ...updateData };
        return this.users[userIndex];
    }
    delete(id) {
        const initialLength = this.users.length;
        this.users = this.users.filter((user) => user.user_id !== id);
        return this.users.length !== initialLength;
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)()
], UsersRepository);
//# sourceMappingURL=users.repository.js.map