/**
 * Banter — Automatización de Google Forms y Google Sheets
 * =============================================================================
 * Hoja maestra ya creada en tu Google Drive:
 *   ID:  1i0t2hRSAO4WT7nKlK3rzgsx4oulmrYmpTqIe6CA5ozU
 *   URL: https://docs.google.com/spreadsheets/d/1i0t2hRSAO4WT7nKlK3rzgsx4oulmrYmpTqIe6CA5ozU/edit
 *
 * INSTRUCCIONES (1 minuto):
 * 1. Abre la hoja de arriba -> Extensiones -> Apps Script.
 * 2. Pega este archivo completo y guarda.
 * 3. Ejecuta la función `crearFormulariosBanter()` (solo 1 vez):
 *    - Creará automáticamente los 2 Google Forms oficiales:
 *      a) "Banter — Registro de Usuarios"
 *      b) "Banter — Control de Solicitudes y Alianzas"
 *    - Los vinculará a esta Google Sheet e instalará disparadores automáticos
 *      para copiar cada envío a `Usuarios_Registro` y `Solicitudes_Banter`.
 *    - Imprimirá las URLs públicas de ambos Forms en el registro de ejecución.
 * 4. (Opcional para envío directo desde la app Banter):
 *    Implementar -> Nueva implementación -> Aplicación web -> Ejecutar como "Yo",
 *    Acceso "Cualquier usuario" -> copia la URL y pégala en VITE_SHEETS_WEBHOOK_URL.
 */

const SPREADSHEET_ID = '1i0t2hRSAO4WT7nKlK3rzgsx4oulmrYmpTqIe6CA5ozU';

function crearFormulariosBanter() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1) Formulario de Registro de Usuarios Banter
  const formRegistro = FormApp.create('Banter — Registro de Usuarios');
  formRegistro
    .setDescription('Regístrate en el ecosistema multiplataforma Banter (Escritorio, Android y Web).')
    .setCollectEmail(true);

  formRegistro.addTextItem().setTitle('Nombre o Handle').setRequired(true);
  formRegistro
    .addMultipleChoiceItem()
    .setTitle('Plataforma principal')
    .setChoiceValues(['Escritorio', 'Android', 'Web', 'Multiplataforma'])
    .setRequired(true);
  formRegistro
    .addMultipleChoiceItem()
    .setTitle('Plan de interés')
    .setChoiceValues(['Free (Con anuncios)', 'Banter Nitro', 'Banter Nitro+'])
    .setRequired(true);
  formRegistro.addTextItem().setTitle('País').setRequired(false);
  formRegistro.addParagraphTextItem().setTitle('Notas o juegos principales').setRequired(false);
  formRegistro.setDestination(FormApp.DestinationType.SPREADSHEET, SPREADSHEET_ID);

  // 2) Formulario de Control de Solicitudes (Beta, Creadores, Soporte, Alianzas, NitroPay)
  const formSolicitudes = FormApp.create('Banter — Control de Solicitudes y Alianzas');
  formSolicitudes
    .setDescription('Envía solicitudes de acceso beta, verificación de creador, soporte técnico o colaboración comercial.')
    .setCollectEmail(true);

  formSolicitudes.addTextItem().setTitle('Nombre o Marca').setRequired(true);
  formSolicitudes
    .addListItem()
    .setTitle('Tipo de solicitud')
    .setChoiceValues([
      'Acceso Beta',
      'Verificación Creador',
      'Soporte Técnico',
      'Alianza / Patrocinio',
      'Solicitud NitroPay/Ads',
      'Reembolso / Facturación',
    ])
    .setRequired(true);
  formSolicitudes
    .addMultipleChoiceItem()
    .setTitle('Plataforma')
    .setChoiceValues(['Escritorio', 'Android', 'Web', 'Multiplataforma'])
    .setRequired(true);
  formSolicitudes
    .addMultipleChoiceItem()
    .setTitle('Prioridad estimada')
    .setChoiceValues(['Alta', 'Media', 'Baja'])
    .setRequired(true);
  formSolicitudes.addParagraphTextItem().setTitle('Descripción detallada de la solicitud').setRequired(true);
  formSolicitudes.setDestination(FormApp.DestinationType.SPREADSHEET, SPREADSHEET_ID);

  // Instalar trigger de sincronización hacia las pestañas normalizadas
  ScriptApp.newTrigger('onBanterFormSubmit').forSpreadsheet(ss).onFormSubmit().create();

  Logger.log('=== FORMULARIOS BANTER CREADOS ===');
  Logger.log('Registro de Usuarios: ' + formRegistro.getPublishedUrl());
  Logger.log('Control de Solicitudes: ' + formSolicitudes.getPublishedUrl());
  return {
    registroUrl: formRegistro.getPublishedUrl(),
    solicitudesUrl: formSolicitudes.getPublishedUrl(),
  };
}

