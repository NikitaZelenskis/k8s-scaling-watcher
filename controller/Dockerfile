FROM golang:1.14

WORKDIR /go/app
COPY app /go/app

ENV GOROOT /usr/local/go
ENV GOPATH /go
ENV GOBIN /go/bin

RUN go get -d -v ./...
RUN go install -v ./...

RUN go build

CMD app
