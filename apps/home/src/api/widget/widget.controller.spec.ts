import { Test, TestingModule } from '@nestjs/testing';
import { WidgetController } from './widget.controller';
import { WidgetService } from './widget.service';

describe('WidgetController', () => {
  let controller: WidgetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WidgetController],
      providers: [WidgetService],
    }).compile();

    controller = module.get<WidgetController>(WidgetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // it('should return an array of all widgets', () => {
  //   const result = widgetStore;
  //   expect(controller.getAll()).toEqual(result);
  // });

  // it('should return a single widget', () => {
  //   const result = { id: 1, name: 'Weather', componentName: 'weather' };
  //   expect(controller.findOne(1)).toEqual([result]);
  // });

  // it('should throw an error if the ID is not found', () => {
  //   expect(() => controller.findOne(99)).toThrow('Widget not found');
  // });
});
