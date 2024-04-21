import { useCallback, useRef, useState } from "react";
import { GET } from "../server/types";
import { mutate as swrMutate, useIsomorphicLayoutEffect } from "swr/_internal";

export interface Config<K extends keyof GET, Data> {
  /**
   * The key to mutate (SWR)
   */
  mutateKey: [K, GET[K]["params"] | undefined];

  /**
   * Customise the process of mutation
   */
  mutate?: (
    key: [K, GET[K]["params"] | undefined],
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

  onSuccess?: (data: Data, key: [K, GET[K]["params"] | undefined]) => void;
  onError?: (error: Error, key: [K, GET[K]["params"] | undefined]) => void;
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
  ErrorType = Error
>(
  action: (params: Params) => Promise<Data>,
  config: Config<K, Data>
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
        onError?.(err, mutateKey);
        setError(err);
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
