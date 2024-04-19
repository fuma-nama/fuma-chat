import useSWR, { SWRConfiguration } from "swr";
import type { GET, POST } from "../server/types";

interface FetcherOptions<
  Params extends Record<string, string> = Record<string, string>
> extends RequestInit {
  params?: Params;
}

export function useQuery<K extends keyof GET>(
  key: K,
  init?: FetcherOptions<GET[K]["params"]>,
  config: SWRConfiguration<GET[K]["data"], Error> = {}
) {
  return useSWR<GET[K]["data"], Error, [K, GET[K]["params"]]>(
    [key, init?.params as GET[K]["params"]],
    (input) => fetcher(input[0], init),
    config
  );
}

export async function fetcher<T>(
  path: string,
  { params, ...init }: FetcherOptions = {}
): Promise<T> {
  const res = await fetch(`${path}?${new URLSearchParams(params)}`, init);

  if (res.ok) {
    const data: T = await res.json();
    return data;
  }

  const { message } = await res.json();
  throw new Error(message as string);
}

export async function typedFetcher<K extends keyof GET>(
  key: K,
  init?: FetcherOptions<GET[K]["params"]>
): Promise<GET[K]["data"]> {
  return fetcher(key, init);
}

export async function typedPoster<K extends keyof POST>(
  key: K,
  init?: FetcherOptions<never> & { bodyJson?: POST[K]["body"] }
): Promise<POST[K]["data"]> {
  return fetcher(key, {
    method: "POST",
    body: init?.bodyJson ? JSON.stringify(init.bodyJson) : undefined,
    ...init,
  });
}
