import { FieldOfficerAssignmentsService } from './field-officer-assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
export declare class FieldOfficerAssignmentsController {
    private readonly service;
    constructor(service: FieldOfficerAssignmentsService);
    create(createDto: CreateAssignmentDto): import("./assignment.interface").Assignment;
    findAll(): import("./assignment.interface").Assignment[];
    findByApplication(applicationId: number): import("./assignment.interface").Assignment[];
    findByFieldOfficer(fieldOfficerId: number): import("./assignment.interface").Assignment[];
    findOne(id: number): import("./assignment.interface").Assignment;
    update(id: number, updateDto: UpdateAssignmentDto): import("./assignment.interface").Assignment;
    checkSLA(id: number): {
        breached: boolean;
        daysRemaining: number;
    };
    remove(id: number): void;
}
