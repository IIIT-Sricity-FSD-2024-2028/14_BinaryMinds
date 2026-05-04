import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    create(createApplicationDto: CreateApplicationDto): import("./application.interface").Application;
    findAll(): import("./application.interface").Application[];
    findByApplicant(applicantId: number): import("./application.interface").Application[];
    findOne(id: number): import("./application.interface").Application;
    update(id: number, updateApplicationDto: UpdateApplicationDto): import("./application.interface").Application;
    remove(id: number): void;
}
