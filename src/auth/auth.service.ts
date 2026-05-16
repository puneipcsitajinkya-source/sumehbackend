import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(input: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const existing = await this.usersService.findByEmailPlain(input.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.usersService.createCustomer(input);
    return this.buildAuthResponse(user._id.toString(), user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse(user._id.toString(), user);
  }

  private buildAuthResponse(
    userId: string,
    user: { name: string; email: string; role: UserRole },
  ) {
    const payload = { sub: userId, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
