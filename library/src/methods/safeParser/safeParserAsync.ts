import type {
  BaseIssue,
  BaseSchema,
  BaseSchemaAsync,
  Config,
  InferIssue,
} from '../../types/index.ts';
import { safeParseAsync, type SafeParseResult } from '../safeParse/index.ts';

/**
 * The safe parser async type.
 */
export interface SafeParserAsync<
  TSchema extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  TConfig extends Omit<Config<InferIssue<TSchema>>, 'skipPipe'> | undefined,
> {
  /**
   * Parses an unknown input based on the schema.
   */
  (input: unknown): Promise<SafeParseResult<TSchema>>;
  /**
   * The schema to be used.
   */
  readonly schema: TSchema;
  /**
   * The parser configuration.
   */
  readonly config: TConfig;
}

/**
 * Returns a function that parses an unknown input based on a schema.
 *
 * @param schema The schema to be used.
 *
 * @returns The parser function.
 */
export function safeParserAsync<
  const TSchema extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
>(schema: TSchema): SafeParserAsync<TSchema, undefined>;

/**
 * Returns a function that parses an unknown input based on a schema.
 *
 * @param schema The schema to be used.
 * @param config The parser configuration.
 *
 * @returns The parser function.
 */
export function safeParserAsync<
  const TSchema extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  const TConfig extends
    | Omit<Config<InferIssue<TSchema>>, 'skipPipe'>
    | undefined,
>(schema: TSchema, config: TConfig): SafeParserAsync<TSchema, TConfig>;

export function safeParserAsync(
  schema:
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  config?: Omit<
    Config<
      InferIssue<
        | BaseSchema<unknown, unknown, BaseIssue<unknown>>
        | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>
      >
    >,
    'skipPipe'
  >
): SafeParserAsync<
  | BaseSchema<unknown, unknown, BaseIssue<unknown>>
  | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
  | Omit<
      Config<
        InferIssue<
          | BaseSchema<unknown, unknown, BaseIssue<unknown>>
          | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>
        >
      >,
      'skipPipe'
    >
  | undefined
> {
  const func: SafeParserAsync<
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
    | Omit<
        Config<
          InferIssue<
            | BaseSchema<unknown, unknown, BaseIssue<unknown>>
            | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>
          >
        >,
        'skipPipe'
      >
    | undefined
  > = (input: unknown) => safeParseAsync(schema, input, config);
  // @ts-expect-error
  func.schema = schema;
  // @ts-expect-error
  func.config = config;
  return func;
}
