import { Reflect, RouteMetadata } from "../deps/alosaur.ts";
import { DECORATORS } from "../nestjs/constants.ts";

export function exploreSecurity(route: RouteMetadata) {
  const descriptor = Object.getOwnPropertyDescriptor(
    route.actionMetadata.object,
    route.action
  );
  if (!descriptor) {
    return {};
  }
  const metadata = Reflect.getMetadata(
    DECORATORS.API_SECURITY,
    descriptor.value
  );
  return metadata ?? {};
}
