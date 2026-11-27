import { createAlbumImageKeys, deriveAlbumImageKey, exportAlbumPublicKey, importAlbumPublicKey } from "./album-image-crypto";

const MAX_BYTES = 96 * 1024 * 1024;
const PREFETCH_WORKERS = 2;

type PhotoRequest = { promise: Promise<Blob>; controller: AbortController };

export class PrivateAlbumPhotoCache {
  private photos = new Map<string, Blob>();
  private requests = new Map<string, PhotoRequest>();
  private bytes = 0;
  private queue: string[] = [];
  private background = new Set<string>();
  private generation = 0;
  private priority = 0;

  constructor(private readonly token?: string) {}

  load(id: string): Promise<Blob> {
    const photo = this.photos.get(id);
    if (photo) {
      this.photos.delete(id);
      this.photos.set(id, photo);
      return Promise.resolve(photo);
    }

    const pending = this.requests.get(id);
    if (pending) return pending.promise;

    const controller = new AbortController();
    const promise = this.download(id, controller.signal).then((image) => {
      controller.signal.throwIfAborted();
      for (const [key, value] of this.photos) {
        if (this.bytes + image.size <= MAX_BYTES) break;
        this.photos.delete(key);
        this.bytes -= value.size;
      }
      if (image.size <= MAX_BYTES) {
        this.photos.set(id, image);
        this.bytes += image.size;
      }
      return image;
    }).finally(() => {
      if (this.requests.get(id)?.controller === controller) this.requests.delete(id);
    });
    this.requests.set(id, { promise, controller });
    return promise;
  }

  async prefetchAfter(active: string, ids: string[]) {
    const generation = this.generation;
    const priority = ++this.priority;
    await this.load(active).catch(() => {});
    if (generation !== this.generation || priority !== this.priority) return;
    this.queue = ids;
    this.pump();
  }

  clear() {
    this.generation++;
    this.queue = [];
    for (const request of this.requests.values()) request.controller.abort();
    this.requests.clear();
    this.background.clear();
    this.photos.clear();
    this.bytes = 0;
  }

  private pump() {
    if (this.bytes >= MAX_BYTES * 0.9) return;
    while (this.background.size < PREFETCH_WORKERS && this.queue.length) {
      const id = this.queue.shift();
      if (!id) break;
      if (this.photos.has(id) || this.requests.has(id)) continue;
      const generation = this.generation;
      this.background.add(id);
      void this.load(id).catch(() => {}).finally(() => {
        if (this.generation !== generation) return;
        this.background.delete(id);
        this.pump();
      });
    }
  }

  private async download(id: string, signal: AbortSignal) {
    const keys = await createAlbumImageKeys();
    const response = await fetch(`/api/album-photo/${id}`, {
      method: "POST",
      headers: {
        "x-album-view": "1",
        "x-album-image-key": await exportAlbumPublicKey(keys.publicKey),
        ...(this.token ? { "x-album-token": this.token } : {}),
      },
      signal,
    });
    const publicKey = response.headers.get("x-album-image-key");
    if (!response.ok || !publicKey) throw new Error("Photo unavailable");
    const key = await deriveAlbumImageKey(await importAlbumPublicKey(publicKey), keys.privateKey, "decrypt");
    const payload = await response.arrayBuffer();
    const image = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(payload, 0, 12) }, key, new Uint8Array(payload, 12),
    );
    signal.throwIfAborted();
    return new Blob([image], { type: "image/webp" });
  }
}
