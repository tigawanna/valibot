import type { OutputDataset } from '../../types/dataset.ts';
import type {
  BaseIssue,
  BaseSchema,
  InferIssue,
  InferOutput,
} from '../../types/index.ts';
import { _getStandardProps } from '../../utils/index.ts';
import { _LruCache } from './_LruCache.ts';
import type { Cache, CacheConfig } from './types.ts';

/**
 * Schema with cache type.
 */
export type SchemaWithCache<
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  TCacheConfig extends CacheConfig | undefined,
> = TSchema & {
  /**
   * The cache config.
   */
  readonly cacheConfig: TCacheConfig;
  /**
   * The cache instance.
   */
  readonly cache: Cache<
    OutputDataset<InferOutput<TSchema>, InferIssue<TSchema>>
  >;
};

/**
 * Caches the output of a schema.
 *
 * @param schema The schema to cache.
 *
 * @returns The cached schema.
 */
export function cache<
  const TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(schema: TSchema): SchemaWithCache<TSchema, undefined>;

/**
 * Caches the output of a schema.
 *
 * @param schema The schema to cache.
 * @param config The cache config.
 *
 * @returns The cached schema.
 */
export function cache<
  const TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  const TCacheConfig extends CacheConfig | undefined,
>(
  schema: TSchema,
  config: TCacheConfig
): SchemaWithCache<TSchema, TCacheConfig>;

// @__NO_SIDE_EFFECTS__
export function cache(
  schema: BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  config?: CacheConfig
): SchemaWithCache<
  BaseSchema<unknown, unknown, BaseIssue<unknown>>,
  CacheConfig | undefined
> {
  return {
    ...schema,
    cacheConfig: config,
    cache: new _LruCache(config),
    get '~standard'() {
      return _getStandardProps(this);
    },
    '~run'(dataset, runConfig) {
      const key = this.cache.key(dataset.value, runConfig);
      let outputDataset = this.cache.get(key);
      if (!outputDataset) {
        this.cache.set(
          key,
          (outputDataset = schema['~run'](dataset, runConfig))
        );
      }
      return outputDataset;
    },
  };
}
