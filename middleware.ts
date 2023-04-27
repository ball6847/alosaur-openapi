import { AlosaurOpenApiBuilder } from './builder.ts';
import {
  AlosaurRequest,
  Content,
  HttpContext,
  MiddlewareTarget,
  Redirect,
} from './deps/alosaur.ts';
import { generateHTML, swaggerInit } from './swagger_ui.ts';

export class OpenApiMiddleware implements MiddlewareTarget<unknown> {
  private builder: AlosaurOpenApiBuilder<unknown>;

  constructor(builder?: AlosaurOpenApiBuilder<unknown>) {
    this.builder = builder
      ? builder
      : AlosaurOpenApiBuilder.create({ areas: [] });
  }

  onPreRequest(context: HttpContext<unknown>) {
    if (context.request.url.endsWith('/swagger.json')) {
      const swaggerDoc = this.getSwaggerDoc(context.request);
      context.response.result = Content(swaggerDoc, 200);
    } else if (context.request.url.endsWith('/swagger-ui-init.js')) {
      context.response.result = Content(
        swaggerInit,
        200,
        new Headers({ 'Content-Type': 'text/javascript' }),
      );
    } else if (!context.request.url.endsWith('/')) {
      context.response.result = Redirect(context.request.url.concat('/'));
    } else {
      const swaggerDoc = this.getSwaggerDoc(context.request);
      const html = generateHTML(swaggerDoc);
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
        url: new URL(req.url).origin,
      })
      .getSpec();
  }
}
