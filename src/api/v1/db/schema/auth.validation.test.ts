import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import {
  createUserSchema,
  recoveryLoginSchema,
} from "./auth.validation";

describe("createUserSchema", () => {
  it("should validate valid input", () => {
    const input = {
      body: {
        email: "TEST@EMAIL.COM",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      },
    };

    const result = createUserSchema.parse(input);

    expect(result.body.email).toBe("test@email.com"); // lowercased
    expect(result.body.password).toBe("password123");
    expect(result.body.firstName).toBe("John");
    expect(result.body.lastName).toBe("Doe");
  });

  it("should escape HTML in firstName and lastName", () => {
    const input = {
      body: {
        email: "test@test.com",
        password: "password123",
        firstName: "<script>alert(1)</script>",
        lastName: "<b>Doe</b>",
      },
    };

    const result = createUserSchema.parse(input);

    expect(result.body.firstName).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(result.body.lastName).toBe("&lt;b&gt;Doe&lt;/b&gt;");
  });

  it("should throw ZodError for invalid email", () => {
    const input = {
      body: {
        email: "invalid-email",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
      },
    };

    expect(() => createUserSchema.parse(input)).toThrow(ZodError);
  });

  it("should throw ZodError for short password", () => {
    const input = {
      body: {
        email: "test@test.com",
        password: "123",
        firstName: "John",
        lastName: "Doe",
      },
    };

    expect(() => createUserSchema.parse(input)).toThrow(ZodError);
  });

  it("should require firstName and lastName", () => {
    const input = {
      body: {
        email: "test@test.com",
        password: "password123",
        firstName: "",
        lastName: "",
      },
    };

    expect(() => createUserSchema.parse(input)).toThrow(ZodError);
  });
});

describe("recoveryLoginSchema", () => {
  it("should validate valid recovery login input", () => {
    const input = {
      body: {
        email: "USER@EMAIL.COM",
        recoveryCode: "ABCDEF",
      },
    };

    const result = recoveryLoginSchema.parse(input);

    expect(result.body.email).toBe("user@email.com");
    expect(result.body.recoveryCode).toBe("ABCDEF");
  });

  it("should throw ZodError for missing recoveryCode", () => {
    const input = {
      body: {
        email: "test@test.com",
      },
    };

    expect(() => recoveryLoginSchema.parse(input)).toThrow(ZodError);
  });

  it("should throw ZodError for invalid email", () => {
    const input = {
      body: {
        email: "invalid-email",
        recoveryCode: "ABCDEF",
      },
    };

    expect(() => recoveryLoginSchema.parse(input)).toThrow(ZodError);
  });
});
