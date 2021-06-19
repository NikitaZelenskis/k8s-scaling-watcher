export class CustomWorker {
    static customWorkersFoler = '/custom-workers/';
    name;
    browser;
    page;
    client;
    socket;
    setBrowser(browser) {
        this.browser = browser;
    }
    setPage(page) {
        this.page = page;
    }
    setClient(client) {
        this.client = client;
    }
    setSocket(socket) {
        this.socket = socket;
    }
    setName(name) {
        this.name = name;
    }
    sendMessage(message) {
        this.socket.send('CustomWorker:' + this.name + ',' + message);
    }
}
//# sourceMappingURL=custom-worker.js.map