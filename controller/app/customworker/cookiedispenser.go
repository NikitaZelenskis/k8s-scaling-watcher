package customworker

import (
	"io/ioutil"
	"log"
	"math/rand"
	"time"
)

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

func (c *CookieDispatcher) OnMessage(message string, ip string) string {
	if len(c.cookies) > 0 {
		rand.Seed(time.Now().Unix())
		randIndex := rand.Intn(len(c.cookies))
		cookie := c.cookies[randIndex]
		//remove from c.cookies
		c.cookies = append(c.cookies[:randIndex], c.cookies[randIndex+1:]...)
		return cookie
	}
	return ""
}

func (c *CookieDispatcher) OnConnectionClose(ip string) {
	return
}
