import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { DevicesModule } from './devices/devices.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CompaniesModule,
    DevicesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
