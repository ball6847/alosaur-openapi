// deno-lint-ignore-file ban-types
import { DECORATORS } from '../constants.ts';
import { createMixedDecorator } from './helpers.ts';

type ContentTypeMap = Record<string, Function>;

export function ApiConsumes(...mimeTypes: string[]) {
  return createMixedDecorator(DECORATORS.API_CONSUMES, mimeTypes);
}