/** 客户端头像解码缓存：路由重挂载时避免 WebKit 再解一帧空白 */

const bitmapCache = new Map<string, ImageBitmap>();
const inflight = new Map<string, Promise<ImageBitmap>>();

/** 与 MemberAvatar 默认成员图一致 */
export const DEFAULT_NAME_AVATAR: Record<string, string> = {
  布布: "/bubu.png",
  一二: "/12.png",
};

export function resolveAvatarSrc(
  name: string,
  avatarUrl: string | null | undefined,
): string | null {
  if (avatarUrl?.trim()) return avatarUrl.trim();
  return DEFAULT_NAME_AVATAR[name] ?? null;
}

export function getAvatarBitmap(src: string): ImageBitmap | undefined {
  return bitmapCache.get(src);
}

export function loadAvatarBitmap(src: string): Promise<ImageBitmap> {
  const hit = bitmapCache.get(src);
  if (hit) return Promise.resolve(hit);

  const pending = inflight.get(src);
  if (pending) return pending;

  const task = fetch(src, { cache: "force-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`avatar fetch ${res.status}`);
      return res.blob();
    })
    .then((blob) => createImageBitmap(blob))
    .then((bmp) => {
      bitmapCache.set(src, bmp);
      inflight.delete(src);
      return bmp;
    })
    .catch((err) => {
      inflight.delete(src);
      throw err;
    });

  inflight.set(src, task);
  return task;
}

/** 壳层挂载时预热默认头像，减少首次进页闪动 */
export function preloadDefaultAvatars() {
  if (typeof window === "undefined") return;
  for (const src of Object.values(DEFAULT_NAME_AVATAR)) {
    void loadAvatarBitmap(src);
  }
}
