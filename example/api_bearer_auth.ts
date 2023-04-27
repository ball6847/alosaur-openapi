import { App, Area, Controller, Get } from 'alosaur';
import { ApiBearerAuth, OpenApiMiddleware } from 'alosaur-openapi';

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

const openapi = {
  title: '@ApiBearerAuth() example',
};

app.use(new RegExp('^/api-docs'), new OpenApiMiddleware(openapi));
app.listen({ port: 3000 });
