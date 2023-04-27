// deno-lint-ignore-file no-explicit-any ban-types

import { Reflect, SchemaObject } from '../../deps/alosaur.ts';
import { omit } from '../../deps/midash.ts';
import { DECORATORS } from '../../nestjs/constants.ts';

type ApiPropertyMetadata = {
  type: string | Function;
  required?: boolean;
  isArray?: boolean;
  items?: SchemaObject;
  properties?: SchemaObject['properties'];
};

export function buildSchemaObject(ctor: Function) {
  // @ts-ignore allow Function to be called as constructor
  const instance = new ctor();
  const properties: string[] =
    Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, instance) ?? [];
  if (!properties.length) {
    return {
      type: 'object',
      properties: {},
    };
  }
  const schema: SchemaObject = {
    type: 'object',
    properties: properties.reduce<SchemaObject>((acc, prop) => {
      const key = prop.substring(1);
      const property = buildSchemaProperty(instance, key);
      if (property) {
        acc[key] = property;
      }
      return acc;
    }, {}),
  };
  return schema;
}

function buildSchemaProperty(
  instance: any,
  property: string,
): SchemaObject | undefined {
  let prop: ApiPropertyMetadata = Reflect.getMetadata(
    DECORATORS.API_MODEL_PROPERTIES,
    instance,
    property,
  );
  if (!prop) {
    return undefined;
  }
  if (!prop.isArray && prop.type === Array) {
    return {
      type: 'array',
      items: {},
    };
  }
  // class with non-primitive type, aka class-transformer
  if (
    !prop.isArray &&
    typeof prop.type === 'function' &&
    !isPrimitiveType(prop.type)
  ) {
    return buildSchemaObject(prop.type);
  }
  // array
  if (prop.isArray) {
    prop = omit(prop, ['isArray']);
    if (typeof prop.type === 'function' && !isPrimitiveType(prop.type)) {
      const schema = buildSchemaObject(prop.type);
      if (schema) {
        prop.items = schema;
      } else {
        prop.items = {
          type: 'object',
          properties: {},
        };
      }
    } else {
      prop.items = {
        type: getPropertyType(prop.type),
      };
    }
    // remove complex type
    prop.type = 'array';
    return prop as SchemaObject;
  }
  // for primitive type
  prop.type = getPropertyType(prop.type);
  if (!prop.required) {
    prop = omit(prop, ['required']);
  }
  if (!prop.isArray) {
    prop = omit(prop, ['isArray']);
  }
  return prop as SchemaObject;
}

function isPrimitiveType(type: unknown) {
  return type === String || type === Number || type === Boolean;
}

export function getPropertyType(type: unknown) {
  switch (type) {
    case String:
      return 'string';
    case Number:
      return 'number';
    case Boolean:
      return 'boolean';
    case 'string':
    case 'number':
    case 'boolean':
      return type;
    default:
      return 'string';
  }
}
