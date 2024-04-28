import useSWR, {type SWRConfiguration} from "swr";
import type {API, GET} from "../server/types";
import type {z} from "zod";

export interface FetcherOptions extends RequestInit {
    params?: Record<string, string | number | undefined>;
}

export type FetcherError<Z = unknown> =
    | { type: "error"; message: string }
    | {
    type: "zod_error";
    message: string;
    fields: z.typeToFlattenedError<Z>["fieldErrors"];
};

export function useQuery<K extends keyof GET, ErrorType = Error>(
    key: [K, GET[K]["input"]],
    init?: RequestInit,
    config: SWRConfiguration<GET[K]["data"], ErrorType> = {}
) {
    return useSWR<GET[K]["data"], ErrorType, [K, GET[K]["input"]]>(
        key,
        (input) => fetcher(input[0], {params: input[1], ...init}),
        config
    );
}

export async function fetcher<T>(
    path: string,
    {params, ...init}: FetcherOptions = {}
): Promise<T> {
    const query = new URLSearchParams()

    if (params)
        Object.entries(params).forEach(([k, v]) => {
            if (v) query.set(k, typeof v === 'string' ? v : v.toString())
        })

    const res = await fetch(`${path}?${query}`, init);

    if (res.ok) {
        return await res.json();
    }

    throw await res.json();
}

export async function typedFetch<K extends keyof API>(
    key: K,
    input: API[K]["input"],
    init?: Omit<RequestInit, "method">
): Promise<API[K]["data"]> {
    const [api, method] = key.split(":");
    const options: FetcherOptions = {method, ...init};

    if (method === "get" || method === "delete") options.params = input;
    else if (input !== undefined) options.body = JSON.stringify(input);

    return fetcher(api, options);
}

export function parseError(e: unknown): FetcherError {
    if (!e) throw e;

    if (typeof e === "object" && "type" in e && typeof e.type === "string") {
        return e as FetcherError;
    }

    return {
        type: "error",
        message:
            typeof e === "object" && "message" in e
                ? (e.message as string)
                : "unknown",
    };
}
