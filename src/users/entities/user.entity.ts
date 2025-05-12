export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  COMPANY_ADMIN = 'company_admin',
  USER = 'user',
}

export class User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company_id?: string;
  created_at: Date;
  updated_at: Date;
} 