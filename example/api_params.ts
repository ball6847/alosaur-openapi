import { App, Area, Controller, Get, QueryParam } from 'alosaur';
import {
  AlosaurOpenApiBuilder,
  ApiParam,
  ApiQuery,
  OpenApiMiddleware,
} from 'alosaur-openapi';

// -------------------------------------------------------------------

enum ExampleEnum {
  AAA = 'AAA',
  BBB = 'BBB',
  CCC = 'CCC',
}

@Controller('/api/example')
class ExampleController {
  @ApiQuery({
    name: 'example',
    enum: ExampleEnum,
    required: false,
    description: 'Select example',
  })
  @ApiParam({
    name: 'person',
    type: String,
    required: true,
    description: 'Name of the person to greet',
  })
  @Get('/hello/:person')
  hello(@QueryParam('name') name = 'World') {
    return {
      message: `Hello ${name}`,
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
  .addDescription('Example on how to use @ApiQuery() @ApiParam() decorator')
  .addBearerAuth();

app.use(new RegExp('^/api-docs'), new OpenApiMiddleware(openapi));
app.listen({ port: 3000 });
