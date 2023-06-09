// deno-lint-ignore-file ban-types no-explicit-any no-unused-vars
import {
  AppSettings,
  DenoDoc,
  getDenoDoc,
  getMetadataArgsStorage,
  getOpenApiMetadataArgsStorage,
  getParsedNames,
  getSchemeByDef,
  getShemeByEnumDef,
  MetadataArgsStorage,
  ObjectKeyAny,
  OpenApiArgsStorage,
  OpenApiBuilder,
  OpenAPIObject,
  OperationObject,
  ParameterObject,
  ParamType,
  ParsedNamesDocMap,
  PathItemObject,
  registerAreas,
  registerControllers,
  RouteMetadata,
  SecuritySchemeObject,
  ServerObject,
} from './deps/alosaur.ts';
import { exploreConsumes } from './explorer/consumes.ts';
import { exploreOperation } from './explorer/operation.ts';
import { exploreParameters } from './explorer/parameters.ts';
import { exploreResponses } from './explorer/responses.ts';
import { exploreSecurity } from './explorer/security.ts';
import { exploreClassTags, explorePropertyTags } from './explorer/tags.ts';
import { buildSchemaObject } from './explorer/utils/schema_object.ts';

/**
 * For testing this builder use this editor:
 * https://editor.swagger.io/
 */

// Builder OpenAPI v3.0.0
export class AlosaurOpenApiBuilder<T> {
  private classes: ObjectKeyAny[] = [];
  private appMetadata: MetadataArgsStorage<T>;
  private openApiMetadata: OpenApiArgsStorage<T>;
  private routes: RouteMetadata[] = [];
  private builder = new OpenApiBuilder();
  private denoDocs?: DenoDoc.RootDef[];
  private namesDenoDocMap?: ParsedNamesDocMap;

  static create<T>(settings: AppSettings): AlosaurOpenApiBuilder<T> {
    return new AlosaurOpenApiBuilder(settings);
  }

  constructor(private readonly settings: AppSettings) {
    this.appMetadata = getMetadataArgsStorage();
    this.openApiMetadata = getOpenApiMetadataArgsStorage();
  }

  public registerControllers(): AlosaurOpenApiBuilder<T> {
    registerAreas(this.appMetadata);
    registerControllers(
      this.appMetadata,
      this.classes,
      (route: RouteMetadata) => {
        // '/app/home/test/:id/:name/detail' => '/app/home/test/{id}/{name}/detail'
        const openApiRoute: string = route.route.replace(
          /:[A-Za-z1-9]+/g,
          (m) => `{${m.substr(1)}}`,
        );

        this.builder.addPath(openApiRoute, this.getPathItem(route));
      },
      false,
    );

    return this;
  }

  public getSpec(): OpenAPIObject {
    return this.builder.getSpec();
  }

  public saveToFile(path = './openapi.json'): AlosaurOpenApiBuilder<T> {
    Deno.writeTextFileSync(path, JSON.stringify(this.getSpec()));
    return this;
  }

  public saveDenoDocs(path = './docs.json'): AlosaurOpenApiBuilder<T> {
    Deno.writeTextFileSync(path, JSON.stringify(this.denoDocs));
    return this;
  }

  public print(): void {
    console.log(this.builder.getSpec());
  }

  /**
   * Gets operation from app route metadata
   */
  private getPathItem(route: RouteMetadata): PathItemObject {
    // console.log('--------------------');
    // console.log(route);

    const controllerClassName: string = route.target.constructor.name;

    const operation: OperationObject = exploreOperation(route);
    const classTags = exploreClassTags(route);
    const propertyTags = explorePropertyTags(route);
    const responses = exploreResponses(route);
    const security = exploreSecurity(route);
    const consumes = exploreConsumes(route);
    const parameters = exploreParameters(route);

    operation.tags = [...(operation.tags || []), ...classTags, ...propertyTags];

    if (security.length) {
      operation.security = security;
    }

    const defaultResponse = {
      '200': {
        description: '',
      },
    };

    // still no tags defined, fallback to class name
    operation.tags = operation.tags && operation.tags.length
      ? operation.tags
      : [controllerClassName];

    operation.responses = Object.keys(responses).length
      ? responses
      : defaultResponse;

    // @ts-ignore: Object is possibly 'null'.
    operation.parameters = [] as ParameterObject[];

    // Parse each route params
    route.params.forEach((param, index) => {
      switch (param.type) {
        case ParamType.Query:
          // @ts-ignore: Object is possibly 'null'.
          operation.parameters.push({
            // @ts-ignore: Object is possibly 'null'.
            name: param.name,
            in: 'query',
            schema: { type: 'string' },
          });
          break;

        case ParamType.RouteParam:
          // @ts-ignore: Object is possibly 'null'.
          operation.parameters.push({
            // @ts-ignore: Object is possibly 'null'.
            name: param.name,
            required: true,
            in: 'path',
            schema: { type: 'string' },
          });
          break;

        case ParamType.Cookie:
          // @ts-ignore: Object is possibly 'null'.
          operation.parameters.push({
            // @ts-ignore: Object is possibly 'null'.
            name: param.name,
            in: 'cookie',
            schema: { type: 'string' },
          });
          break;
        case ParamType.Body:
          if (param.transform) {
            const schema = buildSchemaObject(param.transform);
            if (schema) {
              this.builder.addSchema(param.transform.name, schema);
              if (consumes.length) {
                // body with ApiConsumes decorator
                operation.requestBody = {
                  required: true,
                  content: consumes.reduce(
                    (acc: any, consume: string) => {
                      acc[consume] = { schema };
                      return acc;
                    },
                    {},
                  ),
                };
              } else {
                // body without ApiConsumes decorator, usually @Body() param
                operation.requestBody = {
                  required: true,
                  content: {
                    'application/json': {
                      schema: {
                        $ref: GetShemeLinkAndRegister(param.transform.name),
                      },
                    },
                  },
                };
              }
            }
          } else {
            // @ApiConsumes with @ApiBody together
            if (consumes.length && parameters.length) {
              operation.requestBody = {
                required: true,
                content: consumes.reduce(
                  (acc: any, consume: string) => {
                    acc[consume] = {
                      schema: parameters[0].schema,
                    };
                    return acc;
                  },
                  {},
                ),
              };
            }
          }

          break;
      }
    });

    // parameters override from alosaur-openapi decorators
    parameters.forEach((param) => {
      // @ApiBody() has been processed above in ParamType.Body
      if (param.in === 'body') {
        return;
      }
      // @ts-ignore: Object is possibly 'null'.
      const index = operation.parameters.findIndex((p: ParameterObject) =>
        p.name === param.name && p.in === param.in
      );
      // if found, overwrite, else push
      if (index !== -1) {
        // @ts-ignore: Object is possibly 'null'.
        operation.parameters[index] = param;
      } else {
        // @ts-ignore: Object is possibly 'null'.
        operation.parameters.push(param);
      }
    });

    return {
      [route.method.toLowerCase()]: operation,
    };
  }

