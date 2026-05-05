import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiRoute } from './common/swagger/api-route.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiRoute({
    summary: 'Health check',
    responseDescription: 'Plain-text service health response.',
    responseExample: 'Hello World!',
    notFound: false,
    badRequest: false,
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
