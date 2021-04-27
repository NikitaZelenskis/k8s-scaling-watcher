package httphandler

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"time"

	configHandler "../confighandler"
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
}

//NewHTTPHandler creates new instance of HTTPHandler
func NewHTTPHandler() HTTPHandler {
	httphandler := HTTPHandler{}
	httphandler.timeForNextContainer = time.Now().Unix()
	httphandler.settings = NewSettings()
	httphandler.configHandler = configHandler.NewConfigHandler(httphandler.settings.VpnPriorities)
	httphandler.upgrader = websocket.Upgrader{}
	httphandler.clientIps = make(map[net.Addr]*websocket.Conn)
	httphandler.kubernetesAPI = NewKubernetesAPI()
	return httphandler
}

func (h *HTTPHandler) getUserIP(r *http.Request) string {
	return r.RemoteAddr
}

//GetConfigHandlerFunc gives random config file name
func (h *HTTPHandler) GetConfigHandlerFunc(w http.ResponseWriter, r *http.Request) {
	configName := h.configHandler.GetAvalibleConfig(h.getUserIP(r))
	fmt.Fprintf(w, configName)
}

//ResetHandlerFunc handles request for resetting ip
func (h *HTTPHandler) ResetHandlerFunc(w http.ResponseWriter, r *http.Request) {
	h.configHandler.ResetConfig(h.getUserIP(r))
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

func (h *HTTPHandler) reader(conn *websocket.Conn) {
	//close connection and delete it from map
	defer func() {
		h.configHandler.ResetConfig(conn.RemoteAddr().String())
		delete(h.clientIps, conn.RemoteAddr())
		conn.Close()
		log.Println("Connection with " + conn.RemoteAddr().String() + " is closed")
	}()
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
		switch string(message) {
		case "getSettings":
			response = "{\"waitFor\":" + strconv.FormatInt(h.waitFor(), 10) +
				", \"maxPingTime\":" + strconv.Itoa(h.settings.MaxPingTime) +
				", \"pageReloadTime\":" + strconv.Itoa(h.settings.PageReloadTime) +
				", \"linkToGo\":\"" + h.settings.LinkToGo + "\"}"
		case "getConfig":
			response = "{\"configFile\":\"" + h.configHandler.GetAvalibleConfig(conn.RemoteAddr().String()) + "\"}"
		}

		conn.SetWriteDeadline(time.Now().Add(writeWait))
		if err := conn.WriteMessage(messageType, []byte(response)); err != nil {
			log.Println(err)
			return
		}
	}
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
