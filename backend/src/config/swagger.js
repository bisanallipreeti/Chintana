import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Chintana API",
      version: "1.0.0",
      description: "Production API for Chintana Thought Management System.",
    },
    servers: [
      {
        url: env.apiPrefix,
        description: "Relative API base path",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiSuccess: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: { type: "object", nullable: true },
            error: { type: "object", nullable: true },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed." },
            data: { nullable: true },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "BAD_REQUEST" },
                details: { type: "array", items: { type: "object" }, nullable: true },
              },
            },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          summary: "Service health",
          responses: {
            200: {
              description: "Healthy service response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiSuccess" },
                },
              },
            },
          },
        },
      },
      "/auth/register": {
        post: {
          summary: "Create account and send OTP",
          responses: {
            201: {
              description: "Account created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiSuccess" },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/auth/login": {
        post: {
          summary: "Login with email and password",
          responses: {
            200: {
              description: "Login success",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiSuccess" },
                },
              },
            },
            401: {
              description: "Invalid credentials",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiError" },
                },
              },
            },
          },
        },
      },
      "/thoughts": {
        get: {
          summary: "List user thoughts",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Thought list",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiSuccess" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
});
