package main

import (
	"embed"
	"goshell/internal/wailsapi"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var trayIcon []byte

func main() {
	wailsapi.Run(assets, trayIcon)
}
