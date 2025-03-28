import { ApiProperty } from '@nestjs/swagger';

export class Subscription {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  subscriptionObject!: string;
}
