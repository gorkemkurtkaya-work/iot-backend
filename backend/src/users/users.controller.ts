import { Controller, Post, Body, Get, Param, NotFoundException,Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('register')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    return user;
  }

  @Put(':id')
  async updateCompany(
    @Param('id') id: string,
    @Body('company_id') company_id: string,
  ): Promise<User> {
    return this.usersService.updateCompany(id, company_id);
  }

  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }
}