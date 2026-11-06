/** Bound network work so a stalled mobile connection cannot hold the tile pool. */
function deadline(start, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) throw Error('Invalid map request timeout.');
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(Error('Checked map request timed out. Retry when your connection is ready.'));
      controller.abort();
    }, timeoutMs);
  });
  return Promise.race([Promise.resolve().then(() => start(controller.signal)), timeout])
    .finally(() => clearTimeout(timer));
}
export function fetchCheckedJSON(path, {fetch = globalThis.fetch, timeoutMs = 15000} = {}) {
  return deadline(async signal => {
    const response = await fetch(path, {signal});
    if (!response.ok) throw Error('Checked data unavailable. Reconnect and retry.');
    return response.json();
  }, timeoutMs);
}
export function loadCheckedRaster(path, {Image = globalThis.Image, timeoutMs = 15000} = {}) {
  return deadline(signal => new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = () => {
      image.onload = image.onerror = null;
      signal.removeEventListener('abort', abort);
    };
    const abort = () => {
      cleanup();image.src = '';reject(Error('Checked overview request cancelled.'));
    };
    image.onload = () => {cleanup();resolve(image)};
    image.onerror = () => {cleanup();reject(Error('Checked overview unavailable.'))};
    signal.addEventListener('abort', abort, {once:true});
    image.src = path;
  }), timeoutMs);
}
