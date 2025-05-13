import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role,
      company_id: user.company_id 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id
      }
    };
  }

  async getProfile(user: any) {
    // Token'dan gelen user bilgisine ek olarak tam kullanıcı bilgisini çekelim
    const userDetails = await this.usersService.findById(user.id);
    if (!userDetails) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }
    
    // Hassas bilgileri çıkaralım
    const { password, ...result } = userDetails;
    return result;
  }

  async logout(user: any) {
    try {

      
      return {
        success: true,
        message: 'Başarıyla çıkış yapıldı'
      };
    } catch (error) {
      throw new UnauthorizedException('Çıkış yapılırken bir hata oluştu');
    }
  }
} 