#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <FS.h>
#include <ArduinoWebsockets.h>
#include <ArduinoJson.h>
using namespace websockets;

#define LED_PIN 2  // onboard LED
#define WIFI_FILE "/wifi.json"
#define AP_SSID "E-Noki LED-Scanner"
#define AP_PASSWORD ""  // open AP

// 74HC595 Pins
#define DATA_PIN 13
#define CLOCK_PIN 12
#define LATCH_PIN 15

// LED bit positions
#define LED0 0
#define LED1 1
#define LED2 2
#define LED3 3
#define LED4 4

byte ledState = 0b00000000;

// === Device Info ===
const char *enokiLED = "ENOKI-5-PORT-SCANNER-rev0.10beta";
const char *enokiUniq = "e75f428a-0fb1-40e9-bd88-15c4313ed23e";
const char *enokiInst = "898b4819-1877-41b4-aae4-d16f571ddb3b";

struct LedInf {
  int addr;
  const char *uq;
  const char *color;
};

LedInf ledList[] = {
  { LED0, "f23c991d", "red" },
  { LED1, "a3337cd6", "red" },
  { LED2, "56c10d14", "yellow" },
  { LED3, "459a6ad0", "yellow" },
  { LED4, "635ee1a3", "blue" }
};

// === Globals ===
WebsocketsClient ws;
ESP8266WebServer server(80);
bool isProvisioning = false;
bool wsConnected = false;
String wsUrl = "wss://enoki.henchgalphilippines.com/esp";

