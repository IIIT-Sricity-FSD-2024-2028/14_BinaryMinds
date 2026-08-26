import { Global, Module } from '@nestjs/common';
import { JsonStore } from './json-store';

@Global()
@Module({ providers: [JsonStore], exports: [JsonStore] })
export class PersistenceModule {}
