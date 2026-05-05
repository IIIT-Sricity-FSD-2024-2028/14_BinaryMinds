import { Module, forwardRef } from '@nestjs/common';
import { OfficersController } from './officers.controller';
import { OfficersService } from './officers.service';
import { OfficersRepository } from './officers.repository';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [forwardRef(() => ApplicationsModule)],
  controllers: [OfficersController],
  providers: [OfficersService, OfficersRepository],
  exports: [OfficersService, OfficersRepository],
})
export class OfficersModule {}
