import { User, auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import type { API } from "./types";
import type { z } from "zod";

const NO_BODY_METHODS = ["GET", "HEAD", "DELETE"];

/**
 * Validate request parameters and body
 * @param req The request
 * @param schema Zod schema
 * @param type Where to validate, determined by the request method by default.
 */
export async function validate<T extends z.AnyZodObject>(
  req: NextRequest,
  schema: T,
  type?: "body" | "params"
): Promise<z.infer<T>> {
  const content =
    type === "params" || NO_BODY_METHODS.includes(req.method)
      ? Object.fromEntries(req.nextUrl.searchParams.entries())
      : await req.json();
  const result = schema.safeParse(content);

  if (result.success) {
    return result.data;
  }

  throw NextResponse.json(
    {
      type: "zod_error",
      message: result.error.issues[0].message,
      error: result.error.formErrors,
    },
    { status: 400 }
  );
}

export type HandlerFn<T> = (
  req: NextRequest,
  ctx: { params: unknown }
) =>
  | NextResponse<T | { message: string }>
  | Promise<NextResponse<T | { message: string }>>;

export function handler<K extends keyof API>(
  fn: HandlerFn<API[K]["data"]>
): HandlerFn<unknown> {
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
