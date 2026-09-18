export type Sheet = {
  img: HTMLImageElement;
  cols: number;
  rows: number;
};

export function loadImage(src: string, timeout = 3500): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;
    const finish = (value: HTMLImageElement | null) => {
      if (done) return;
      done = true;
      resolve(value);
    };
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = src;
    setTimeout(() => finish(null), timeout);
  });
}

export type GameAssets = {
  idle: Sheet | null;
  run: Sheet | null;
  jump: Sheet | null;
  key: Sheet | null;
  coin: HTMLImageElement | null;
  peso: HTMLImageElement | null;
  upgrade: HTMLImageElement | null;
  star: HTMLImageElement | null;
  bolt: HTMLImageElement | null;
  ghost: HTMLImageElement | null;
  leaf: HTMLImageElement | null;
  quota: HTMLImageElement | null;
  pasalo: HTMLImageElement | null;
  nationwide: HTMLImageElement | null;
  replevin: HTMLImageElement | null;
  musicbox: HTMLImageElement | null;
  elite: HTMLImageElement | null;
  john: HTMLImageElement | null;
  fidelity: HTMLImageElement | null;
  cone: HTMLImageElement | null;
  spikes: HTMLImageElement | null;
  checkpoint: HTMLImageElement | null;
  goal: HTMLImageElement | null;
  lift: HTMLImageElement | null;
  sedan: HTMLImageElement | null;
  suv: HTMLImageElement | null;
  jeepney: HTMLImageElement | null;
  showroom: HTMLImageElement | null;
  edsa: HTMLImageElement | null;
  ortigas: HTMLImageElement | null;
  bgc: HTMLImageElement | null;
  nlex: HTMLImageElement | null;
  timog: HTMLImageElement | null;
  cubao: HTMLImageElement | null;
  makati: HTMLImageElement | null;
  clark: HTMLImageElement | null;
  cebu: HTMLImageElement | null;
  davao: HTMLImageElement | null;
  alabang: HTMLImageElement | null;
};

export function emptyAssets(): GameAssets {
  return {
    idle: null,
    run: null,
    jump: null,
    key: null,
    coin: null,
    peso: null,
    upgrade: null,
    star: null,
    bolt: null,
    ghost: null,
    leaf: null,
    quota: null,
    pasalo: null,
    nationwide: null,
    replevin: null,
    musicbox: null,
    elite: null,
    john: null,
    fidelity: null,
    cone: null,
    spikes: null,
    checkpoint: null,
    goal: null,
    lift: null,
    sedan: null,
    suv: null,
    jeepney: null,
    showroom: null,
    edsa: null,
    ortigas: null,
    bgc: null,
    nlex: null,
    timog: null,
    cubao: null,
    makati: null,
    clark: null,
    cebu: null,
    davao: null,
    alabang: null,
  };
}

const LITE: { key: keyof GameAssets; src: string; sheet?: { cols: number; rows: number } }[] = [
  { key: "key", src: "/sprites/key.png", sheet: { cols: 2, rows: 2 } },
  { key: "peso", src: "/sprites/peso.png" },
  { key: "upgrade", src: "/sprites/upgrade.png" },
  { key: "star", src: "/sprites/star.png" },
  { key: "bolt", src: "/sprites/bolt.png" },
  { key: "ghost", src: "/sprites/ghost.png" },
  { key: "leaf", src: "/sprites/leaf.png" },
  { key: "quota", src: "/sprites/quota.png" },
  { key: "pasalo", src: "/sprites/pasalo.png" },
  { key: "nationwide", src: "/sprites/nationwide.png" },
  { key: "replevin", src: "/sprites/replevin.png" },
  { key: "musicbox", src: "/sprites/musicbox.png" },
  { key: "elite", src: "/sprites/elite.png" },
  { key: "john", src: "/sprites/powers/john.jpg" },
  { key: "fidelity", src: "/sprites/powers/fidelity.jpg" },
  { key: "cone", src: "/sprites/cone.png" },
  { key: "jeepney", src: "/sprites/jeepney.png" },
];

const MID: { key: keyof GameAssets; src: string }[] = [
  { key: "spikes", src: "/sprites/spikes.png" },
  { key: "checkpoint", src: "/sprites/checkpoint.png" },
  { key: "goal", src: "/sprites/goal.png" },
  { key: "lift", src: "/sprites/lift.png" },
  { key: "sedan", src: "/sprites/sedan.png" },
  { key: "suv", src: "/sprites/suv.png" },
];

