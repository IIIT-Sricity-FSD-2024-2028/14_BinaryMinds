import { Injectable } from '@nestjs/common';
import { JsonStore } from '../common/persistence/json-store';
import { Municipality } from './municipality.interface';

@Injectable()
export class MunicipalitiesRepository {
  constructor(private readonly store: JsonStore) {}

  find(): Municipality[] {
    return this.store.snapshot().municipalities || [];
  }

  findById(id: string): Municipality | undefined {
    return this.find().find(
      (m) => m.municipality_id.toLowerCase() === id.toLowerCase(),
    );
  }

  create(data: Municipality): Municipality {
    const list = this.store.snapshot().municipalities;
    list.push(data);
    this.store.save();
    return data;
  }

  update(id: string, data: Partial<Municipality>): Municipality | undefined {
    const list = this.store.snapshot().municipalities;
    const index = list.findIndex(
      (m) => m.municipality_id.toLowerCase() === id.toLowerCase(),
    );
    if (index === -1) return undefined;
    list[index] = { ...list[index], ...data };
    this.store.save();
    return list[index];
  }

  delete(id: string): boolean {
    const list = this.store.snapshot().municipalities;
    const index = list.findIndex(
      (m) => m.municipality_id.toLowerCase() === id.toLowerCase(),
    );
    if (index === -1) return false;
    list.splice(index, 1);
    this.store.save();
    return true;
  }
}
