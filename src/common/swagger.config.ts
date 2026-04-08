import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';

export function setupSwagger(app: INestApplication): void {
  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('LMS API')
    .setDescription(
      `## Learning Management System REST API

This API powers the LMS platform, supporting:
- **Authentication** – signup, login, password reset
- **Users** – CRUD for all user roles (SuperAdmin, Admin, Tutor, Learner)
- **Courses** – course management, tutor assignment, learner enrollment, content tree
- **Assessments** – quizzes, code challenges, group Kahoot-style sessions
- **AI** – audio transcription, quiz/flashcard generation, performance analysis

### Authentication
All protected endpoints require a **Bearer JWT token**.  
Obtain a token via \`POST /auth/login\` and pass it as:
\`\`\`
Authorization: Bearer <token>
\`\`\`

### Roles
| Role | Description |
|------|-------------|
| \`superadmin\` | Full access |
| \`admin\` | Manage courses, users, assessments |
| \`tutor\` | Manage assigned course content |
| \`learner\` | View content, submit assessments |
`,
    )
    .setVersion('1.0')
    .setContact('LMS Team', '', 'support@lms.example.com')
    .addServer('http://localhost:3000', 'Local Development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT',
    )
    .addTag('Authentication', 'Signup, login, and password management')
    .addTag('Users', 'User CRUD operations')
    .addTag('Courses', 'Course management, tutors, learners, and content')
    .addTag('Assessments', 'Quizzes, code challenges, and group sessions')
    .addTag('AI', 'AI-powered features: transcription, quiz/flashcard generation')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'LMS API Docs',
  });

  // Write OpenAPI JSON (importable into Postman)
  fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
  console.log('✅ Swagger UI:   http://localhost:3000/api');
  console.log('✅ OpenAPI JSON: ./swagger.json  (import into Postman)');

  // Write Postman collection v2.1
  const postman = buildPostmanCollection(document);
  fs.writeFileSync('./postman_collection.json', JSON.stringify(postman, null, 2));
  console.log('✅ Postman collection: ./postman_collection.json');
}

// ---------------------------------------------------------------------------
// Minimal Postman Collection v2.1 builder from an OpenAPI document
// ---------------------------------------------------------------------------
function buildPostmanCollection(openapi: any): object {
  const baseUrl = '{{baseUrl}}';

  const tagOrder = ['Authentication', 'Users', 'Courses', 'Assessments', 'AI'];
  const folderMap: Record<string, any[]> = {};
  tagOrder.forEach((t) => (folderMap[t] = []));

  for (const [path, methods] of Object.entries<any>(openapi.paths ?? {})) {
    for (const [method, op] of Object.entries<any>(methods)) {
      if (!op || typeof op !== 'object') continue;

      const tag: string = (op.tags?.[0] as string) ?? 'Other';
      if (!folderMap[tag]) folderMap[tag] = [];

      // Build URL
      const rawSegments = path.replace(/^\//, '').split('/');
      const segments = rawSegments.map((s: string) =>
        s.startsWith('{') ? { value: `:${s.slice(1, -1)}`, key: s.slice(1, -1) } : s,
      );

      const urlObj: any = {
        raw: `${baseUrl}/${rawSegments.join('/')}`,
        host: [baseUrl],
        path: segments,
      };

      // Query params
      const queryParams = (op.parameters ?? []).filter((p: any) => p.in === 'query');
      if (queryParams.length) {
        urlObj.query = queryParams.map((p: any) => ({
          key: p.name,
          value: '',
          description: p.description ?? '',
          disabled: !p.required,
        }));
      }

      // Path variables
      const pathParams = (op.parameters ?? []).filter((p: any) => p.in === 'path');
      if (pathParams.length) {
        urlObj.variable = pathParams.map((p: any) => ({
          key: p.name,
          value: '',
          description: p.description ?? '',
        }));
      }

      // Request body
      let body: any = undefined;
      const reqBody = op.requestBody;
      if (reqBody) {
        const jsonContent = reqBody.content?.['application/json'];
        const formContent = reqBody.content?.['multipart/form-data'];
        if (jsonContent) {
          body = {
            mode: 'raw',
            raw: JSON.stringify(buildExampleFromSchema(jsonContent.schema, openapi), null, 2),
            options: { raw: { language: 'json' } },
          };
        } else if (formContent) {
          body = {
            mode: 'formdata',
            formdata: Object.entries<any>(formContent.schema?.properties ?? {}).map(
              ([key, val]: [string, any]) => ({
                key,
                value: '',
                description: val.description ?? '',
                type: val.format === 'binary' ? 'file' : 'text',
              }),
            ),
          };
        }
      }

      const item: any = {
        name: op.summary ?? `${method.toUpperCase()} ${path}`,
        request: {
          method: method.toUpperCase(),
          header: [{ key: 'Content-Type', value: 'application/json' }],
          url: urlObj,
          description: op.description ?? '',
        },
      };

      if (body) item.request.body = body;

      // Auth header placeholder (bearer)
      const secured =
        op.security?.some((s: any) => s['JWT'] !== undefined) ||
        op.security?.some((s: any) => s['bearer'] !== undefined);
      if (secured) {
        item.request.auth = { type: 'bearer', bearer: [{ key: 'token', value: '{{token}}', type: 'string' }] };
      }

      folderMap[tag].push(item);
    }
  }

  const folders = Object.entries(folderMap)
    .filter(([, items]) => items.length > 0)
    .map(([name, items]) => ({ name, item: items }));

  return {
    info: {
      name: 'LMS API',
      description: 'Learning Management System – auto-generated from OpenAPI spec',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'baseUrl', value: 'http://localhost:3000', type: 'string' },
      { key: 'token', value: '', type: 'string', description: 'JWT Bearer token from /auth/login' },
    ],
    item: folders,
  };
}

function buildExampleFromSchema(schema: any, openapi: any, depth = 0): any {
  if (!schema || depth > 4) return {};

  // Resolve $ref
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/', '').split('/');
    let resolved: any = openapi;
    for (const part of refPath) resolved = resolved?.[part];
    return buildExampleFromSchema(resolved, openapi, depth + 1);
  }

  if (schema.example !== undefined) return schema.example;

  if (schema.type === 'object' || schema.properties) {
    const obj: any = {};
    for (const [key, val] of Object.entries<any>(schema.properties ?? {})) {
      obj[key] = buildExampleFromSchema(val, openapi, depth + 1);
    }
    return obj;
  }

  if (schema.type === 'array') {
    return [buildExampleFromSchema(schema.items, openapi, depth + 1)];
  }

  if (schema.enum) return schema.enum[0];

  const defaults: Record<string, any> = {
    string: '',
    number: 0,
    integer: 0,
    boolean: false,
  };
  return defaults[schema.type] ?? null;
}
