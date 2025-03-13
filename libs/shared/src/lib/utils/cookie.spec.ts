import { TestBed } from '@angular/core/testing';
import { CookieService } from './cookie';

describe('CookieService', () => {
  let service: CookieService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [CookieService],
    }).compileComponents();

    service = TestBed.inject(CookieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCookie', () => {
    it('should return the value of the cookie', () => {
      document.cookie = 'testCookie=testValue';
      expect(service.getCookie('testCookie')).toBe('testValue');
    });

    it('should return an empty string if the cookie does not exist', () => {
      expect(service.getCookie('nonExistentCookie')).toBe('');
    });
  });

  describe('setCookie', () => {
    it('should set a cookie with the given name and value', () => {
      service.setCookie('testCookie', 'testValue');
      expect(document.cookie).toContain('testCookie=testValue');
    });

    it('should set a cookie with the given options', () => {
      service.setCookie('testCookie', 'testValue', { expireIn: 1 });
      expect(document.cookie).toContain('testCookie=testValue');
    });
  });

  describe('removeCookie', () => {
    it('should remove the cookie with the given name', () => {
      document.cookie = 'testCookie=testValue';
      service.removeCookie('testCookie');
      expect(document.cookie).not.toContain('testCookie=testValue');
    });
  });
});
