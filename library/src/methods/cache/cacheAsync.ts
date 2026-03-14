import type {
  BaseIssue,
  BaseSchema,
  BaseSchemaAsync,
  Config,
  InferInput,
  InferIssue,
  InferOutput,
  OutputDataset,
  StandardProps,
  UnknownDataset,
} from '../../types/index.ts';
import { _getStandardProps } from '../../utils/index.ts';
import { _LruCache } from './_LruCache.ts';
import type { Cache, CacheConfig } from './types.ts';

/**
 * Schema with cache async type.
 */
export type SchemaWithCacheAsync<
  TSchema extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  TCacheConfig extends CacheConfig | undefined,
> = Omit<TSchema, 'async' | '~standard' | '~run'> & {
  /**
   * Whether it's async.
   */
  readonly async: true;

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

  /**
   * The Standard Schema properties.
   *
   * @internal
   */
  readonly '~standard': StandardProps<
    InferInput<TSchema>,
    InferOutput<TSchema>
  >;

  /**
   * Parses unknown input values.
   *
   * @param dataset The input dataset.
   * @param config The configuration.
   *
   * @returns The output dataset.
   *
   * @internal
   */
  readonly '~run': (
    dataset: UnknownDataset,
    config: Config<BaseIssue<unknown>>
  ) => Promise<OutputDataset<InferOutput<TSchema>, InferIssue<TSchema>>>;
};

/**
 * Caches the output of a schema.
 *
 * @param schema The schema to cache.
 *
 * @returns The cached schema.
 */
// @ts-expect-error
export function cacheAsync<
  const TSchema extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
>(schema: TSchema): SchemaWithCacheAsync<TSchema, undefined>;

/**
 * Caches the output of a schema.
 *
 * @param schema The schema to cache.
 * @param config The cache config.
 *
 * @returns The cached schema.
 */
export function cacheAsync<
  const TSchema extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  const TCacheConfig extends CacheConfig | undefined,
>(
  schema: TSchema,
  config: TCacheConfig
): SchemaWithCacheAsync<TSchema, TCacheConfig>;

// @__NO_SIDE_EFFECTS__
export function cacheAsync(
  schema:
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  config?: CacheConfig
): SchemaWithCacheAsync<
  | BaseSchema<unknown, unknown, BaseIssue<unknown>>
  | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  CacheConfig | undefined
> {
  let activeRuns:
    | Map<string, Promise<OutputDataset<unknown, BaseIssue<unknown>>>>
    | undefined;
  return {
    ...schema,
    async: true,
    cacheConfig: config,
    cache: new _LruCache(config),
    get '~standard'() {
      return _getStandardProps(this);
    },
    async '~run'(dataset, runConfig) {
      // Create cache key based on input and config
      const key = this.cache.key(dataset.value, runConfig);

      // Check and return cached output if exists
      const cached = this.cache.get(key);
      if (cached) return cached;

      // If not cached, check if a matching run is already in progress
      let promise = activeRuns?.get(key);
      if (!promise) {
        activeRuns ??= new Map();
        promise = Promise.resolve(schema['~run'](dataset, runConfig));
        activeRuns.set(key, promise);
      }

      // Await pending promise, cache output and return
      try {
        const outputDataset = await promise;
        this.cache.set(key, outputDataset);
        return outputDataset;

        // Cleanup active runs map
      } finally {
        activeRuns?.delete(key);
      }
    },
  };
}
