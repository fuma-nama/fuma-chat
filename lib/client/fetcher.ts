import useSWR, { type Key as SWRKey, type SWRConfiguration } from "swr";
import type { API, GET } from "../server/types";
import useSWRMutation, {
  MutationFetcher,
  SWRMutationConfiguration,
} from "swr/mutation";

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

export function useMutation<
  DataKey extends keyof API,
  Key extends SWRKey,
  Data,
  ExtraArg = never
>(
  key: Key,
  _dataKey: DataKey,
  fetcher: MutationFetcher<Data, Key, ExtraArg>,
  config: SWRMutationConfiguration<
    Data,
    Error,
    Key,
    ExtraArg,
    API[DataKey]["data"]
  >
) {
  return useSWRMutation(key, fetcher, config);
}

export async function fetcher<T>(
  path: string,
  { params, ...init }: FetcherOptions = {}
): Promise<T> {
  const res = await fetch(`${path}?${new URLSearchParams(params)}`, init);

  if (res.ok) {
    return await res.json();
  }

  const { message } = await res.json();
  throw new Error(message as string);
}

export async function typedFetch<K extends keyof API>(
  key: K,
  init?: FetcherOptions<
    API[K] extends { params: infer P extends Record<string, string> }
      ? P
      : never
  > & {
    bodyJson?: API[K] extends { body: infer B } ? B : never;
  }
): Promise<API[K]["data"]> {
  const [api, method] = key.split(":");

  return fetcher(api, {
    method,
    body: init?.bodyJson ? JSON.stringify(init.bodyJson) : undefined,
    ...init,
  });
}