  public addTitle(title: string): AlosaurOpenApiBuilder<T> {
    this.builder.addTitle(title);
    return this;
  }

  public addVersion(version: string): AlosaurOpenApiBuilder<T> {
    this.builder.addVersion(version);
    return this;
  }

  public addDescription(description: string): AlosaurOpenApiBuilder<T> {
    this.builder.addDescription(description);
    return this;
  }

  public addServer(server: ServerObject): AlosaurOpenApiBuilder<T> {
    this.builder.addServer(server);
    return this;
  }

  /**
   * A generic security scheme definition for those cannot be easily described, for example apiKey
   *
   * You need to decorate your controller or action using @ApiSecurity() decorator
   * to specify where to apply this scheme
   *
   * @example
   * // builder
   * AlosaurOpenApiBuilder
   *  .create()
   *  .addSecurityScheme('app_api_key', {
   *    type: 'apiKey',
   *    in: 'header',
   *    name: 'X-API-Key',
   *  });
   *
   * // controller
   * ＠ApiSecurity('app_api_key')
   * ＠Get('/cat)
   * async getCat() {}
   *
   * @link https://swagger.io/docs/specification/authentication/
   *
   * @param id unique id for security scheme
   * @param scheme security scheme specification
   *
   * @returns AlosaurOpenApiBuilder
   */
  public addSecurityScheme(id: string, scheme: SecuritySchemeObject) {
    this.builder.addSecurityScheme(id, scheme);
    return this;
  }

  /**
   * Adds bearer auth scheme to openapi spec
   *
   * You need to decorate your controller or action using @ApiBeaterAuth() decorator
   * to specify where to apply this scheme
   *
   * @link https://swagger.io/docs/specification/authentication/bearer-authentication/
   *
   * @returns AlosaurOpenApiBuilder
   */
  public addBearerAuth() {
    this.builder.addSecurityScheme('bearer', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
    return this;
  }

  /**
   * Adds basic auth scheme to openapi spec
   *
   * You need to decorate your controller or action using @ApiBasicAuth() decorator
   * to specify where to apply this scheme
   *
   * @link https://swagger.io/docs/specification/authentication/basic-authentication/
   *
   * @returns AlosaurOpenApiBuilder
   */
  public addBasicAuth() {
    this.builder.addSecurityScheme('basic', {
      type: 'http',
      scheme: 'basic',
    });
    return this;
  }

  public addOAuth2(option: SecuritySchemeObject = { type: 'oauth2' }) {
    this.builder.addSecurityScheme('oauth2', {
      flows: {},
      ...option,
      type: option.type || 'oauth2',
    });
    return this;
  }

  public addCookieAuth(name = 'connect.sid') {
    this.builder.addSecurityScheme('cookie', {
      type: 'apiKey',
      in: 'cookie',
      name,
    });
    return this;
  }

  public addDenoDocs(docs: any): AlosaurOpenApiBuilder<T> {
    this.denoDocs = docs;
    this.namesDenoDocMap = getParsedNames(docs);

    return this;
  }

  public addSchemeComponents(): AlosaurOpenApiBuilder<T> {
    const namesSets = getOpenApiMetadataArgsStorage().usableClassNamesSet;

    if (!this.namesDenoDocMap) {
      throw new Error('Run addDenoDocs before start scheme components!');
    }

    this.namesDenoDocMap!.classes.forEach((classObj) => {
      if (namesSets.has(classObj.name)) {
        this.builder.addSchema(classObj.name, getSchemeByDef(classObj));
      }
    });

    this.namesDenoDocMap!.interfaces.forEach((interfaceObj) => {
      if (namesSets.has(interfaceObj.name)) {
        this.builder.addSchema(interfaceObj.name, getSchemeByDef(interfaceObj));
      }
    });

    this.namesDenoDocMap!.enums.forEach((enumDef) => {
      if (namesSets.has(enumDef.name)) {
        this.builder.addSchema(enumDef.name, getShemeByEnumDef(enumDef));
      }
    });

    return this;
  }

  public static async parseDenoDoc(path?: string): Promise<any> {
    return await getDenoDoc(path);
  }
}

/**
 * Gets right scheme link and register as uses
 * @param name
 */
function GetShemeLinkAndRegister(name: string): string {
  getOpenApiMetadataArgsStorage().usableClassNamesSet.add(name);
  return '#/components/schemas/' + name;
}