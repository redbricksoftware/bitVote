import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { hash, verify } from 'argon2';
import { Repository } from 'typeorm';
import { getConfig } from '../../shared/config/appConfig';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const cfg = getConfig();
    const passwordHash = await hash(dto.password, {
      secret: Buffer.from(cfg.auth.argon2Secret),
    });

    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
    });
    await this.userRepo.save(user);

    const tokens = await this.generateTokens(user.userId, user.email);
    await this.updateRefreshToken(user.userId, tokens.refreshToken);
    return tokens;
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const cfg = getConfig();
    const valid = await verify(user.passwordHash, dto.password, {
      secret: Buffer.from(cfg.auth.argon2Secret),
    });
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.userId, user.email);
    await this.updateRefreshToken(user.userId, tokens.refreshToken);
    return tokens;
  }

  async refresh(userId: string, currentRefreshToken: string) {
    const user = await this.userRepo.findOne({ where: { userId } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const valid = await verify(user.refreshToken, currentRefreshToken);
    if (!valid) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user.userId, user.email);
    await this.updateRefreshToken(user.userId, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refreshToken: null as any });
  }

  private async generateTokens(userId: string, email: string) {
    const cfg = getConfig();
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: cfg.auth.jwtSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: cfg.auth.jwtRefreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await hash(refreshToken);
    await this.userRepo.update(userId, { refreshToken: hashedToken });
  }
}
