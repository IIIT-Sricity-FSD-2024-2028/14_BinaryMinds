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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const users_repository_1 = require("./users.repository");
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    findAll() {
        return this.usersRepository.find();
    }
    findOne(id) {
        const user = this.usersRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    findByEmail(email) {
        const user = this.usersRepository.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException(`User with email ${email} not found`);
        }
        return user;
    }
    create(userData) {
        const existingEmail = this.usersRepository.findByEmail(userData.email);
        if (existingEmail) {
            throw new common_1.ConflictException(`User with email ${userData.email} already exists`);
        }
        const existingPhone = this.usersRepository
            .find()
            .find((user) => user.phone === userData.phone);
        if (existingPhone) {
            throw new common_1.ConflictException(`User with phone number ${userData.phone} already exists`);
        }
        return this.usersRepository.create(userData);
    }
    update(id, updateData) {
        this.findOne(id);
        if (updateData.email) {
            const existingUser = this.usersRepository.findByEmail(updateData.email);
            if (existingUser && existingUser.user_id !== id) {
                throw new common_1.ConflictException(`Email ${updateData.email} is already in use`);
            }
        }
        if (updateData.phone) {
            const existingPhone = this.usersRepository
                .find()
                .find((user) => user.phone === updateData.phone);
            if (existingPhone && existingPhone.user_id !== id) {
                throw new common_1.ConflictException(`Phone number ${updateData.phone} is already in use`);
            }
        }
        const updatedUser = this.usersRepository.update(id, updateData);
        if (!updatedUser) {
            throw new common_1.NotFoundException(`User with ID ${id} not found during update`);
        }
        return updatedUser;
    }
    remove(id) {
        this.findOne(id);
        this.usersRepository.delete(id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map