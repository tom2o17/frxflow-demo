import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { Address } from "viem";

type Args = {
  chainId: number;
  address: Address;
  /** Prefer a stable string here: full event signature or topic0 hash */
  eventKey?: string;                 // e.g. "Transfer(address,address,uint256)"
  topic0?: `0x${string}`;            // if no signature string
  step?: bigint;                     // batching window
  indexedTopics?: (string | null | undefined)[];
};

function toKey(x: unknown): string {
  // ensure queryKey is JSON-serializable & stable
  if (typeof x === "bigint") return `b:${x.toString(10)}`;
  if (typeof x === "string" || typeof x === "number" || typeof x === "boolean" || x == null) return String(x);
  if (Array.isArray(x)) return `[${x.map(toKey).join(",")}]`;
  return JSON.stringify(x); // fallback for plain objects/arrays
}

export function useContractLogsLast43200({
  chainId,
  address,
  eventKey,              // <- use this instead of passing the parsed ABI item
  topic0,
  step = BigInt(10_000),
  indexedTopics,
}: Args) {
  const publicClient = usePublicClient({ chainId });

  const queryKey = useMemo(
  () => [
    "logs:last43200",
    String(chainId),
    (address ?? "").toLowerCase(),
    String(eventKey ?? topic0 ?? "unknown"),
    String((step ?? BigInt(10_000)).toString()),
    JSON.stringify(indexedTopics ?? []),
  ],
  [chainId, address, eventKey, topic0, step, indexedTopics]
);


  return useQuery({
    queryKey,
    enabled: Boolean(publicClient) && Boolean(eventKey || topic0),
    queryFn: async () => {
      if (!publicClient) return [];

      const latest = await publicClient.getBlockNumber();   // bigint
      const window = BigInt(86_400);
      const start = latest > window ? (latest - window) : BigInt(0);
      const batch = step ?? BigInt(10_000);

      const out: any[] = [];
      for (let f = start; f <= latest; f += batch) {
        const t = (f + batch - BigInt(1)) > latest ? latest : (f + batch - BigInt(1));
        const logs = await publicClient.getLogs({
          address,
          ...(topic0
            ? { topics: [topic0 as `0x${string}`, ...(indexedTopics ?? [])] }
            : { // if you passed an event signature string, let’s build topics[0]
                // Fallback: just search on topic0 computed elsewhere if you have it.
              }),
          fromBlock: f,
          toBlock: t,
        });
        out.push(...logs);
      }
      return out;
    },
  });
}