function onBanterFormSubmit(e) {
  if (!e || !e.namedValues) return;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const v = e.namedValues;
  const first = (k) => (v[k] && v[k][0] ? String(v[k][0]).trim() : '');
  const fecha = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');

  if (first('Nombre o Handle')) {
    const sh = ss.getSheetByName('Usuarios_Registro');
    const id = 'BNT-' + String(sh.getLastRow()).padStart(4, '0');
    sh.appendRow([
      id,
      fecha,
      first('Nombre o Handle'),
      first('Dirección de correo electrónico') || first('Email Address'),
      first('Plataforma principal') || 'Multiplataforma',
      first('Plan de interés') || 'Free (Con anuncios)',
      'Activo',
      'Google Forms',
      first('País'),
      first('Notas o juegos principales'),
    ]);
  } else if (first('Tipo de solicitud')) {
    const sh = ss.getSheetByName('Solicitudes_Banter');
    const id = 'SOL-' + String(sh.getLastRow()).padStart(4, '0');
    sh.appendRow([
      id,
      fecha,
      first('Nombre o Marca'),
      first('Dirección de correo electrónico') || first('Email Address'),
      first('Tipo de solicitud'),
      first('Plataforma') || 'Multiplataforma',
      first('Prioridad estimada') || 'Media',
      'Pendiente',
      'Sin asignar',
      first('Descripción detallada de la solicitud'),
    ]);
  }
}

/** Webhook JSON para recibir registros y solicitudes directo desde la app Web/Desktop/Android de Banter. */
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const fecha = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
    const platformMap = {
      'desktop-electron': 'Escritorio',
      'android-capacitor': 'Android',
      web: 'Web',
    };
    const planMap = {
      free: 'Free (Con anuncios)',
      nitro: 'Banter Nitro',
      nitro_plus: 'Banter Nitro+',
    };

    if (body.kind === 'usuario_registro') {
      const sh = ss.getSheetByName('Usuarios_Registro');
      const id = body.clientId || 'BNT-' + String(sh.getLastRow()).padStart(4, '0');
      sh.appendRow([
        id,
        fecha,
        String(body.handle || '').slice(0, 60),
        String(body.email || '').slice(0, 120),
        platformMap[body.platform] || 'Web',
        planMap[body.planId] || 'Free (Con anuncios)',
        'Activo',
        'App Banter',
        String(body.country || '').slice(0, 40),
        String(body.notes || '').slice(0, 300),
      ]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, id })).setMimeType(
        ContentService.MimeType.JSON,
      );
    }

    if (body.kind === 'solicitud_banter') {
      const sh = ss.getSheetByName('Solicitudes_Banter');
      const id = body.clientId || 'SOL-' + String(sh.getLastRow()).padStart(4, '0');
      sh.appendRow([
        id,
        fecha,
        String(body.requester || '').slice(0, 80),
        String(body.email || '').slice(0, 120),
        String(body.requestType || 'Soporte Técnico'),
        platformMap[body.platform] || 'Web',
        String(body.priority || 'Media'),
        'Pendiente',
        'Sin asignar',
        String(body.summary || '').slice(0, 600),
      ]);
      return ContentService.createTextOutput(JSON.stringify({ ok: true, id })).setMimeType(
        ContentService.MimeType.JSON,
      );
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'tipo_invalido' })).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
