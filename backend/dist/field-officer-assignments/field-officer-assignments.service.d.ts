import { FieldOfficerAssignmentsRepository } from './field-officer-assignments.repository';
import { Assignment } from './assignment.interface';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ApplicationsService } from '../applications/applications.service';
import { UsersService } from '../users/users.service';
export declare class FieldOfficerAssignmentsService {
    private readonly repository;
    private readonly applicationsService;
    private readonly usersService;
    private readonly SLA_DAYS;
    constructor(repository: FieldOfficerAssignmentsRepository, applicationsService: ApplicationsService, usersService: UsersService);
    findAll(): Assignment[];
    findOne(id: number): Assignment;
    findByApplication(applicationId: number): Assignment[];
    findByFieldOfficer(fieldOfficerId: number): Assignment[];
    create(data: CreateAssignmentDto): Assignment;
    update(id: number, updateData: Partial<Assignment>): Assignment;
    checkSLA(id: number): {
        breached: boolean;
        daysRemaining: number;
    };
    remove(id: number): void;
}
