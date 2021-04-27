package httphandler

import (
	"bytes"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
)

//KubernetesAPI communicates to kubernetes api
type KubernetesAPI struct {
	scaleURL *url.URL
	caToken  []byte
	caCert   []byte
}

//NewKubernetesAPI creates new instance that communicate to kubernetesAPI
func NewKubernetesAPI() KubernetesAPI {
	kubernetesAPI := KubernetesAPI{}
	kubernetesAPI.scaleURL = kubernetesAPI.deploymentURL()
	kubernetesAPI.caToken = kubernetesAPI.getCaToken()
	kubernetesAPI.caCert = kubernetesAPI.getCert()
	return kubernetesAPI
}

//UpdateReplicaAmount updates amount of replicas of executor
func (k *KubernetesAPI) UpdateReplicaAmount(amount int) {
	payload := "{\"spec\":{\"replicas\":" + strconv.Itoa(amount) + "}}"
	httpMethod := http.MethodPatch

	req, err := http.NewRequest(httpMethod, k.scaleURL.String(), bytes.NewBuffer([]byte(payload)))
	if err != nil {
		panic(err)
	}

	req.Header.Set("Content-Type", "application/strategic-merge-patch+json")
	k.sendAuthorisedRequest(req)

}

func (k *KubernetesAPI) sendAuthorisedRequest(req *http.Request) *http.Response {
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", string(k.caToken)))

	caCertPool := x509.NewCertPool()

	caCertPool.AppendCertsFromPEM(k.caCert)

	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				RootCAs: caCertPool,
			},
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("sending helm deploy payload failed: %s", err.Error())
		panic(err)
	}

	defer resp.Body.Close()
	return resp
}

func (k *KubernetesAPI) deploymentURL() *url.URL {
	serviceHost := os.Getenv("KUBERNETES_SERVICE_HOST")
	servicePort := os.Getenv("KUBERNETES_SERVICE_PORT")
	namespace, err := ioutil.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/namespace")
	if err != nil {
		panic(err)
	}
	deployment := "executor"
	deploymentURL := fmt.Sprintf("https://%s:%s/apis/apps/v1/namespaces/%s/deployments/%s", serviceHost, servicePort, string(namespace), deployment)
	u, err := url.Parse(deploymentURL)
	if err != nil {
		panic(err)
	}
	return u
}

func (k *KubernetesAPI) getCaToken() []byte {
	caToken, err := ioutil.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		panic(err) // cannot find token file
	}
	return caToken
}

func (k *KubernetesAPI) getCert() []byte {
	caCert, err := ioutil.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/ca.crt")
	if err != nil {
		panic(err)
	}
	return caCert
}
