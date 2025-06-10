import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PushSubscription } from 'web-push';
import { User } from '../auth/user.entity';

@Entity({ name: 'subscription' })
export class Subscription {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column({ type: 'json' })
  subscriptionObject!: PushSubscription;

  @ApiProperty()
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @OneToOne(() => User)
  @JoinColumn()
  user?: User;
}
