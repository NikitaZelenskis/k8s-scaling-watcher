package main

import (
	"fmt"
	"log"
	"net/http"

	"./httphandler"
)

//configs set contains all configs in use
//ips hash contains information about witch ip uses witch hash.
func main() {
	httpHandler := httphandler.NewHTTPHandler()

	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Pong")
	})
	http.HandleFunc("/ws", httpHandler.WsHandler)
	http.HandleFunc("/replicas", httpHandler.ReplicaHandler)

	fmt.Println("Server is running")

	err := http.ListenAndServe(":80", nil)
	if err != nil {
		log.Fatal("Server crashed. ListenAndServe: ", err)
	}
}
