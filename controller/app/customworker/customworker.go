package customworker

import (
	"io/ioutil"
	"log"
	"math/rand"
	"time"
)

const (
	customWorkersFolder = "/custom-workers"
)

type CustomWorker interface {
	init()
	onMessage(message string) string
}

func GetCustomWorkers() map[string]CustomWorker {
	var customWorkers map[string]CustomWorker = make(map[string]CustomWorker)
	customWorkers["cookie-dispanser"] = &CookieDispatcher{}

	initCustomWorkers(customWorkers)
	return customWorkers
}

func initCustomWorkers(customWorkers map[string]CustomWorker) {
	for _, c := range customWorkers {
		c.init()
	}
}

const (
	cookiesLocation = customWorkersFolder + "/cookie-dispensary"
)

type CookieDispatcher struct {
	CustomWorker
	cookies []string
}

func (c *CookieDispatcher) init() {
	cookies, err := ioutil.ReadDir(cookiesLocation)
	if err != nil {
		log.Fatal(err)
	}

	for _, f := range cookies {
		c.cookies = append(c.cookies, f.Name())
	}
}

func (c *CookieDispatcher) onMessage(message string) string {
	if len(c.cookies) > 0 {
		rand.Seed(time.Now().Unix())
		return c.cookies[rand.Int()%(len(c.cookies)-1)]
	}
	return ""
}
