import { App, Area, Controller, Get } from 'alosaur';
import {
  AlosaurOpenApiBuilder,
  ApiBearerAuth,
  OpenApiMiddleware,
} from 'alosaur-openapi';

// -------------------------------------------------------------------

@Controller('/api/example')
class ExampleController {
  @ApiBearerAuth()
  @Get('/hello')
  hello() {
    return {
      message: 'Hello World',
    };
  }
}

@Area({
  controllers: [ExampleController],
})
class ExampleArea {}

// -------------------------------------------------------------------

const app = new App({
  areas: [ExampleArea],
});

const openapi = AlosaurOpenApiBuilder
  .create({ areas: [] })
  .addTitle('Example')
  .addVersion('1.0.0')
  .addDescription('Example on how to use @ApiBearerAuth() decorator')
  .addBearerAuth();

app.use(new RegExp('^/api-docs'), new OpenApiMiddleware(openapi));
app.listen({ port: 3000 });
