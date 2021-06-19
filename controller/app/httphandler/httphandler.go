package httphandler

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	configHandler "../confighandler"
	customWorker "../customworker"
	"github.com/gorilla/websocket"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second
	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second
	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10
)

//HTTPHandler to handle all http requests
type HTTPHandler struct {
	configHandler        configHandler.ConfigHandler
	timeForNextContainer int64
	upgrader             websocket.Upgrader
	clientIps            map[net.Addr]*websocket.Conn
	kubernetesAPI        KubernetesAPI
	settings             Settings
	vpnSettings          VPNSettings
	customWorkers        map[string]customWorker.CustomWorker
}

//NewHTTPHandler creates new instance of HTTPHandler
func NewHTTPHandler() HTTPHandler {
	httphandler := HTTPHandler{}
	httphandler.timeForNextContainer = time.Now().Unix()
	httphandler.settings = NewSettings()
	httphandler.vpnSettings = NewVPNSettings()
	httphandler.configHandler = configHandler.NewConfigHandler(httphandler.settings.VpnPriorities)
	httphandler.upgrader = websocket.Upgrader{}
	httphandler.clientIps = make(map[net.Addr]*websocket.Conn)
	httphandler.kubernetesAPI = NewKubernetesAPI()
	httphandler.customWorkers = customWorker.GetCustomWorkers()
	return httphandler
}

//GetConfigHandlerFunc gives random config file name
func (h *HTTPHandler) GetConfigHandlerFunc(w http.ResponseWriter, r *http.Request) {
	configName := h.configHandler.GetAvalibleConfig(r.RemoteAddr)
	fmt.Fprintf(w, configName)
}

//ResetHandlerFunc handles request for resetting ip
func (h *HTTPHandler) ResetHandlerFunc(w http.ResponseWriter, r *http.Request) {
	h.configHandler.ResetConfig(r.RemoteAddr)
}

func (h *HTTPHandler) reader(conn *websocket.Conn) {
	defer h.closeConnection(conn)
	//set deadline to 60 secs from now
	conn.SetReadDeadline(time.Now().Add(pongWait))
	// if deadline is not met then close connection.
	conn.SetPongHandler(func(string) error { conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		messageType, message, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}
		//give resoponse based on the message
		var response string
		if string(message) == "getSettings" {
			response = h.getSettingsResoponse()
		} else if string(message) == "getConfig" {
			response = h.getConfigResponse(conn)
		} else if strings.HasPrefix(string(message), "CustomWorker") {
			response = h.customWorkerMessage(string(message))
		}

		conn.SetWriteDeadline(time.Now().Add(writeWait))
		if err := conn.WriteMessage(messageType, []byte(response)); err != nil {
			log.Println(err)
			return
		}
	}
}

func (h *HTTPHandler) customWorkerMessage(message string) string {
	split1 := strings.Split(message, ":")[1]
	split2 := strings.Split(split1, ",")
	customWorkerName := split2[0]
	customWorkerMessage := split2[1]

	var tmp struct {
		CustomWorker string `json:"customWorker"`
		Message      string `json:"message"`
	}
	tmp.CustomWorker = customWorkerName
	tmp.Message = h.customWorkers[customWorkerName].OnMessage(customWorkerMessage)
	byteArray, err := json.Marshal(&tmp)
	if err != nil {
		log.Println(err)
		return "{\"error\" : \"can't parse vpn settings\"}"
	}

	return string(byteArray)
}

//close connection and delete it from map
func (h *HTTPHandler) closeConnection(conn *websocket.Conn) {
	h.configHandler.ResetConfig(conn.RemoteAddr().String())
	delete(h.clientIps, conn.RemoteAddr())
	conn.Close()
	log.Println("Connection with " + conn.RemoteAddr().String() + " is closed")
}

