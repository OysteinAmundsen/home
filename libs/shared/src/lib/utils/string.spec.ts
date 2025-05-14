import {
  camelCase,
  hyphenate,
  interpolate,
  kebabCase,
  pascalCase,
  removeNonWord,
  sentenceCase,
  snakeCase,
  titleCase,
  unCamelCase,
  unhyphenate,
} from './string';

describe('string', () => {
  describe('camelCase', () => {
    it('should convert text to camelCase', () => {
      expect(camelCase('This is a test')).toEqual('thisIsATest');
    });
  });

  describe('unCamelCase', () => {
    it('should split up camelCase text into words', () => {
      const result = unCamelCase('thisShouldWork');
      expect(result).toEqual('this should work');
    });
    it('should handle camelCase texts where a word is just one letter', () => {
      const result = unCamelCase('thisIsATest');
      expect(result).toEqual('this is a test');
    });
  });

  describe('TitleCase', () => {
    it('should convert strings to titleCase', () => {
      expect(titleCase('This is a test')).toEqual('This Is A Test');
    });
  });

  describe('pascalCase', () => {
    it('should convert strings to pascalCase', () => {
      expect(pascalCase('This is a test')).toEqual('ThisIsATest');
    });
  });

  describe('sentenceCase', () => {
    it('should convert strings to sentenceCase', () => {
      expect(sentenceCase('This IS a Test. should Work')).toEqual('This is a test. Should work');
    });
  });
  describe('slugify', () => {
    it('should convert strings to slugs', () => {
      expect(kebabCase('This IS a Test. should Work')).toEqual('this-is-a-test-should-work');
    });
  });

  describe('hyphenate', () => {
    it('should hyphenate strings', () => {
      expect(hyphenate('ThisIs a test')).toEqual('this-is-a-test');
    });
  });

  describe('unhyphenate', () => {
    it('should unhyphenate strings', () => {
      expect(unhyphenate('this-is-a-test-')).toEqual('this is a test');
    });
  });

  describe('snakeCase', () => {
    it('should underscore strings', () => {
      expect(snakeCase('ThisIs a test')).toEqual('this_is_a_test');
    });
  });

  describe('removeNonWord', () => {
    it('should remove all non-word characters', () => {
      expect(removeNonWord('This_is-a_test')).toEqual('This is a test');
    });
  });

  describe('interpolate', () => {
    it('should interpolate all data into the string', () => {
      expect(interpolate('Hello {{ name }}, this is a {{test}}', { name: 'World', test: 'test' })).toEqual(
        'Hello World, this is a test',
      );
    });
  });
});
