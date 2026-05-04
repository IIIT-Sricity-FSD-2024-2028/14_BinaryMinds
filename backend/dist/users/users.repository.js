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
let UsersRepository = class UsersRepository {
    users = [];
    idCounter = 1;
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