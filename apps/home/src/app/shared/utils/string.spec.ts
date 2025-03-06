import * as utils from './string';

describe('string', () => {
  describe('camelCase', () => {
    it('should convert text to camelCase', () => {
      expect(utils.camelCase('This is a test')).toEqual('thisIsATest');
    });
  });

  describe('unCamelCase', () => {
    it('should split up camelCase text into words', () => {
      const result = utils.unCamelCase('thisShouldWork');
      expect(result).toEqual('this should work');
    });
    it('should handle camelCase texts where a word is just one letter', () => {
      const result = utils.unCamelCase('thisIsATest');
      expect(result).toEqual('this is a test');
    });
  });

  describe('TitleCase', () => {
    it('should convert strings to titleCase', () => {
      expect(utils.titleCase('This is a test')).toEqual('This Is A Test');
    });
  });

  describe('pascalCase', () => {
    it('should convert strings to pascalCase', () => {
      expect(utils.pascalCase('This is a test')).toEqual('ThisIsATest');
    });
  });

  describe('sentenceCase', () => {
    it('should convert strings to sentenceCase', () => {
      expect(utils.sentenceCase('This IS a Test. should Work')).toEqual('This is a test. Should work');
    });
  });
  describe('slugify', () => {
    it('should convert strings to slugs', () => {
      expect(utils.slugify('This IS a Test. should Work', '-')).toEqual('this-is-a-test-should-work');
    });
  });

  describe('hyphenate', () => {
    it('should hyphenate strings', () => {
      expect(utils.hyphenate('ThisIs a test')).toEqual('this-is-a-test');
    });
  });

  describe('unhyphenate', () => {
    it('should unhyphenate strings', () => {
      expect(utils.unhyphenate('this-is-a-test-')).toEqual('this is a test');
    });
  });

  describe('snakeCase', () => {
    it('should underscore strings', () => {
      expect(utils.underscore('ThisIs a test')).toEqual('this_is_a_test');
    });
  });

  describe('removeNonWord', () => {
    it('should remove all non-word characters', () => {
      expect(utils.removeNonWord('This_is-a_test')).toEqual('This is a test');
    });
  });

  describe('stringify object', () => {
    it('should convert object to a string', () => {
      expect(utils.objToString({})).toEqual('{}');
      expect(utils.objToString({ a: 1, b: 2 })).toEqual('{"a":1,"b":2}');
    });
    it('should truncate circular dependencies', () => {
      const a: any = { a: 1, b: 2 };
      const b: any = { a, b: 2 };
      a.c = b;
      expect(utils.objToString(a)).toEqual('{"a":1,"b":2,"c":{"a":"#REF:$","b":2}}');
    });
  });
});
