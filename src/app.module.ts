import { AppConfigModule, AppConfigService } from '@config';
import { InterceptorModule } from '@interceptor';
import { LogMiddleware } from '@middleware';
import { UserModule } from '@modules/user';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LogModule } from '@log';
import { AuthModule } from '@modules/auth';
import { FilterModule } from '@filter';
import { RoleModule } from '@modules/role';
import { AuditSubscriber } from '@shared/subscriber';
import { EmailModule } from '@shared/email';
import { TwilioModule } from '@shared/twilio';

@Module({
	imports: [
		UserModule,
		RoleModule,
		AppConfigModule,
		InterceptorModule,
		LogModule,
		AuthModule,
		FilterModule,
		EmailModule,
		TwilioModule,
	],
	providers: [AuditSubscriber],
})
export class AppModule implements NestModule {
	constructor(private readonly configService: AppConfigService) {}

	configure(consumer: MiddlewareConsumer): void {
		!this.configService.isProduction() &&
			consumer.apply(LogMiddleware).forRoutes('*');
	}
}
