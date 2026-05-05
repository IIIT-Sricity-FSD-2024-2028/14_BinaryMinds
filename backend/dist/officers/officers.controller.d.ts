import { OfficersService } from './officers.service';
export declare class OfficersController {
    private readonly officersService;
    constructor(officersService: OfficersService);
    findAll(): {
        success: boolean;
        data: import("./officer.interface").OfficerWithCounts[];
    };
}
