import { PermitActions, Public, ScopePermission } from '@decorators';
import { Action, Scope } from '@enum';
import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { JwtRefreshAuthGuard } from './guard/jwtRefresh.guard';
import { LocalAuthGuard } from './guard/local.guard';

@Controller('auth')
@ApiTags('Auth')
@ScopePermission(Scope.AUTH)
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Public()
	@Post('/login')
	@ApiBody({ type: LoginDto })
	@UseGuards(LocalAuthGuard)
	async login(@Req() request) {
		return this.authService.login(request.user);
	}

	@Get('/logout')
	@ApiBearerAuth()
	@PermitActions(Action.READ)
	async logout(@Req() request) {
		await this.authService.logout(request.user);
	}

	@Post('/refresh-token')
	@Public()
	@UseGuards(JwtRefreshAuthGuard)
	@ApiBearerAuth()
	@PermitActions(Action.READ)
	async refreshToken(@Req() request) {
		const data = await this.authService.createToken(request.user.emailAddress);
		return data;
	}
}
