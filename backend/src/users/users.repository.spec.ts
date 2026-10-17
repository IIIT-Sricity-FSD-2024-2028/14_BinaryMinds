import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JsonStore } from '../common/persistence/json-store';
import { UsersRepository } from './users.repository';

describe('UsersRepository employee IDs', () => {
  const originalDataFile = process.env.TRADEZO_DATA_FILE;
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'tradezo-users-'));
    process.env.TRADEZO_DATA_FILE = join(temporaryDirectory, 'tradezo.json');
  });

  afterEach(() => {
    if (originalDataFile === undefined) delete process.env.TRADEZO_DATA_FILE;
    else process.env.TRADEZO_DATA_FILE = originalDataFile;
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('assigns and persists stable IDs for existing officers without employee IDs', () => {
    const store = new JsonStore();
    new UsersRepository(store);

    expect(store.snapshot().users).toEqual(expect.arrayContaining([
      expect.objectContaining({ user_id: 2, employee_id: 'FO-HYD-001' }),
      expect.objectContaining({ user_id: 3, employee_id: 'DO-HYD-001' }),
      expect.objectContaining({ user_id: 5, employee_id: 'FO-BLR-001' }),
      expect.objectContaining({ user_id: 6, employee_id: 'DO-BLR-001' }),
    ]));

    const reloaded = new JsonStore();
    new UsersRepository(reloaded);
    expect(reloaded.snapshot().users.find((user) => user.user_id === 2)?.employee_id).toBe('FO-HYD-001');
    expect(reloaded.snapshot().users.find((user) => user.user_id === 3)?.employee_id).toBe('DO-HYD-001');
  });
});
