import { hash } from "bcryptjs";
import request from "supertest";
import { Connection } from "typeorm";
import { v4 as uuidV4 } from "uuid";
import { app } from "../../../../app";
import createConnection from "../../../../database";

let connection: Connection;

describe("Get balance", () => {
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
  })

  it("should be able to get user's account balance", async () => {
    const authentication = await request(app).post("/api/v1/sessions")
    .send({
      email: "test@email.com",
      password: "123",
    });

    const { token } = authentication.body;

    await request(app).post("/api/v1/statements/deposit")
    .send({
      amount: 100,
      description: "Depositing $100",
    })
    .set({
      Authorization: `Bearer ${token}`,
    });

    const response = await request(app)
    .get("/api/v1/statements/balance")
    .set({
      Authorization: `Bearer ${token}`,
    });

    expect(response.status).toBe(200);
    expect(response.body.statement.length).toBe(1);
    expect(response.body.balance).toBe(100);
  });
});
