import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserLogDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @IsString()
  action: string;
} 