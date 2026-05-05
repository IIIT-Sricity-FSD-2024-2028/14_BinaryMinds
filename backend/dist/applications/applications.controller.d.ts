import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateSimpleApplicationDto } from './dto/create-simple-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export declare class ApplicationsController {
    private readonly applicationsService;
    private readonly auditLogsService;
    constructor(applicationsService: ApplicationsService, auditLogsService: AuditLogsService);
    create(body: CreateApplicationDto | CreateSimpleApplicationDto): {
        success: boolean;
        data: import("./application.interface").Application;
    };
    findSubmitted(): {
        success: boolean;
        data: import("./application.interface").Application[];
    };
    assign(id: number, officerId?: number): {
        success: boolean;
        data: import("./application.interface").Application;
    };
    findByOfficer(officerId: number): {
        success: boolean;
        data: import("./application.interface").Application[];
    };
    verify(id: number): {
        success: boolean;
        data: import("./application.interface").Application;
    };
    findAll(): {
        success: boolean;
        data: import("./application.interface").Application[];
    };
    findByApplicant(applicantId: number): {
        success: boolean;
        data: import("./application.interface").Application[];
    };
    findOne(id: number): {
        success: boolean;
        data: import("./application.interface").Application;
    };
    update(id: number, updateApplicationDto: UpdateApplicationDto): {
        success: boolean;
        data: import("./application.interface").Application;
    };
    remove(id: number): {
        success: boolean;
        data: null;
    };
}
