export type DeckMsg =
    | { type: 'state'; pageIndex: number; totalPages: number }
    | { type: 'hello' };

export function createDeckChannel() {
    const ch = new BroadcastChannel('deck-sync');
    return {
        post(msg: DeckMsg) { ch.postMessage(msg); },
        on(fn: (msg: DeckMsg) => void) {
            ch.onmessage = (e) => fn(e.data as DeckMsg);
            return () => { ch.onmessage = null; };
        },
        close() { ch.close(); }
    };
}
