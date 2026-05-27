import { Elysia } from "elysia";

export const authGuard = new Elysia()
  .derive({ as: "global" }, async ({ jwt, headers, set }) => {
    const auth = headers["authorization"];
    if (!auth?.startsWith("Bearer ")) {
      return { userId: undefined as string | undefined, userRole: undefined as string | undefined };
    }
    try {
      const payload = await jwt.verify(auth.slice(7));
      if (!payload || typeof payload.id !== "string") {
        return { userId: undefined, userRole: undefined };
      }
      return { userId: payload.id as string, userRole: payload.role as string | undefined };
    } catch {
      return { userId: undefined, userRole: undefined };
    }
  });
