import { Reflect, RouteMetadata } from '../deps/alosaur.ts';
import { DECORATORS } from '../nestjs/constants.ts';

export function exploreSecurity(route: RouteMetadata) {
  const security = getControllerSecurity(route).concat(
    getActionSecurity(route),
  );
  return security;
}

function getControllerSecurity(route: RouteMetadata) {
  return Reflect.getMetadata(
    DECORATORS.API_SECURITY,
    route.target.constructor,
  ) ?? [];
}

function getActionSecurity(route: RouteMetadata) {
  const descriptor = Object.getOwnPropertyDescriptor(
    route.actionMetadata.object,
    route.action,
  );
  if (!descriptor) {
    return [];
  }
  const metadata = Reflect.getMetadata(
    DECORATORS.API_SECURITY,
    descriptor.value,
  );
  return metadata ?? [];
}
