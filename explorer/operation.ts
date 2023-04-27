import { Reflect, RouteMetadata } from '../deps/alosaur.ts';
import { DECORATORS } from '../nestjs/constants.ts';

export function exploreOperation(route: RouteMetadata) {
  const descriptor = Object.getOwnPropertyDescriptor(
    route.actionMetadata.object,
    route.action,
  );
  if (!descriptor) {
    return {};
  }
  const metadata = Reflect.getMetadata(
    DECORATORS.API_OPERATION,
    descriptor.value,
  );
  return metadata ?? {};
}
