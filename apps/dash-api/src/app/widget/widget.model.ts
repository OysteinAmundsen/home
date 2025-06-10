import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'WidgetResponse' })
export class WidgetResponse {
  @ApiProperty({ description: 'The ID of the widget', type: 'string' })
  id!: string;
  @ApiProperty({ description: 'The name of the widget', type: 'string' })
  name!: string;
  @ApiProperty({ description: 'The description of the widget', type: 'string' })
  componentName!: string;
  @ApiProperty({ description: 'The category tags for this widget', type: 'array' })
  tags?: string[];
}
