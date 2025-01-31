import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatorController } from './authenticator.controller';
import { AuthenticatorService } from './authenticator.service';

describe('AuthenticatorController', () => {
  let controller: AuthenticatorController;
  let service: AuthenticatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticatorController],
      providers: [
        {
          provide: AuthenticatorService,
          useValue: {
            getRegistrationOptions: jest.fn(),
            doRegister: jest.fn(),
            getAuthenticationOptions: jest.fn(),
            doAuthenticate: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthenticatorController>(AuthenticatorController);
    service = module.get<AuthenticatorService>(AuthenticatorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // describe('getRegistrationOptions', () => {
  //   it('should return registration options', async () => {
  //     const session = {};
  //     const result = { options: 'test' };
  //     jest.spyOn(service, 'getRegistrationOptions').mockResolvedValue(result);

  //     expect(await controller.getRegistrationOptions(session)).toBe(result);
  //   });
  // });

  // describe('register', () => {
  //   it('should return status ok on successful registration', async () => {
  //     const session = {};
  //     const headers = { origin: 'test' };
  //     const body = { credential: 'test' };
  //     jest.spyOn(service, 'doRegister').mockResolvedValue(true);

  //     expect(await controller.register(session, headers, body)).toEqual({
  //       status: 'ok',
  //     });
  //   });

  //   it('should throw HttpException on failed registration', async () => {
  //     const session = {};
  //     const headers = { origin: 'test' };
  //     const body = { credential: 'test' };
  //     jest
  //       .spyOn(service, 'doRegister')
  //       .mockRejectedValue(new Error('Failed to register'));

  //     await expect(controller.register(session, headers, body)).rejects.toThrow(
  //       HttpException,
  //     );
  //   });
  // });

  // describe('getAuthenticationOptions', () => {
  //   it('should return authentication options', async () => {
  //     const session = {};
  //     const result = { options: 'test' };
  //     jest.spyOn(service, 'getAuthenticationOptions').mockResolvedValue(result);

  //     expect(await controller.getAuthenticationOptions(session)).toBe(result);
  //   });
  // });

  // describe('authenticate', () => {
  //   it('should return authentication result on successful authentication', async () => {
  //     const session = {};
  //     const headers = { origin: 'test' };
  //     const body = { credential: 'test' };
  //     const result = { authenticated: true };
  //     jest.spyOn(service, 'doAuthenticate').mockResolvedValue(result);

  //     expect(await controller.authenticate(session, headers, body)).toBe(
  //       result,
  //     );
  //   });

  //   it('should throw HttpException on failed authentication', async () => {
  //     const session = {};
  //     const headers = { origin: 'test' };
  //     const body = { credential: 'test' };
  //     jest
  //       .spyOn(service, 'doAuthenticate')
  //       .mockRejectedValue(new Error('Failed to authenticate'));

  //     await expect(
  //       controller.authenticate(session, headers, body),
  //     ).rejects.toThrow(HttpException);
  //   });
  // });
});
