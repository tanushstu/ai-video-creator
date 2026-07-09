// Adapter for the Zernio social-publishing API (https://docs.zernio.com).
// Contract verified against Zernio's OpenAPI spec:
//   Base URL: https://zernio.com/api/v1
//   Auth:     Authorization: Bearer <ZERNIO_API_KEY>
//   Accounts: GET  /accounts        -> { accounts: [{ _id, platform, isActive }] }
//   Publish:  POST /posts           -> content, mediaItems[], publishNow, platforms[]

const BASE = process.env.ZERNIO_API_BASE ?? 'https://zernio.com/api/v1';

// We only surface the two platforms this feature targets. Zernio supports 14+.
export type ZernioPlatform = 'youtube' | 'instagram';

export interface ZernioAccount {
  _id: string;
  platform: string;
  username?: string;
  displayName?: string;
  isActive?: boolean;
}

export class ZernioError extends Error {
  status: number;
  details: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ZernioError';
    this.status = status;
    this.details = details;
  }
}

async function zernioFetch<T = unknown>(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: string; message?: string })?.error ??
      (data as { message?: string })?.message ??
      res.statusText;
    throw new ZernioError(message, res.status, data);
  }
  return data as T;
}

/** List the user's connected social accounts. */
export async function listAccounts(apiKey: string): Promise<ZernioAccount[]> {
  const data = await zernioFetch<{ accounts?: ZernioAccount[] } | ZernioAccount[]>(
    apiKey,
    '/accounts?status=connected',
  );
  return Array.isArray(data) ? data : data.accounts ?? [];
}

export interface PublishVideoInput {
  videoUrl: string;
  platforms: ZernioPlatform[];
  /** Resolved Zernio account IDs, keyed by platform. */
  accounts: Partial<Record<ZernioPlatform, string>>;
  title?: string; // YouTube title (<= 100 chars)
  description?: string; // YouTube description
  caption?: string; // Instagram caption
}

/**
 * Publish a hosted video to the selected platforms in a single immediate post.
 * Returns Zernio's raw /posts response (contains per-platform status + URLs).
 */
export async function publishVideo(apiKey: string, input: PublishVideoInput) {
  const platforms = input.platforms.map((platform) => {
    if (platform === 'youtube') {
      return {
        platform: 'youtube',
        accountId: input.accounts.youtube,
        customContent: input.description || undefined,
        platformSpecificData: {
          title: input.title || undefined,
          visibility: 'public',
          containsSyntheticMedia: true, // AI-generated content disclosure
        },
      };
    }
    return {
      platform: 'instagram',
      accountId: input.accounts.instagram,
      customContent: input.caption || undefined,
    };
  });

  const body = {
    // Shared fallback caption; per-platform customContent overrides it above.
    content: input.caption || input.description || input.title || '',
    mediaItems: [{ type: 'video', url: input.videoUrl }],
    publishNow: true,
    platforms,
  };

  return zernioFetch(apiKey, '/posts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
