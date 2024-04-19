import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";

type Result<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: z.ZodError;
      response: NextResponse;
    };

export async function validate<T extends z.AnyZodObject>(
  req: NextRequest,
  schema: T,
  type: "body" | "params" = "body"
): Promise<Result<z.infer<T>>> {
  const content =
    type === "body"
      ? await req.json()
      : Object.fromEntries(req.nextUrl.searchParams.entries());
  const result = schema.safeParse(content);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: result.error,
    response: NextResponse.json(
      { message: result.error.message },
      { status: 400 }
    ),
  };
}