func (h *HTTPHandler) getConfigResponse(conn *websocket.Conn) string {
	var tmp struct {
		ConfigFile   string `json:"configFile"`
		PasswordFile string `json:"passFile"`
	}
	tmp.ConfigFile = h.configHandler.GetAvalibleConfig(conn.RemoteAddr().String())
	tmp.PasswordFile = h.findConfigPassFile(tmp.ConfigFile)

	byteArray, err := json.Marshal(&tmp)
	if err != nil {
		log.Println(err)
		return "{\"error\" : \"can't parse vpn settings\"}"
	}

	return string(byteArray)
}

func (h *HTTPHandler) findConfigPassFile(config string) string {
	for i := 0; i < len(h.vpnSettings.VpnConfigs); i++ {
		matched, err := regexp.MatchString(h.vpnSettings.VpnConfigs[i].VPNSelector, config)
		if err != nil {
			fmt.Println(err)
		}
		if matched {
			return h.vpnSettings.VpnConfigs[i].PasswordFile
		}
	}

	return ""
}

func (h *HTTPHandler) getSettingsResoponse() string {
	var tmp struct {
		WaitFor          int64    `json:"waitFor"`
		MaxPingTime      int      `json:"maxPingTime"`
		PageReloadTime   int      `json:"pageReloadTime"`
		LinkToGo         string   `json:"linkToGo"`
		MaxDownloadSpeed int      `json:"maxDownloadSpeed"`
		MaxUploadSpeed   int      `json:"maxUploadSpeed"`
		IpLookupLink     string   `json:"ipLookupLink"`
		CustomWorkers    []string `json:"customWorkers"`
	}
	tmp.WaitFor = h.waitFor()
	tmp.MaxPingTime = h.settings.MaxPingTime
	tmp.PageReloadTime = h.settings.PageReloadTime
	tmp.LinkToGo = h.settings.LinkToGo
	tmp.MaxDownloadSpeed = h.settings.MaxDownloadSpeed
	tmp.MaxUploadSpeed = h.settings.MaxUploadSpeed
	tmp.IpLookupLink = h.settings.IpLookupLink

	//tell me about it
	keys := make([]string, len(h.customWorkers))
	i := 0
	for k := range h.customWorkers {
		keys[i] = k
		i++
	}
	tmp.CustomWorkers = keys

	byteArray, err := json.Marshal(&tmp)
	if err != nil {
		log.Println(err)
		return "{error : \"can't parse settings\"}"
	}
	return string(byteArray)
}

//waitFor stores and calculates how long to wait
func (h *HTTPHandler) waitFor() int64 {
	var timeBetweenContainers int64 = h.settings.TimeBetweenContainers
	var newLatestTime int64

	now := time.Now().Unix()

	if h.timeForNextContainer < now {
		newLatestTime = now + timeBetweenContainers
	} else {
		newLatestTime = h.timeForNextContainer + timeBetweenContainers
	}
	h.timeForNextContainer = newLatestTime

	waitFor := newLatestTime - now
	return waitFor
}

func (h *HTTPHandler) write(conn *websocket.Conn) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		conn.Close()
		log.Println("Connection with " + conn.RemoteAddr().String() + " is closed")
	}()

	for range ticker.C {
		conn.SetWriteDeadline(time.Now().Add(writeWait))
		if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
			return
		}
	}
}

//WsHandler allows websocket to connect to controller to listen to update
func (h *HTTPHandler) WsHandler(w http.ResponseWriter, r *http.Request) {
	ws, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}

	h.clientIps[ws.RemoteAddr()] = ws
	log.Println("Client", ws.RemoteAddr().String(), " connected successfully")

	go h.write(ws)
	go h.reader(ws)
}

func (h *HTTPHandler) ReplicaHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		fmt.Fprintf(w, "invalid_http_method")
		return
	}

	r.ParseForm()
	i, err := strconv.Atoi(r.Form.Get("amount"))
	if err != nil {
		fmt.Fprintf(w, "Wrong input")
		return
	}
	h.kubernetesAPI.UpdateReplicaAmount(i)
	log.Println("Replica amount updated to ", i)
	fmt.Fprintf(w, "Updated sucessfully")
}
