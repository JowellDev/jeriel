let ws: WebSocket | undefined

export const getWebSocket = () => {
	if (!ws) {
		ws = new WebSocket('.')
	}

	return ws
}
