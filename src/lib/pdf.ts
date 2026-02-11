import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function loadPdfFromUrl(url: string) {
    const task = pdfjsLib.getDocument(url);
    return await task.promise;
}

function makeCanvas(w: number, h: number) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.floor(w));
    c.height = Math.max(1, Math.floor(h));
    return c;
}

export type SplitRender = { top: HTMLCanvasElement; bottom: HTMLCanvasElement };

export async function renderSplit50(page: any, targetCssWidth: number): Promise<SplitRender> {
    const dpr = window.devicePixelRatio || 1;

    const base = page.getViewport({ scale: 1 });
    const scale = (targetCssWidth * dpr) / base.width;
    const viewport = page.getViewport({ scale });

    // full render
    const full = makeCanvas(viewport.width, viewport.height);
    const ctx = full.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    const half = Math.floor(full.height / 2);

    const top = makeCanvas(full.width, half);
    top.getContext('2d')!.drawImage(full, 0, 0, full.width, half, 0, 0, top.width, top.height);

    const bottom = makeCanvas(full.width, full.height - half);
    bottom.getContext('2d')!.drawImage(full, 0, half, full.width, full.height - half, 0, 0, bottom.width, bottom.height);

    return { top, bottom };
}

export async function renderTopOnly(page: any, targetCssWidth: number): Promise<HTMLCanvasElement> {
    const { top } = await renderSplit50(page, targetCssWidth);
    return top;
}