const MAPS: { key: keyof GameAssets; src: string }[] = [
  { key: "showroom", src: "/maps/showroom.jpg" },
  { key: "edsa", src: "/maps/edsa.jpg" },
  { key: "ortigas", src: "/maps/ortigas.jpg" },
  { key: "bgc", src: "/maps/bgc.jpg" },
  { key: "nlex", src: "/maps/nlex.jpg" },
  { key: "timog", src: "/maps/timog.jpg" },
  { key: "cubao", src: "/maps/cubao.jpg" },
  { key: "makati", src: "/maps/makati.jpg" },
  { key: "clark", src: "/maps/clark.jpg" },
  { key: "cebu", src: "/maps/cebu.jpg" },
  { key: "davao", src: "/maps/davao.jpg" },
  { key: "alabang", src: "/maps/alabang.jpg" },
];

const IMG_KEYS: (keyof GameAssets)[] = [
  "coin",
  "peso",
  "upgrade",
  "star",
  "bolt",
  "ghost",
  "leaf",
  "quota",
  "pasalo",
  "nationwide",
  "replevin",
  "musicbox",
  "elite",
  "john",
  "fidelity",
  "cone",
  "spikes",
  "checkpoint",
  "goal",
  "lift",
  "sedan",
  "suv",
  "jeepney",
  "showroom",
  "edsa",
  "ortigas",
  "bgc",
  "nlex",
  "timog",
  "cubao",
  "makati",
  "clark",
  "cebu",
  "davao",
  "alabang",
];

function put(
  assets: GameAssets,
  key: keyof GameAssets,
  img: HTMLImageElement | null,
  sheet?: { cols: number; rows: number },
) {
  if (!img) return;
  if (sheet) {
    const s: Sheet = { img, cols: sheet.cols, rows: sheet.rows };
    if (key === "key") assets.key = s;
    else if (key === "idle") assets.idle = s;
    else if (key === "run") assets.run = s;
    else if (key === "jump") assets.jump = s;
    return;
  }
  if (IMG_KEYS.includes(key)) {
    (assets as Record<string, HTMLImageElement | null>)[key] = img;
  }
}

export async function loadAssets(onProgress?: (p: number) => void): Promise<GameAssets> {
  const assets = emptyAssets();
  const total = LITE.length + MID.length + 1;
  let done = 0;
  const tick = (n = 1) => {
    done += n;
    onProgress?.(Math.min(0.94, done / total));
  };

  await Promise.all(
    LITE.map(async (item) => {
      const img = await loadImage(item.src, 1400);
      put(assets, item.key, img, item.sheet);
      tick();
    }),
  );

  await Promise.all(
    MID.map(async (item) => {
      const img = await loadImage(item.src, 2200);
      put(assets, item.key, img);
      tick();
    }),
  );

  onProgress?.(0.96);
  void prefetchMaps(assets, ["showroom"]);
  onProgress?.(1);
  return assets;
}

export async function ensureBg(kind: string, assets: GameAssets): Promise<void> {
  const hit = MAPS.find((m) => m.key === kind);
  if (!hit) return;
  if (assets[hit.key]) return;
  const img = await loadImage(hit.src, 2800);
  put(assets, hit.key, img);
}

export function prefetchMaps(assets: GameAssets, kinds: string[]) {
  for (const k of kinds) void ensureBg(k, assets);
}

export function drawSheet(
  ctx: CanvasRenderingContext2D,
  sheet: Sheet,
  frame: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  flip = false,
) {
  const fw = sheet.img.width / sheet.cols;
  const fh = sheet.img.height / sheet.rows;
  const max = sheet.cols * sheet.rows;
  const f = ((frame % max) + max) % max;
  const col = f % sheet.cols;
  const row = Math.floor(f / sheet.cols);
  ctx.save();
  if (flip) {
    ctx.translate(dx + dw, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(sheet.img, col * fw, row * fh, fw, fh, 0, 0, dw, dh);
  } else {
    ctx.drawImage(sheet.img, col * fw, row * fh, fw, fh, dx, dy, dw, dh);
  }
  ctx.restore();
}

export function drawImg(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  flip = false,
) {
  if (!img) return false;
  ctx.save();
  if (flip) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
  } else {
    ctx.drawImage(img, x, y, w, h);
  }
  ctx.restore();
  return true;
}

export function bgFor(kind: string, assets: GameAssets) {
  switch (kind) {
    case "edsa":
      return assets.edsa;
    case "ortigas":
      return assets.ortigas;
    case "bgc":
      return assets.bgc;
    case "nlex":
      return assets.nlex;
    case "timog":
      return assets.timog;
    case "cubao":
      return assets.cubao;
    case "makati":
      return assets.makati;
    case "clark":
      return assets.clark;
    case "cebu":
      return assets.cebu;
    case "davao":
      return assets.davao;
    case "alabang":
      return assets.alabang;
    default:
      return assets.showroom;
  }
}
