import { Body, Controller, Post, UseGuards, Version } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserDecorator } from "../decorators/user.decorator";
import { LoginDto } from "../dtos/login.dto";
import { RegisterDto } from "../dtos/register.dto";
import { AccessTokenGuard } from "../guards/accessToken.guard";
import { RefreshTokenGuard } from "../guards/refreshToken.guard";
import { AuthService } from "../services/auth.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Version("1")
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Version("1")
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @Version("1")
  @UseGuards(RefreshTokenGuard)
  @Post("refresh")
  refresh(@UserDecorator() user: any) {
    return this.authService.refresh(user.sub, user.refreshToken);
  }

  @ApiBearerAuth()
  @Version("1")
  @UseGuards(AccessTokenGuard)
  @Post("logout")
  logout(@UserDecorator() user: any) {
    return this.authService.logout(user.sub);
  }
}
