# API Documentation with Swagger & Postman

This project uses Swagger (OpenAPI) to document the API. The documentation is automatically generated from the code using decorators.

## Viewing Documentation

1.  Start the application:
    ```bash
    npm run start:dev
    ```
2.  Open your browser and navigate to:
    `http://localhost:3000/api`

## Generating Postman Collection

To import this documentation into Postman:

1.  **Simply start the application:**

    ```bash
    npm run start:dev
    ```

    The `swagger.json` file will be automatically generated/updated in the project root every time the application starts or reloads.

2.  Open Postman.
3.  Click **Import**.
4.  Select the `swagger.json` file.
5.  Postman will create a collection with all requests, examples, and descriptions.

## Automation

The documentation is automatically updated whenever you save changes to the code (triggering a reload) or restart the server.
To update Postman, simply re-import the `swagger.json` file.

## Decorators Used

- `@ApiTags`: Groups endpoints.
- `@ApiOperation`: Describes what the endpoint does.
- `@ApiResponse`: Describes potential responses (200, 400, 403, etc.).
- `@ApiProperty`: Describes DTO properties (request/response bodies).
- `@ApiBearerAuth`: Indicates endpoints requiring JWT authentication.
