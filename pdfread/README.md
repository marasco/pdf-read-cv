# PDF Reader - Extractor de Texto y Buscador

Un proyecto en Node.js que lee archivos PDF de la carpeta `downloads/`, extrae su contenido de texto y lo almacena en MongoDB para permitir búsquedas por palabra clave. Incluye una interfaz web moderna para gestionar y buscar documentos.

## 🚀 Características

- ✅ Extracción automática de texto de archivos PDF
- ✅ Almacenamiento en MongoDB con índice de palabras
- ✅ **Interfaz web moderna** para gestión de documentos
- ✅ API REST para búsquedas por palabra clave
- ✅ Procesamiento por lotes de múltiples PDFs
- ✅ Estadísticas de procesamiento en tiempo real
- ✅ Búsqueda y filtrado avanzado
- ✅ Vista detallada de documentos con palabras más frecuentes
- ✅ Manejo de errores y estados de procesamiento

## 📋 Requisitos

- Node.js (versión especificada en `.nvmrc`)
- MongoDB (local o remoto)
- Archivos PDF en la carpeta `downloads/`

## 🛠️ Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
Crea un archivo `.env` basado en `config.example.js`:
```bash
MONGODB_URI=mongodb://localhost:27017/pdf-reader
PORT=3000
DOWNLOADS_FOLDER=./downloads
```

3. **Asegúrate de que MongoDB esté corriendo:**
```bash
# Si usas MongoDB local
mongod
```

## 🚀 Uso

### Iniciar el servidor y la interfaz web
```bash
npm start
# o para desarrollo
npm run dev
```

Luego abre tu navegador en: `http://localhost:3000`

### Procesar PDFs desde línea de comandos
```bash
node scripts/processPdfs.js
```

## 🌐 Interfaz Web

La interfaz web incluye:

### 📊 Dashboard con Estadísticas
- Total de documentos procesados
- Número de palabras extraídas
- Documentos completados vs pendientes
- Estado de procesamiento en tiempo real

### 🔍 Búsqueda y Filtrado
- Búsqueda por palabra clave en contenido
- Búsqueda por nombre de archivo
- Filtrado por estado (completado, pendiente, error)
- Paginación de resultados

### 📄 Gestión de Documentos
- Vista en tarjetas de todos los documentos
- Información detallada: páginas, tamaño, fecha
- Estados visuales con badges de colores
- Modal con detalles completos del documento
- **Visualización directa de PDFs** en modal integrado
- **Descarga de archivos PDF** con un clic

### 📈 Detalles del Documento
- Contenido completo del PDF
- Palabras más frecuentes con conteo
- Metadatos del archivo
- Información de procesamiento
- **Botones para ver y descargar PDFs**
- **Visualizador de PDF integrado** en la interfaz

## 📚 API Endpoints

### Obtener todos los documentos
```bash
GET /api/pdfs
```

### Buscar por palabra clave
```bash
GET /api/pdfs/search?q=palabra
```

### Procesar todos los PDFs pendientes
```bash
POST /api/pdfs/process
```

### Procesar un PDF específico
```bash
POST /api/pdfs/process/nombre-archivo.pdf
```

### Obtener estadísticas
```bash
GET /api/pdfs/stats/overview
```

### Obtener documento específico
```bash
GET /api/pdfs/:id
```

### Descargar/ver PDF
```bash
GET /api/pdfs/download/:filename
```

## 📁 Estructura del Proyecto

```
pdfread/
├── downloads/          # Carpeta con archivos PDF
├── public/            # Interfaz web
│   ├── index.html     # Página principal
│   └── app.js         # JavaScript del frontend
├── models/            # Modelos de MongoDB
│   └── PdfDocument.js
├── services/          # Lógica de negocio
│   └── pdfProcessor.js
├── routes/            # Rutas de la API
│   └── pdfRoutes.js
├── scripts/           # Scripts de utilidad
│   └── processPdfs.js
├── index.js           # Servidor principal
├── package.json
└── README.md
```

## 🔍 Funcionalidades de Búsqueda

El sistema extrae y almacena:
- **Contenido completo** del PDF
- **Palabras únicas** con conteo de frecuencia
- **Metadatos** (páginas, tamaño, fechas)
- **Estados de procesamiento** (pending, processing, completed, error)

### Búsquedas disponibles:
- Búsqueda por palabra en el contenido
- Búsqueda por nombre de archivo
- Filtrado por estado de procesamiento
- Paginación de resultados
- **Interfaz web intuitiva** para todas las búsquedas

## 🛡️ Manejo de Errores

- Los PDFs que fallan se marcan con estado "error"
- Se registra el mensaje de error específico
- El sistema continúa procesando otros archivos
- Reintentos automáticos para archivos con errores
- **Notificaciones visuales** en la interfaz web

## 📊 Monitoreo

El sistema proporciona estadísticas sobre:
- Documentos por estado (pending, processing, completed, error)
- Total de palabras procesadas
- Palabras únicas encontradas
- Rendimiento del procesamiento
- **Dashboard en tiempo real** con métricas

## 🔧 Configuración Avanzada

### Variables de Entorno
- `MONGODB_URI`: URL de conexión a MongoDB
- `PORT`: Puerto del servidor (default: 3000)
- `DOWNLOADS_FOLDER`: Carpeta con archivos PDF (default: ./downloads)

### Personalización
Puedes modificar el procesamiento de palabras en `services/pdfProcessor.js`:
- Filtros de palabras mínimas
- Expresiones regulares de limpieza
- Estrategias de conteo

### Personalización de la Interfaz
- Modifica `public/index.html` para cambios en el diseño
- Edita `public/app.js` para funcionalidad personalizada
- Los estilos están incluidos en el HTML para fácil modificación

## 🎨 Características de la Interfaz

- **Diseño responsive** que funciona en móviles y desktop
- **Bootstrap 5** para un diseño moderno y profesional
- **Font Awesome** para iconos intuitivos
- **Animaciones suaves** y efectos hover
- **Notificaciones toast** para feedback del usuario
- **Modal interactivo** para detalles de documentos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License 