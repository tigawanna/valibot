import { describe, expect, test, vi } from 'vitest';
import { minLength } from '../../actions/index.ts';
import { string } from '../../schemas/index.ts';
import { pipe } from '../index.ts';
import { cache, type SchemaWithCache } from './cache.ts';

describe('cache', () => {
  describe('should return schema object', () => {
    const schema = string();
    type Schema = typeof schema;
    const baseSchema: Omit<SchemaWithCache<Schema, never>, 'cacheConfig'> = {
      ...schema,
      cache: expect.any(Object),
      '~run': expect.any(Function),
    };

    test('without cache config', () => {
      expect(cache(schema)).toStrictEqual({
        ...baseSchema,
        cacheConfig: undefined,
        '~standard': {
          version: 1,
          vendor: 'valibot',
          validate: expect.any(Function),
        },
      } satisfies SchemaWithCache<Schema, undefined>);
    });

    test('with cache config', () => {
      expect(cache(schema, { maxSize: 123 })).toStrictEqual({
        ...baseSchema,
        cacheConfig: { maxSize: 123 },
        '~standard': {
          version: 1,
          vendor: 'valibot',
          validate: expect.any(Function),
        },
      } satisfies SchemaWithCache<Schema, { maxSize: 123 }>);
    });
  });

  describe('should cache output', () => {
    test('for same input and config', () => {
      const baseSchema = string();
      const runSpy = vi.spyOn(baseSchema, '~run');
      const schema = cache(baseSchema);

      expect(schema['~run']({ value: 'foo' }, {})).toBe(
        schema['~run']({ value: 'foo' }, {})
      );
      expect(runSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('should respect config changes', () => {
    test('for lang config', () => {
      const baseSchema = string();
      const runSpy = vi.spyOn(baseSchema, '~run');
      const schema = cache(baseSchema);
      const defaultDataset = schema['~run']({ value: 'foo' }, {});
      const langDataset = schema['~run']({ value: 'foo' }, { lang: 'de' });

      expect(defaultDataset).not.toBe(langDataset);
      expect(schema['~run']({ value: 'foo' }, {})).toBe(defaultDataset);
      expect(schema['~run']({ value: 'foo' }, { lang: 'de' })).toBe(
        langDataset
      );
      expect(runSpy).toHaveBeenCalledTimes(2);
    });

    test('for abort config', () => {
      const schema = cache(pipe(string(), minLength(4), minLength(6)));
      const defaultDataset = schema['~run']({ value: 'foo' }, {});
      const abortDataset = schema['~run'](
        { value: 'foo' },
        { abortEarly: true }
      );

      expect(defaultDataset).not.toBe(abortDataset);
      expect(defaultDataset.issues).toHaveLength(2);
      expect(abortDataset.issues).toHaveLength(1);
    });
  });

  describe('should expose cache for manual clearing', () => {
    test('to invalidate cached output', () => {
      const schema = cache(string());
      const dataset = schema['~run']({ value: 'foo' }, {});

      expect(schema['~run']({ value: 'foo' }, {})).toBe(dataset);

      schema.cache.clear();

      expect(schema['~run']({ value: 'foo' }, {})).not.toBe(dataset);
    });
  });
});
