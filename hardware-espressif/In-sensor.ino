#include <WiFi.h>
#include <WebServer.h>
#include "SPIFFS.h"
#include <SPI.h>
#include <MFRC522.h>
#include <HTTPClient.h>

#define LED_PIN 2
#define WIFI_FILE "/wifi.json"
#define AP_SSID "E-Noki In Sensor (fba3c2a)"
#define AP_PASSWORD ""   // Leave empty for open AP

// RC522 wiring pins
#define SS_PIN 5     // SDA
#define RST_PIN 22   // RST

// --- API endpoint for RFID POST ---
const char* API_ENDPOINT = "https://enoki.henchgalphilippines.com/api/beta/in-sens";
const unsigned long POST_TIMEOUT_MS = 5000;

WebServer server(80);
MFRC522 mfrc522(SS_PIN, RST_PIN);
bool isProvisioning = false;
bool wifiConnected = false;

// Forward declarations
bool saveCredentials(const String &ssid, const String &pass);
bool readCredentials(String &ssid, String &pass);
bool tryConnect(const String &ssid, const String &pass, uint32_t timeoutSec = 15);
void runMainProgram();
void handleRoot();
void handleSave();
bool sendUidToApi(const String &uidHex, const String &formattedUID);

// ---------------- HTML PAGE ----------------
const char indexPage[] PROGMEM = R"rawliteral(
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>E-Noki WiFi Setup</title>
<style>
body {font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#eef2f3,#d9e7ff);
display:flex;justify-content:center;align-items:center;height:100vh;margin:0;}
.container{background:#fff;padding:30px;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,0.1);
width:100%;max-width:420px;}
h2{text-align:center;color:#2b4c7e;margin-bottom:20px;}
input{width:100%;padding:10px;border:1px solid #ccc;border-radius:8px;margin-bottom:15px;}
button{width:100%;padding:12px;background:#4a90e2;color:#fff;border:none;border-radius:8px;font-weight:bold;}
#status{text-align:center;margin-top:10px;color:#555;}
.footer{text-align:center;font-size:0.75em;margin-top:15px;color:#aaa;}
</style>
</head>
<body>
<div class="container">
  <h2>E-Noki In-Sensor Wi-Fi Setup</h2>
  <input id="ssid" type="text" placeholder="Wi-Fi Name (SSID)"/>
  <input id="pass" type="password" placeholder="Password (optional)"/>
  <button id="submit">Save & Connect</button>
  <div id="status"></div>
  <div class="footer">© 2025 E-Noki System</div>
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

// ---------------- SETUP ----------------
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  if (!SPIFFS.begin(true)) Serial.println("Failed to mount SPIFFS");
  else Serial.println("SPIFFS mounted");

  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("RC522 initialized");

  String ssid, pass;
  if (readCredentials(ssid, pass)) {
    Serial.printf("Found saved credentials: SSID='%s'\n", ssid.c_str());
    if (tryConnect(ssid, pass, 15)) {
      wifiConnected = true;
      runMainProgram();
    } else {
      Serial.println("Saved credentials failed - entering provisioning mode");
    }
  } else {
    Serial.println("No saved credentials - entering provisioning mode");
  }

  if (!wifiConnected) {
    isProvisioning = true;
    WiFi.mode(WIFI_AP_STA);
    if (strlen(AP_PASSWORD) > 0)
      WiFi.softAP(AP_SSID, AP_PASSWORD);
    else
      WiFi.softAP(AP_SSID);

    Serial.printf("AP started: %s | IP: ", AP_SSID);
    Serial.println(WiFi.softAPIP());

    server.on("/", HTTP_GET, handleRoot);
    server.on("/save", HTTP_POST, handleSave);
    server.begin();
    Serial.println("Provisioning web server started");
  }
}

// ---------------- LOOP ----------------
void loop() {
  if (isProvisioning) server.handleClient();

  // Only run RFID + POST when connected to WiFi (main mode)
  if (wifiConnected) {
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      String uidHex = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        if (mfrc522.uid.uidByte[i] < 0x10) uidHex += "0";
        uidHex += String(mfrc522.uid.uidByte[i], HEX);
        if (i < mfrc522.uid.size - 1) uidHex += " ";
      }
      uidHex.toUpperCase();

      String formattedUID = "[ENOKI-RFID-SIG] " + uidHex;
      Serial.println("Card Detected: " + formattedUID);

      if (!sendUidToApi(uidHex, formattedUID))
        Serial.println("POST failed.");

      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
      delay(200);
    }
  }
}

// ---------------- MAIN PROGRAM ----------------
void runMainProgram() {
  Serial.println("✅ Wi-Fi connected! Running In-Sensor main program...");
  Serial.print("IP Address: "); Serial.println(WiFi.localIP());
  digitalWrite(LED_PIN, HIGH);
  wifiConnected = true;
}

// ---------------- HELPERS ----------------
bool saveCredentials(const String &ssid, const String &pass) {
  File f = SPIFFS.open(WIFI_FILE, FILE_WRITE);
  if (!f) return false;
  String json = "{\"ssid\":\"" + ssid + "\",\"pass\":\"" + pass + "\"}";
  f.print(json);
  f.close();
  Serial.println("Credentials saved to SPIFFS");
  return true;
}

bool readCredentials(String &ssid, String &pass) {
  if (!SPIFFS.exists(WIFI_FILE)) return false;
  File f = SPIFFS.open(WIFI_FILE, FILE_READ);
  String content = f.readString(); f.close();
  int s1 = content.indexOf("\"ssid\":\""), s2 = content.indexOf("\"", s1 + 8);
  int p1 = content.indexOf("\"pass\":\""), p2 = content.indexOf("\"", p1 + 8);
  if (s1==-1||s2==-1||p1==-1||p2==-1) return false;
  ssid = content.substring(s1 + 8, s2);
  pass = content.substring(p1 + 8, p2);
  return true;
}

bool tryConnect(const String &ssid, const String &pass, uint32_t timeoutSec) {
  Serial.printf("Connecting to '%s'\n", ssid.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());
  uint32_t start = millis();
  while (millis() - start < timeoutSec * 1000) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("Connected!");
      Serial.print("IP: "); Serial.println(WiFi.localIP());
      return true;
    }
    delay(200);
  }
  Serial.println("Wi-Fi connection timed out.");
  return false;
}

