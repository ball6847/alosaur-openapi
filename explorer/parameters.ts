// deno-lint-ignore-file no-explicit-any
import { Reflect, RouteMetadata } from '../deps/alosaur.ts';
import { DECORATORS } from '../nestjs/constants.ts';
import { ApiQueryOptions } from '../nestjs/decorators/mod.ts';
import { getPropertyType } from './utils/schema_object.ts';

export function exploreParameters(
  route: RouteMetadata,
): (ApiQueryOptions & Record<string, any>)[] {
  const descriptor = Object.getOwnPropertyDescriptor(
    route.actionMetadata.object,
    route.action,
  );
  if (!descriptor) {
    return [];
  }
  const metadata: (ApiQueryOptions & Record<string, any>)[] = Reflect
    .getMetadata(
      DECORATORS.API_PARAMETERS,
      descriptor.value,
    );
  if (!metadata) {
    return [];
  }
  return metadata.map((item) => {
    if ('type' in item) {
      // @ts-ignore schema does not always exist
      item.schema = {
        type: getPropertyType(item.type),
      };
      delete item.type;
    }
    return item;
  });
}
