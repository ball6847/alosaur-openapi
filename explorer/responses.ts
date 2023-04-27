import { Reflect, ResponseObject, RouteMetadata } from "../deps/alosaur.ts";
import { merge } from "../deps/midash.ts";
import { DECORATORS } from "../nestjs/constants.ts";
import { buildSchemaObject } from "./utils/schema_object.ts";

export function exploreResponses(route: RouteMetadata) {
  // controller
  const classResponses =
    Reflect.getMetadata(DECORATORS.API_RESPONSE, route.target.constructor) ??
    {};
  // action
  const descriptor = Object.getOwnPropertyDescriptor(
    route.actionMetadata.object,
    route.action
  );
  const propertyResponses = descriptor
    ? Reflect.getMetadata(DECORATORS.API_RESPONSE, descriptor.value) ?? {}
    : {};
  const metadata = merge(classResponses, propertyResponses);
  const responses: Record<string, ResponseObject> = {};
  Object.keys(metadata).forEach((code: string) => {
    responses[code] = {
      description: metadata[code].description,
      content: {
        "application/json": {
          schema: buildSchemaObject(metadata[code].type),
        },
      },
    };
  });
  return responses;
}
