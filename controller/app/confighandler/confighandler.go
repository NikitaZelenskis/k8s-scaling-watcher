package confighandler

import (
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"os"
	"regexp"
	"time"
)

const (
	configsLocation = "/vpn_configs"
)

//ConfigHandler handles which ip has which config file and stores settings
type ConfigHandler struct {
	avalibleConfigs []string
	ips             map[string]string
	VpnPriorities   []string
}

//NewConfigHandler creates new instance of ConfigHandler
func NewConfigHandler(VpnPriorities []string) ConfigHandler {
	configHandler := ConfigHandler{}
	configHandler.ips = make(map[string]string, 0)
	configHandler.VpnPriorities = VpnPriorities
	configHandler.readConfigFile()
	return configHandler
}

func (c *ConfigHandler) isOvpnFile(f os.FileInfo) bool {
	return !f.IsDir() && f.Name()[len(f.Name())-5:] == ".ovpn"
}

//reads all files in configsLocation and adds them to c.avalibleConfigs
func (c *ConfigHandler) readConfigFile() {
	configs, err := ioutil.ReadDir(configsLocation)
	if err != nil {
		log.Fatal(err)
	}

	for _, f := range configs {
		if c.isOvpnFile(f) {
			c.avalibleConfigs = append(c.avalibleConfigs, f.Name())
		}
	}
}

//GetAvalibleConfig returns index of highest priority config file.
//if none found returns random index
func (c *ConfigHandler) GetAvalibleConfig(clientIP string) string {
	nextConfigIndex := c.getHighestPriorityConfigIndex()
	if nextConfigIndex == -1 {
		return "none"
	}
	nextConfig := c.avalibleConfigs[nextConfigIndex]

	//remove from c.avalibleConfigs
	c.avalibleConfigs = append(c.avalibleConfigs[:nextConfigIndex], c.avalibleConfigs[nextConfigIndex+1:]...)

	c.ips[clientIP] = nextConfig

	return nextConfig
}

func (c *ConfigHandler) getHighestPriorityConfigIndex() int {
	for i := 0; i < len(c.VpnPriorities); i++ {
		for j := 0; j < len(c.avalibleConfigs); j++ {
			matched, err := regexp.MatchString(c.VpnPriorities[i], c.avalibleConfigs[j])
			if err != nil {
				fmt.Println(err)
			}
			if matched {
				return j
			}
		}
	}

	//if no matches just return random available
	if len(c.avalibleConfigs) > 0 {
		rand.Seed(time.Now().Unix())
		return rand.Int() % (len(c.avalibleConfigs) - 1)
	}
	return -1
}

//ResetConfig resets config of client
func (c *ConfigHandler) ResetConfig(clientIP string) {
	configUsed, ok := c.ips[clientIP]
	if !ok {
		return
	}
	delete(c.ips, clientIP)

	c.avalibleConfigs = append(c.avalibleConfigs, configUsed)
}
