import { Officer } from './officer.interface';
export declare class OfficersRepository {
    private officers;
    private idCounter;
    find(): Officer[];
    findById(id: number): Officer | undefined;
    create(name: string): Officer;
}
