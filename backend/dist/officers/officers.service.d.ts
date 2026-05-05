import { OfficersRepository } from './officers.repository';
import { Officer, OfficerWithCounts } from './officer.interface';
import { ApplicationsRepository } from '../applications/applications.repository';
export declare class OfficersService {
    private readonly officersRepository;
    private readonly applicationsRepository;
    constructor(officersRepository: OfficersRepository, applicationsRepository: ApplicationsRepository);
    findAll(): OfficerWithCounts[];
    findOne(id: number): OfficerWithCounts;
    findLeastLoaded(): Officer;
    create(name: string): Officer;
}