// ---------------- WEB HANDLERS ----------------
void handleRoot() {
  server.send(200, "text/html", indexPage);
}

void handleSave() {
  Serial.println("[POST] /save");
  String body = server.arg("plain");
  int s1 = body.indexOf("\"ssid\":\""), s2 = body.indexOf("\"", s1 + 8);
  int p1 = body.indexOf("\"pass\":\""), p2 = body.indexOf("\"", p1 + 8);
  if (s1==-1 || s2==-1) { server.send(400, "text/plain", "Bad JSON"); return; }
  String ssid = body.substring(s1 + 8, s2);
  String pass = (p1!=-1 && p2!=-1)? body.substring(p1 + 8, p2): "";
  if (!saveCredentials(ssid, pass)) {
    server.send(500, "text/plain", "Failed to save");
    return;
  }
  server.send(200, "text/plain", "Saved");
  delay(500);
  ESP.restart();
}

// ---------------- POST FUNCTION ----------------
bool sendUidToApi(const String &uidHex, const String &formattedUID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi not connected, skip POST");
    return false;
  }

  HTTPClient http;
  http.setTimeout(POST_TIMEOUT_MS);
  http.begin(API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"employeeRfidHash\":\"" + uidHex + "\"}";
  Serial.print("POST -> "); Serial.println(API_ENDPOINT);
  Serial.println("Payload: " + payload);

  int code = http.POST(payload);
  if (code > 0) {
    Serial.printf("Response Code: %d\n", code);
    Serial.println("Response Body: " + http.getString());
    http.end();
    return (code >= 200 && code < 300);
  } else {
    Serial.printf("HTTP Error: %d\n", code);
    http.end();
    return false;
  }
}
