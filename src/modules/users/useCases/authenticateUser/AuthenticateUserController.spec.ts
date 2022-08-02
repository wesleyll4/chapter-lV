import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidV4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Authenticate user", () => {
  beforeAll(async () => {
    connection = await createConnection();
    await connection.runMigrations();

    const id = uuidV4();
    const password = await hash("123", 8);

    await connection.query(`
      INSERT INTO users
        (id, name, email, password, created_at, updated_at)
      VALUES
        ('${id}', 'Test', 'test@email.com', '${password}', 'now()', 'now()')
    `);
  });

  afterAll(async () => {
    await connection.dropDatabase();
    await connection.close();
  });

  it("should be able to authenticate a user", async () => {
    const response = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: "test@email.com",
      password: "123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  it("should not be able to authenticate a non-existent user", async () => {
    const response = await request(app)
    .post("/api/v1/sessions")
    .send({
      email: "wrong@email.com",
      password: "password",
    });

    expect(response.status).toBe(401);
  });

  it("should not be able to authenticate a user with incorrect password", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: "test@email.com",
      password: "wrongPassword",
    });

    expect(response.status).toBe(401);
  });
});
