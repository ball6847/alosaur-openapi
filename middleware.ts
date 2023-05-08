import { AlosaurOpenApiBuilder } from './builder.ts';
import {
  AlosaurRequest,
  Content,
  HttpContext,
  MiddlewareTarget,
  OpenAPIObject,
  Redirect,
} from './deps/alosaur.ts';
import { generateHTML, swaggerInit } from './swagger_ui.ts';

export class OpenApiMiddleware implements MiddlewareTarget<unknown> {
  private builder: AlosaurOpenApiBuilder<unknown>;
  private swaggerDoc!: OpenAPIObject;

  constructor(builder?: AlosaurOpenApiBuilder<unknown>) {
    this.builder = builder
      ? builder
      : AlosaurOpenApiBuilder.create({ areas: [] });
  }

  onPreRequest(context: HttpContext<unknown>) {
    if (context.request.url.endsWith('/swagger.json')) {
      if (!this.swaggerDoc) {
        this.swaggerDoc = this.getSwaggerDoc(context.request);
      }
      context.response.result = Content(this.swaggerDoc, 200);
    } else if (context.request.url.endsWith('/swagger-ui-init.js')) {
      context.response.result = Content(
        swaggerInit,
        200,
        new Headers({ 'Content-Type': 'text/javascript' }),
      );
    } else if (!context.request.url.endsWith('/')) {
      context.response.result = Redirect(context.request.url.concat('/'));
    } else {
      if (!this.swaggerDoc) {
        this.swaggerDoc = this.getSwaggerDoc(context.request);
      }
      const html = generateHTML(this.swaggerDoc);
      context.response.result = Content(html, 200);
    }

    context.response.setImmediately();
  }

  onPostRequest(_context: HttpContext<unknown>) {
    return null;
  }

  getBuilder() {
    return this.builder;
  }

  getSwaggerDoc(req: AlosaurRequest) {
    return this.builder
      .registerControllers()
      .addServer({
        url: this.getServerUrl(req),
      })
      .getSpec();
  }

  private getServerUrl(req: AlosaurRequest) {
    const url = new URL(req.url);
    const proto = req.headers.has('x-forwarded-proto')
      ? `${req.headers.get('x-forwarded-proto')?.toLowerCase()}:`
      : url.protocol;
    return `${proto}//${url.host}`;
  }
}
