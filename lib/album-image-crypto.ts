const curve = { name: "ECDH", namedCurve: "P-256" };

export async function createAlbumImageKeys() {
  return crypto.subtle.generateKey(curve, false, ["deriveKey"]);
}

export async function exportAlbumPublicKey(key: CryptoKey) {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  return btoa(String.fromCharCode(...raw));
}

export async function importAlbumPublicKey(encoded: string) {
  if (encoded.length !== 88) throw new Error("Invalid album public key");
  const raw = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, curve, false, []);
}

export function deriveAlbumImageKey(publicKey: CryptoKey, privateKey: CryptoKey, usage: "encrypt" | "decrypt") {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  );
}