// -------------------- UI HTML --------------------
const char indexPage[] PROGMEM = R"rawliteral(
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>E-Noki LED Wi-Fi Setup</title>
<style>
body{font-family:'Segoe UI',sans-serif;background:#eef2f3;display:flex;justify-content:center;align-items:center;height:100vh;}
.container{background:#fff;padding:30px;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,0.1);width:100%;max-width:420px;}
h2{text-align:center;color:#2b4c7e;margin-bottom:20px;}
input{width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;margin-bottom:15px;}
button{width:100%;padding:12px;background:#4a90e2;color:#fff;border:none;border-radius:8px;font-weight:bold;}
#status{text-align:center;margin-top:10px;color:#555;}
</style>
</head>
<body>
<div class="container">
  <h2>E-Noki LED Wi-Fi Setup</h2>
  <input id="ssid" type="text" placeholder="Wi-Fi Name (SSID)"/>
  <input id="pass" type="password" placeholder="Password (optional)"/>
  <button id="submit">Save & Connect</button>
  <div id="status"></div>
</div>
<script>
document.getElementById('submit').addEventListener('click', ()=>{
 const ssid=document.getElementById('ssid').value.trim();
 const pass=document.getElementById('pass').value.trim();
 if(!ssid){alert('Please enter Wi-Fi name');return;}
 document.getElementById('status').innerText='Saving...';
 fetch('/save',{method:'POST',headers:{'Content-Type':'application/json'},
 body:JSON.stringify({ssid:ssid,pass:pass})})
 .then(r=>r.text()).then(t=>{document.getElementById('status').innerText=t+' Restarting...';})
 .catch(e=>{document.getElementById('status').innerText='Save failed: '+e;});
});
</script>
</body></html>
)rawliteral";

// -------------------- LED Functions --------------------
void updateShiftRegister() {
  digitalWrite(LATCH_PIN, LOW);
  shiftOut(DATA_PIN, CLOCK_PIN, MSBFIRST, ledState);
  digitalWrite(LATCH_PIN, HIGH);
}

// -------------------- Wi-Fi + SPIFFS --------------------
bool saveCredentials(const String &ssid, const String &pass) {
  File f = SPIFFS.open(WIFI_FILE, "w");
  if (!f) return false;
  f.printf("{\"ssid\":\"%s\",\"pass\":\"%s\"}", ssid.c_str(), pass.c_str());
  f.close();
  return true;
}

bool readCredentials(String &ssid, String &pass) {
  if (!SPIFFS.exists(WIFI_FILE)) return false;
  File f = SPIFFS.open(WIFI_FILE, "r");
  String content = f.readString();
  f.close();
  int s1 = content.indexOf("\"ssid\":\""), s2 = content.indexOf("\"", s1 + 8);
  int p1 = content.indexOf("\"pass\":\""), p2 = content.indexOf("\"", p1 + 8);
  if (s1 == -1 || s2 == -1) return false;
  ssid = content.substring(s1 + 8, s2);
  pass = (p1 != -1 && p2 != -1) ? content.substring(p1 + 8, p2) : "";
  return true;
}

bool tryConnect(const String &ssid, const String &pass, uint32_t timeoutSec = 15) {
  Serial.printf("Connecting to '%s'...\n", ssid.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());
  uint32_t start = millis();
  while (millis() - start < timeoutSec * 1000) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("✅ Wi-Fi connected");
      Serial.println(WiFi.localIP());
      return true;
    }
    delay(250);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi failed.");
  return false;
}

// -------------------- Web Handlers --------------------
void handleRoot() {
  server.send(200, "text/html", indexPage);
}

void handleSave() {
  String body = server.arg("plain");
  int s1 = body.indexOf("\"ssid\":\""), s2 = body.indexOf("\"", s1 + 8);
  int p1 = body.indexOf("\"pass\":\""), p2 = body.indexOf("\"", p1 + 8);
  if (s1 == -1 || s2 == -1) {
    server.send(400, "text/plain", "Bad JSON");
    return;
  }
  String ssid = body.substring(s1 + 8, s2);
  String pass = (p1 != -1 && p2 != -1) ? body.substring(p1 + 8, p2) : "";
  if (!saveCredentials(ssid, pass)) {
    server.send(500, "text/plain", "Failed to save");
    return;
  }
  server.send(200, "text/plain", "Saved");
  delay(1000);
  ESP.restart();
}

// -------------------- WebSocket Setup --------------------
void setupWebSocket() {
  ws.setInsecure();
  Serial.println("\nConnecting to WebSocket...");

  while (!ws.connect(wsUrl)) {
    Serial.println("❌ WebSocket connection failed. Retrying in 3 seconds...");
    delay(3000);
  }

  Serial.println("✅ WebSocket connected.");
  wsConnected = true;
  digitalWrite(LED_PIN, LOW);  // LED ON when WS connected (active low)

  ws.onMessage([](WebsocketsMessage msg) {
    String payload = msg.data();
    Serial.println("WS received: " + payload);

    DynamicJsonDocument doc(256);
    deserializeJson(doc, payload);
    String type = doc["type"];

    if (type == "update") {
      ledState = doc["state"];
      Serial.print("Updated LED state: ");
      Serial.println(ledState, BIN);
      updateShiftRegister();

      DynamicJsonDocument ack(128);
      ack["type"] = "confirm";
      ack["state"] = ledState;
      String out;
      serializeJson(ack, out);
      ws.send(out);
    }
  });

  ws.onEvent([](WebsocketsEvent event, String data) {
    if (event == WebsocketsEvent::ConnectionClosed) {
      wsConnected = false;
      Serial.println("❌ WebSocket connection closed.");
    }
  });

  // Send init sync
  DynamicJsonDocument init(512);
  init["type"] = "init";
  init["currentState"] = ledState;
  init["deviceSID"] = enokiUniq;
  init["name"] = enokiLED;
  init["institutionId"] = enokiInst;

  JsonArray leds = init.createNestedArray("ledArray");
  int ledCount = sizeof(ledList) / sizeof(ledList[0]); // ledList -- bytes divided by size of one element
  for (int i = 0; i < ledCount; i++) {
    JsonObject ledObj = leds.createNestedObject();
    ledObj["idx"] = ledList[i].addr;
    ledObj["ledUq"] = ledList[i].uq;
    ledObj["color"] = ledList[i].color;
  }

  String initJson;
  serializeJson(init, initJson);
  ws.send(initJson);

  Serial.println("✅ WebSocket connected and initialized.");
}

// -------------------- SETUP --------------------
void setup() {
  Serial.begin(115200);
  pinMode(DATA_PIN, OUTPUT);
  pinMode(CLOCK_PIN, OUTPUT);
  pinMode(LATCH_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, HIGH);  // LED off (active low)

  if (!SPIFFS.begin()) SPIFFS.format();

  String ssid, pass;
  if (readCredentials(ssid, pass) && tryConnect(ssid, pass)) {
    setupWebSocket();
  } else {
    isProvisioning = true;
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASSWORD);
    Serial.printf("AP started: %s | IP: ", AP_SSID);
    Serial.println(WiFi.softAPIP());
    server.on("/", handleRoot);
    server.on("/save", HTTP_POST, handleSave);
    server.begin();
    Serial.println("Provisioning active.");
  }

  updateShiftRegister();
}

const unsigned long POLL_INTERVAL = 10000;
unsigned long lastPollTime = 0;

// -------------------- LOOP --------------------
void loop() {
  if (isProvisioning) {
    server.handleClient();
    return;
  }

  ws.poll();  // keep WebSocket alive
  unsigned long currentTime = millis();

  // send poll message periodically
  if (currentTime - lastPollTime >= POLL_INTERVAL) {
    if (ws.available()) {
      ws.send("POLL");
      Serial.println("🔁 Sent POLL");
    }
    lastPollTime = currentTime;
  }

  // reconnect only if WebSocket closed
  if (!ws.available() && !isProvisioning) {
    if (wsConnected) {
      wsConnected = false;
      digitalWrite(LED_PIN, HIGH);  // LED off if WS lost
      Serial.println("⚠️ WebSocket disconnected, retrying...");
      delay(2000);
      setupWebSocket();
    }
  }
}
