/**
 * FIYO RFL Beat Store — Google Apps Script
 * Lista automáticamente los MP3 de la carpeta de Drive.
 *
 * Despliegue:
 * 1. En script.google.com, crear proyecto y pegar este archivo.
 * 2. Implementar > Nueva implementación > Aplicación web.
 * 3. Ejecutar como: Yo. Acceso: Cualquier persona.
 * 4. Copiar la URL /exec y pegarla en CONFIG.driveApiUrl en index.html.
 */
const FOLDER_ID = "1ofRUgq8SHgCTNnIarVEyzMqm42TR_VXC";

function doGet(e) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();
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
      audioUrl: "https://drive.google.com/uc?export=download&id=" + encodeURIComponent(id),
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
