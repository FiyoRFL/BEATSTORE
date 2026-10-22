/**
 * FIYO RFL Beat Store — catálogo + sincronización Drive -> GitHub.
 *
 * Configuración única:
 * Apps Script > Configuración del proyecto > Propiedades del script:
 *   GITHUB_TOKEN = token fine-grained con Contents: Read and write para FiyoRFL/BEATSTORE
 *
 * Ejecutar setupSyncTrigger() una vez para sincronizar cada 15 minutos.
 * Ejecutar syncDrivePreviews() para probar inmediatamente.
 */
const FOLDER_ID = "1ofRUgq8SHgCTNnIarVEyzMqm42TR_VXC";
const GH_OWNER = "FiyoRFL";
const GH_REPO = "BEATSTORE";
const GH_BRANCH = "main";
const GH_AUDIO_DIR = "drive-audio";
const GH_RAW_BASE = "https://raw.githubusercontent.com/" + GH_OWNER + "/" + GH_REPO + "/" + GH_BRANCH + "/" + GH_AUDIO_DIR + "/";
const MAX_FILE_BYTES = 15 * 1024 * 1024; // previews de hasta 15 MB por archivo

function doGet(e) {
  const files = DriveApp.getFolderById(FOLDER_ID).getFiles();
  const tracks = [];
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    if (!/\.mp3$/i.test(name)) continue;
    const id = file.getId();
    const title = name.replace(/\.mp3$/i, "").replace(/[_-]+/g, " ").trim();
    tracks.push({
      id: id,
      title: title || name,
      genre: "Other",
      bpm: "—",
      audioUrl: GH_RAW_BASE + encodeURIComponent(id) + ".mp3",
      note: "FIYO RFL · Preescucha"
    });
  }
  tracks.sort((a, b) => a.title.localeCompare(b.title, "es"));
  const payload = JSON.stringify({ producerName: "FIYO RFL", tracks: tracks });
  const callback = e && e.parameter && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(e.parameter.callback)
    ? e.parameter.callback : "";
  return ContentService
    .createTextOutput(callback ? callback + "(" + payload + ");" : payload)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

/** Copia archivos nuevos o modificados de Drive a GitHub para servirlos como audio web. */
function syncDrivePreviews() {
  const token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  if (!token) throw new Error("Falta GITHUB_TOKEN en Propiedades del script.");
  const files = DriveApp.getFolderById(FOLDER_ID).getFiles();
  const report = [];
  while (files.hasNext()) {
    const file = files.next();
    if (!/\.mp3$/i.test(file.getName())) continue;
    if (file.getSize() > MAX_FILE_BYTES) {
      report.push("OMITIDO (>15 MB): " + file.getName());
      continue;
    }
    const path = GH_AUDIO_DIR + "/" + file.getId() + ".mp3";
    const apiUrl = "https://api.github.com/repos/" + GH_OWNER + "/" + GH_REPO + "/contents/" + path;
    const headers = {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    const getResp = UrlFetchApp.fetch(apiUrl + "?ref=" + GH_BRANCH, {
      method: "get", headers: headers, muteHttpExceptions: true
    });
    let existingSha = null;
    if (getResp.getResponseCode() === 200) {
      const old = JSON.parse(getResp.getContentText());
      existingSha = old.sha || null;
      // Evita subir de nuevo si el archivo en Drive no cambió desde la última sincronización.
      const props = PropertiesService.getScriptProperties();
      const stampKey = "SYNC_" + file.getId();
      if (props.getProperty(stampKey) === String(file.getLastUpdated().getTime()) && existingSha) {
        report.push("SIN CAMBIOS: " + file.getName());
        continue;
      }
    } else if (getResp.getResponseCode() !== 404) {
      report.push("ERROR consultando GitHub (" + getResp.getResponseCode() + "): " + file.getName());
      continue;
    }
    const base64 = Utilities.base64Encode(file.getBlob().getBytes());
    const body = {
      message: "Sync Drive preview: " + file.getName(),
      content: base64,
      branch: GH_BRANCH
    };
    if (existingSha) body.sha = existingSha;
    const putResp = UrlFetchApp.fetch(apiUrl, {
      method: "put", contentType: "application/json", headers: headers,
      payload: JSON.stringify(body), muteHttpExceptions: true
    });
    const code = putResp.getResponseCode();
    if (code >= 200 && code < 300) {
      PropertiesService.getScriptProperties().setProperty("SYNC_" + file.getId(), String(file.getLastUpdated().getTime()));
      report.push("OK: " + file.getName());
    } else {
      report.push("ERROR GitHub (" + code + "): " + file.getName() + " — " + putResp.getContentText().slice(0, 180));
    }
  }
  Logger.log(report.join("\n"));
  return report;
}

/** Ejecutar una vez: crea el disparador automático cada 15 minutos. */
function setupSyncTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "syncDrivePreviews") ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger("syncDrivePreviews").timeBased().everyMinutes(15).create();
  return syncDrivePreviews();
}
