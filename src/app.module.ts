import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CompaniesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
