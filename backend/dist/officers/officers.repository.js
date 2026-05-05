"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficersRepository = void 0;
const common_1 = require("@nestjs/common");
let OfficersRepository = class OfficersRepository {
    officers = [
        { id: 1, name: 'Myra Singh' },
        { id: 2, name: 'Vikram Desai' },
        { id: 3, name: 'Anjali Mehta' },
    ];
    idCounter = 4;
    find() {
        return this.officers;
    }
    findById(id) {
        return this.officers.find((o) => o.id === id);
    }
    create(name) {
        const officer = { id: this.idCounter++, name };
        this.officers.push(officer);
        return officer;
    }
};
exports.OfficersRepository = OfficersRepository;
exports.OfficersRepository = OfficersRepository = __decorate([
    (0, common_1.Injectable)()
], OfficersRepository);
//# sourceMappingURL=officers.repository.js.map