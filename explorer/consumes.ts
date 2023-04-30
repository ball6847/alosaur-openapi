// deno-lint-ignore-file ban-types
import { Reflect, RouteMetadata } from '../deps/alosaur.ts';
import { DECORATORS } from '../nestjs/constants.ts';

export function exploreConsumes(
  route: RouteMetadata,
): Record<string, Function>[] {
  const consumes = fromClass(route).concat(fromMethod(route));
  return consumes;
}

function fromClass(route: RouteMetadata) {
  return Reflect.getMetadata(
    DECORATORS.API_CONSUMES,
    route.target.constructor,
  ) ?? [];
}

function fromMethod(route: RouteMetadata) {
  const descriptor = Object.getOwnPropertyDescriptor(
    route.actionMetadata.object,
    route.action,
  );
  if (!descriptor) {
    return [];
  }
  const metadata = Reflect.getMetadata(
    DECORATORS.API_CONSUMES,
    descriptor.value,
  );
  return metadata ?? [];
}
