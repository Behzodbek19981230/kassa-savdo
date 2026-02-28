import { getNotesWsUrl } from './note.service';

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;

const dispatchMessage = (payload: unknown) => {
	try {
		window.dispatchEvent(new CustomEvent('notes:message', { detail: payload }));
	} catch {}
};

const dispatchStatus = (status: string, info?: unknown) => {
	try {
		window.dispatchEvent(new CustomEvent('notes:status', { detail: { status, info } }));
	} catch {}
};

const connect = () => {
	try {
		const url = getNotesWsUrl();
		socket = new WebSocket(url);
		socket.onopen = () => dispatchStatus('open', { url });
		socket.onmessage = (ev) => {
			try {
				const data = JSON.parse(ev.data);
				dispatchMessage(data);
			} catch (e) {
				// non-json payload
				dispatchMessage(ev.data);
			}
		};
		socket.onclose = (ev) => {
			dispatchStatus('closed', ev);
			if (reconnectTimer) window.clearTimeout(reconnectTimer);
			reconnectTimer = window.setTimeout(connect, 3000);
		};
		socket.onerror = (ev) => dispatchStatus('error', ev);
	} catch (e) {
		dispatchStatus('error', e);
		if (reconnectTimer) window.clearTimeout(reconnectTimer);
		reconnectTimer = window.setTimeout(connect, 5000);
	}
};

export const startNotesWs = () => {
	if (socket && socket.readyState === WebSocket.OPEN) return;
	connect();
};

export const stopNotesWs = () => {
	if (reconnectTimer) {
		window.clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
	if (socket) {
		try {
			socket.close();
		} catch {}
		socket = null;
	}
	dispatchStatus('stopped');
};

export const sendNotesWs = (data: unknown) => {
	if (socket && socket.readyState === WebSocket.OPEN) {
		try {
			socket.send(typeof data === 'string' ? data : JSON.stringify(data));
		} catch {}
	}
};

export default {
	start: startNotesWs,
	stop: stopNotesWs,
	send: sendNotesWs,
};
