import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'user' })
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column()
  userId!: string;

  @ApiProperty()
  @Column({ type: 'text' })
  username!: string;

  @Column('text')
  publicKey!: string;

  @Column('bigint')
  counter?: number;

  @ApiProperty()
  @Column({ type: 'text' })
  email!: string;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
