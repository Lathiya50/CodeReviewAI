import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "../db";
import { auth } from "../auth";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });
  return {
    db,
    session,
    headers: opts.headers,
  };
};

function sanitizeErrorMessage(code: string, message: string): string {
  const normalized = message.trim();
  console.error(`Error [${code}]: ${normalized}`);
  const firstLine = normalized
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  // Prisma/driver wrappers may contain a lot of noise; extract the underlying message.
  const embeddedMessage = normalized.match(/message:\s*"([^"]+)"/i)?.[1];
  if (
    normalized.includes("Invalid `") ||
    normalized.includes("invocation") ||
    normalized.includes("ConnectorError") ||
    normalized.includes("Error occurred during query execution")
  ) {
    return embeddedMessage ?? firstLine ?? normalized;
  }

  // Keep original message, but collapse multiline traces to the first meaningful line.
  return firstLine ?? normalized;
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const sanitizedMessage = sanitizeErrorMessage(shape.data.code, shape.message);

    return {
      ...shape,
      message: sanitizedMessage,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});
