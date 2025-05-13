import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

export enum IntegrationType {
  MQTT = 'mqtt',
  HTTP = 'http',
  WEBSOCKET = 'websocket',
  MODBUS = 'modbus'
}

@Entity('integrations')
export class Integration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: IntegrationType,
    default: IntegrationType.MQTT
  })
  type: IntegrationType;

  @Column('jsonb')
  config: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    topic?: string;
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    protocols?: string[];
    slaveId?: number;
  };

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'error'],
    default: 'inactive'
  })
  status: 'active' | 'inactive' | 'error';

  @Column({ type: 'timestamp', nullable: true })
  last_connection: Date;

  @Column()
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;
} 