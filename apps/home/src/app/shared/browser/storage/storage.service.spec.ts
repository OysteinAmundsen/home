import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
    // service = new StorageService();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load values from localStorage', () => {
    localStorage.setItem('storage', JSON.stringify({ test: 'value' }));
    service = new StorageService();
    expect(service.get('test')).toBe('value');
  });

  it('should store values in localStorage', () => {
    service.clear();
    service.set('test', 'value');
    expect(localStorage.getItem('storage')).toContain('"test":"value"');
  });

  it('should get a simple value by key', () => {
    service.clear();
    service.set('test', 'value');
    expect(service.get('test')).toBe('value');
  });

  it('should merge values', () => {
    service.clear();
    service.set('test.key', 'value');
    service.set('test.otherkey', 'value');
    expect(localStorage.getItem('storage')).toContain('{"test":{"key":"value","otherkey":"value"}}');
  });

  it('should get a delimeted value by key', () => {
    service.set('auth.user', 'value');
    expect(service.get('auth.user')).toBe('value');
  });

  it('should return null for non-existing key', () => {
    expect(service.get('nonExistingKey')).toBeNull();
  });

  it('should remove a value by key', () => {
    service.set('test', 'value');
    service.remove('test');
    expect(service.get('test')).toBeNull();
  });

  it('should clear all values', () => {
    service.set('test', 'value');
    service.clear();
    expect(service.get('test')).toBeNull();
    expect(localStorage.getItem('storage')).toBe('{}');
  });

  it('should return the correct length', () => {
    service.clear();
    service.set('test.value.one', 'value');
    service.set('test.value.two', 'value1');
    service.set('test.value.three', 'value2');
    expect(localStorage.getItem('storage')).toContain(
      '{"test":{"value":{"one":"value","two":"value1","three":"value2"}}}',
    );
    expect(service.length).toBe(3);
  });
});
