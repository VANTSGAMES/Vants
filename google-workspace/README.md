# Gestión de Datos Banter (Google Forms + Google Sheets)

La hoja maestra ya está creada y formateada en tu Google Drive:
- **Spreadsheet ID:** `1i0t2hRSAO4WT7nKlK3rzgsx4oulmrYmpTqIe6CA5ozU`
- **URL:** https://docs.google.com/spreadsheets/d/1i0t2hRSAO4WT7nKlK3rzgsx4oulmrYmpTqIe6CA5ozU/edit

### Pestañas configuradas
1. **`Usuarios_Registro`**: alta multiplataforma (Escritorio, Android, Web), plan activo y origen.
2. **`Solicitudes_Banter`**: control de solicitudes (Acceso Beta, Verificación Creador, Soporte, Alianzas, Solicitud NitroPay/Ads).
3. **`Suscripciones_Nitro`**: control de suscripciones activas (`Stripe Web/Desktop` y `Google Play Billing Android`) y estado Ad-Free.
4. **`Metricas_Monetizacion`**: tablero automático con fórmulas KPI en tiempo real y checklist de cumplimiento NitroPay.

### Activar los 2 Google Forms en 3 pasos
1. Abre la Google Sheet y ve a **Extensiones → Apps Script**.
2. Pega el contenido de [`setup-banter-forms.gs`](./setup-banter-forms.gs) y guarda.
3. Ejecuta `crearFormulariosBanter()` para generar automáticamente **«Banter — Registro de Usuarios»** y **«Banter — Control de Solicitudes y Alianzas»** ya vinculados a la hoja.
4. *(Opcional)* Pulsa **Implementar → Nueva implementación → Aplicación web** y copia la URL resultante en `VITE_SHEETS_WEBHOOK_URL` para que los formularios dentro de la app Banter escriban directamente en la hoja.
