import type { PropertyProps } from '~/components';

export const properties: Record<string, PropertyProps> = {
  TValue: {
    modifier: 'extends',
    type: 'any',
  },
  get: {
    type: {
      type: 'function',
      params: [
        {
          name: 'key',
          type: 'unknown',
        },
        {
          name: 'configKey',
          optional: true,
          type: 'string',
        },
      ],
      return: {
        type: 'union',
        options: [
          {
            type: 'custom',
            name: 'TValue',
          },
          'undefined',
        ],
      },
    },
  },
  set: {
    type: {
      type: 'function',
      params: [
        {
          name: 'key',
          type: 'unknown',
        },
        {
          name: 'value',
          type: {
            type: 'custom',
            name: 'TValue',
          },
        },
        {
          name: 'configKey',
          optional: true,
          type: 'string',
        },
      ],
      return: 'void',
    },
  },
  clear: {
    type: {
      type: 'function',
      params: [],
      return: 'void',
    },
  },
};
