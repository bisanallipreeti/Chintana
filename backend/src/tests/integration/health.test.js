import request from "supertest";
import { createApp } from "../../app.js";

describe("Health endpoints", () => {
  const app = createApp();

  it("GET /health returns service health", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("service");
    expect(response.body.data).toHaveProperty("database");
  });

  it("GET /api/v1/unknown returns not found", async () => {
    const response = await request(app).get("/api/v1/unknown");

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
