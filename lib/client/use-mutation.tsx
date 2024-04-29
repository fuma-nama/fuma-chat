import {useCallback, useRef, useState} from "react";
import type {GET} from "../server/types";
import {mutate as swrMutate, useIsomorphicLayoutEffect} from "swr/_internal";
import {parseError, type FetcherError} from "./fetcher";

export interface Config<K extends keyof GET, Data, ErrorType> {
    /**
     * The key to mutate (SWR)
     */
    mutateKey: [K, GET[K]["input"] | undefined];

    /**
     * Customise the process of mutation
     */
    mutate?: (
        key: [K, GET[K]["input"] | undefined],
        data: Data
    ) => void | Promise<void>;

    /**
     * Populate the cache
     */
    cache?: (
        data: Data,
        currentData: GET[K]["data"] | undefined
    ) => GET[K]["data"];

    /**
     * @default true
     */
    revalidate?: boolean;

    onSuccess?: (data: Data, key: [K, GET[K]["input"] | undefined]) => void;
    onError?: (error: ErrorType, key: [K, GET[K]["input"] | undefined]) => void;
}

export interface UseMutation<Params, ErrorType> {
    trigger: Params extends undefined
        ? (params?: Params) => void
        : (params: Params) => void;
    isMutating: boolean;
    error?: ErrorType;
}

export function useMutation<
    K extends keyof GET,
    Params = undefined,
    Data = unknown,
    ErrorType = FetcherError<Params>
>(
    action: (params: Params) => Promise<Data>,
    config: Config<K, Data, ErrorType>
): UseMutation<Params, ErrorType> {
    const actionRef = useRef(action);
    const configRef = useRef(config);
    const pending = useRef(false);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState<ErrorType>();

    const trigger = useCallback((params: Params) => {
        // ignore until the last one is finished
        if (pending.current) return;

        pending.current = true;
        setIsMutating(pending.current);
        setError(undefined);

        const {
            mutateKey,
            revalidate = true,
            cache,
            mutate,
            onError,
            onSuccess,
        } = configRef.current;

        actionRef
            .current(params)
            .then(async (result) => {
                if (mutate) {
                    await mutate(mutateKey, result);
                } else {
                    await swrMutate<GET[K]["data"], Data>(mutateKey, result, {
                        revalidate,
                        populateCache: cache,
                    });
                }

                onSuccess?.(result, mutateKey);
                setError(undefined);
            })
            .catch((err) => {
                const parsedError = parseError(err) as ErrorType;
                onError?.(parsedError, mutateKey);
                setError(parsedError);
            })
            .finally(() => {
                pending.current = false;
                setIsMutating(pending.current);
            });
    }, []);

    useIsomorphicLayoutEffect(() => {
        actionRef.current = action;
        configRef.current = config;
    }, [action, config]);

    return {
        isMutating,
        trigger: trigger as any,
        error,
    };
}