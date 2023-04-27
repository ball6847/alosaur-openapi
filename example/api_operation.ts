import { App, Area, Controller, Get } from 'alosaur';
import {
  AlosaurOpenApiBuilder,
  ApiOperation,
  OpenApiMiddleware,
} from 'alosaur-openapi';

// -------------------------------------------------------------------

const codeDelim = '```';

const doc = `
This api operation returns a **hello world** message

${codeDelim}
const name = "code preview should work with no syntax highlighting";
console.log(name);
${codeDelim}

Link should work - [Github](https://github.com/)
`;

@Controller('/api/example')
class ExampleController {
  @ApiOperation({
    summary: 'says hello to the world',
    tags: ['Example'],
    description: doc,
  })
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
  .addDescription('Example on how to use @ApiOperation() decorator')
  .addBearerAuth();

app.use(new RegExp('^/api-docs'), new OpenApiMiddleware(openapi));
app.listen({ port: 3000 });
