import { currentUser } from "@clerk/nextjs";
import { User, auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";

export async function validate<T extends z.AnyZodObject>(
  req: NextRequest,
  schema: T,
  type: "body" | "params" = "body"
): Promise<z.infer<T>> {
  const content =
    type === "body"
      ? await req.json()
      : Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(content);

  if (result.success) {
    return result.data;
  }

  throw NextResponse.json(
    { message: result.error.message, error: result.error },
    { status: 400 }
  );
}

export type HandlerFn<T> = (
  req: NextRequest,
  ctx: { params: unknown }
) =>
  | NextResponse<T | { message: string }>
  | Promise<NextResponse<T | { message: string }>>;

export function handler<T>(fn: HandlerFn<T>): HandlerFn<unknown> {
  return async (req: NextRequest, ctx: { params: unknown }) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof NextResponse) {
        return e;
      }

      throw e;
    }
  };
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (user) return user;

  throw NextResponse.json(
    { message: "You must be logged in to perform this action" },
    { status: 401 }
  );
}

export function requireAuth(): { userId: string } {
  const user = auth();
  if (user.userId) return { userId: user.userId };

  throw NextResponse.json(
    { message: "You must be logged in to perform this action" },
    { status: 401 }
  );
}
