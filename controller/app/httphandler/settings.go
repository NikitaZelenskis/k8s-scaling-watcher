package httphandler

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

const (
	settingsFile = "/go/app/settings.json"
)

//Settings store all settings from settings.json
type Settings struct {
	VpnPriorities         []string `json:"vpnPriorities"`
	TimeBetweenContainers int64    `json:"timeBetweenContainers"`
	MaxPingTime           int      `json:"maxPingTime"`
	PageReloadTime        int      `json:"pageReloadTime"`
	LinkToGo              string   `json:"linkToGo"`
}

func NewSettings() Settings {
	settings := Settings{}
	settings.loadSettingsFromFile()
	return settings
}

func (s *Settings) loadSettingsFromFile() {
	jsonFile, err := os.Open(settingsFile)
	if err != nil {
		fmt.Println(err)
	}
	defer jsonFile.Close()

	byteValue, err := ioutil.ReadAll(jsonFile)

	if err != nil {
		fmt.Println(err)
	}

	json.Unmarshal(byteValue, &s)
}
