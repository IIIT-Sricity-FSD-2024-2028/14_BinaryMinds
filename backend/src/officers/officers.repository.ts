import { Injectable } from '@nestjs/common';
import { Officer } from './officer.interface';

@Injectable()
export class OfficersRepository {
  // In-memory storage with 3 pre-seeded officers
  private officers: Officer[] = [
    { id: 1, name: 'Myra Singh' },
    { id: 2, name: 'Vikram Desai' },
    { id: 3, name: 'Anjali Mehta' },
  ];
  private idCounter = 4;

  find(): Officer[] {
    return this.officers;
  }

  findById(id: number): Officer | undefined {
    return this.officers.find((o) => o.id === id);
  }

  create(name: string): Officer {
    const officer: Officer = { id: this.idCounter++, name };
    this.officers.push(officer);
    return officer;
  }
}
