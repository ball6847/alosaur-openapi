import { Reflect, RouteMetadata } from "../deps/alosaur.ts";
import { DECORATORS } from "../nestjs/constants.ts";

export function exploreClassTags(route: RouteMetadata): string[] {
  return (
    Reflect.getMetadata(DECORATORS.API_TAGS, route.target.constructor) ?? []
  );
}

export function explorePropertyTags(route: RouteMetadata): string[] {
  const descriptor = Object.getOwnPropertyDescriptor(
    route.actionMetadata.object,
    route.action
  );
  if (!descriptor) {
    return [];
  }
  return Reflect.getMetadata(DECORATORS.API_TAGS, descriptor.value) ?? [];
}
