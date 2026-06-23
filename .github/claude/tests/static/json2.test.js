/**
 * @jest-environment jsdom
 */

// Load the JSON2 module
require('../../../static/json2.js');

describe('JSON2 Library', () => {
  beforeEach(() => {
    // Ensure we're testing the polyfill version
    if (global.JSON && global.JSON.stringify && global.JSON.parse) {
      // Temporarily remove native JSON to test polyfill
      global.nativeJSON = global.JSON;
      delete global.JSON;
      // Re-require the module to initialize polyfill
      delete require.cache[require.resolve('../../../static/json2.js')];
      require('../../../static/json2.js');
    }
  });

  afterEach(() => {
    // Restore native JSON if it existed
    if (global.nativeJSON) {
      global.JSON = global.nativeJSON;
      delete global.nativeJSON;
    }
  });

  describe('JSON.stringify', () => {
    test('should stringify simple objects', () => {
      const obj = { name: 'test', value: 42 };
      const result = JSON.stringify(obj);
      expect(result).toBe('{"name":"test","value":42}');
    });

    test('should stringify arrays', () => {
      const arr = [1, 2, 3, 'test'];
      const result = JSON.stringify(arr);
      expect(result).toBe('[1,2,3,"test"]');
    });

    test('should stringify nested objects', () => {
      const nested = {
        user: {
          name: 'John',
          age: 30,
          hobbies: ['reading', 'coding']
        }
      };
      const result = JSON.stringify(nested);
      expect(result).toBe('{"user":{"name":"John","age":30,"hobbies":["reading","coding"]}}');
    });

    test('should handle null values', () => {
      const obj = { value: null };
      const result = JSON.stringify(obj);
      expect(result).toBe('{"value":null}');
    });

    test('should handle undefined values by omitting them', () => {
      const obj = { defined: 'value', undefined: undefined };
      const result = JSON.stringify(obj);
      expect(result).toBe('{"defined":"value"}');
    });

    test('should handle boolean values', () => {
      const obj = { isTrue: true, isFalse: false };
      const result = JSON.stringify(obj);
      expect(result).toBe('{"isTrue":true,"isFalse":false}');
    });

    test('should handle numbers including zero', () => {
      const obj = { zero: 0, positive: 42, negative: -17, float: 3.14 };
      const result = JSON.stringify(obj);
      expect(result).toBe('{"zero":0,"positive":42,"negative":-17,"float":3.14}');
    });

    test('should escape special characters in strings', () => {
      const obj = { 
        quotes: 'He said "Hello"',
        backslash: 'Path\\to\\file',
        newline: 'Line 1\nLine 2',
        tab: 'Col1\tCol2'
      };
      const result = JSON.stringify(obj);
      expect(result).toContain('\\"');
      expect(result).toContain('\\\\');
      expect(result).toContain('\\n');
      expect(result).toContain('\\t');
    });

    test('should use replacer function when provided', () => {
      const obj = { name: 'test', password: 'secret', age: 25 };
      const replacer = function(key, value) {
        if (key === 'password') return undefined;
        return value;
      };
      const result = JSON.stringify(obj, replacer);
      expect(result).not.toContain('password');
      expect(result).not.toContain('secret');
    });

    test('should use replacer array when provided', () => {
      const obj = { name: 'test', password: 'secret', age: 25 };
      const replacer = ['name', 'age'];
      const result = JSON.stringify(obj, replacer);
      expect(result).toContain('name');
      expect(result).toContain('age');
      expect(result).not.toContain('password');
    });

    test('should handle space parameter for pretty printing', () => {
      const obj = { a: 1, b: 2 };
      const result = JSON.stringify(obj, null, 2);
      expect(result).toContain('\n');
      expect(result).toContain('  '); // 2 spaces
    });

    test('should return undefined for undefined input', () => {
      const result = JSON.stringify(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('JSON.parse', () => {
    test('should parse simple JSON strings', () => {
      const jsonString = '{"name":"test","value":42}';
      const result = JSON.parse(jsonString);
      expect(result).toEqual({ name: 'test', value: 42 });
    });

    test('should parse arrays', () => {
      const jsonString = '[1,2,3,"test"]';
      const result = JSON.parse(jsonString);
      expect(result).toEqual([1, 2, 3, 'test']);
    });

    test('should parse nested objects', () => {
      const jsonString = '{"user":{"name":"John","age":30}}';
      const result = JSON.parse(jsonString);
      expect(result).toEqual({
        user: {
          name: 'John',
          age: 30
        }
      });
    });

    test('should parse null values', () => {
      const jsonString = '{"value":null}';
      const result = JSON.parse(jsonString);
      expect(result.value).toBeNull();
    });

    test('should parse boolean values', () => {
      const jsonString = '{"isTrue":true,"isFalse":false}';
      const result = JSON.parse(jsonString);
      expect(result.isTrue).toBe(true);
      expect(result.isFalse).toBe(false);
    });

    test('should parse numbers', () => {
      const jsonString = '{"zero":0,"positive":42,"negative":-17,"float":3.14}';
      const result = JSON.parse(jsonString);
      expect(result.zero).toBe(0);
      expect(result.positive).toBe(42);
      expect(result.negative).toBe(-17);
      expect(result.float).toBe(3.14);
    });

    test('should handle escaped characters', () => {
      const jsonString = '{"quotes":"He said \\"Hello\\"","newline":"Line 1\\nLine 2"}';
      const result = JSON.parse(jsonString);
      expect(result.quotes).toBe('He said "Hello"');
      expect(result.newline).toBe('Line 1\nLine 2');
    });

    test('should use reviver function when provided', () => {
      const jsonString = '{"date":"2023-01-01","name":"test"}';
      const reviver = function(key, value) {
        if (key === 'date') return new Date(value);
        return value;
      };
      const result = JSON.parse(jsonString, reviver);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.name).toBe('test');
    });

    test('should throw error for invalid JSON', () => {
      const invalidJson = '{"name": invalid}';
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    test('should throw error for empty string', () => {
      expect(() => JSON.parse('')).toThrow();
    });

    test('should throw error for malformed JSON', () => {
      const malformedJson = '{"name": "test",}'; // trailing comma
      expect(() => JSON.parse(malformedJson)).toThrow();
    });
  });

  describe('Date.prototype.toJSON', () => {
    test('should add toJSON method to Date prototype', () => {
      const date = new Date('2023-01-01T12:00:00.000Z');
      expect(typeof date.toJSON).toBe('function');
    });

    test('should format date as ISO string', () => {
      const date = new Date('2023-01-01T12:00:00.000Z');
      const jsonDate = date.toJSON();
      expect(jsonDate).toBe('2023-01-01T12:00:00.000Z');
    });
  });

  describe('Circular Reference Handling', () => {
    test('should detect circular references', () => {
      const obj = { name: 'test' };
      obj.self = obj; // Create circular reference
      
      // The JSON2 implementation should detect this
      expect(() => JSON.stringify(obj)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty objects', () => {
      const result = JSON.stringify({});
      expect(result).toBe('{}');
    });

    test('should handle empty arrays', () => {
      const result = JSON.stringify([]);
      expect(result).toBe('[]');
    });

    test('should parse empty objects', () => {
      const result = JSON.parse('{}');
      expect(result).toEqual({});
    });

    test('should parse empty arrays', () => {
      const result = JSON.parse('[]');
      expect(result).toEqual([]);
    });
  });
});