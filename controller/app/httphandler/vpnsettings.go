package httphandler

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

const (
	vpnSettingsFile = "/go/app/vpn-settings.json"
)

type VPNConfig struct {
	VPNSelector  string `json:"vpnSelector"`
	PasswordFile string `json:"passFile"`
}

//Settings store all settings from vpn-settings.json
type VPNSettings struct {
	VpnConfigs []VPNConfig `json:"settings"`
}

func NewVPNSettings() VPNSettings {
	vpnSettings := VPNSettings{}
	vpnSettings.loadVPNSettingsFromFile()
	return vpnSettings
}

func (s *VPNSettings) loadVPNSettingsFromFile() {
	jsonFile, err := os.Open(vpnSettingsFile)
	if err != nil {
		fmt.Println(err)
	}
	defer jsonFile.Close()

	byteValue, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		fmt.Println(err)
	}

	err = json.Unmarshal(byteValue, &s)
	if err != nil {
		fmt.Println(err)
	}
}
