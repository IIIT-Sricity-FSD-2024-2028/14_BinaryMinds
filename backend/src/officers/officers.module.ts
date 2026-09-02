import { Module, forwardRef } from '@nestjs/common';
import { OfficersController } from './officers.controller';
import { OfficersService } from './officers.service';
import { ApplicationsModule } from '../applications/applications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [forwardRef(() => ApplicationsModule), UsersModule],
  controllers: [OfficersController],
  providers: [OfficersService],
  exports: [OfficersService],
})
export class OfficersModule {}

