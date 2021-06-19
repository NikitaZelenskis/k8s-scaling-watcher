package customworker

const (
	customWorkersFolder = "/custom-workers"
)

type CustomWorker interface {
	init()
	OnMessage(message string, ip string) string
	OnConnectionClose(ip string)
}

func GetCustomWorkers() map[string]CustomWorker {
	var customWorkers map[string]CustomWorker = make(map[string]CustomWorker)
	customWorkers["cookie-dispenser"] = &CookieDispatcher{}

	initCustomWorkers(customWorkers)
	return customWorkers
}

func initCustomWorkers(customWorkers map[string]CustomWorker) {
	for _, c := range customWorkers {
		c.init()
	}
}
