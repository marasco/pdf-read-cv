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
POST /api/pdfs/process/:filename
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

## 📊 Exportación de Datos

### Exportar todos los documentos a CSV
```bash
npm run export-csv
```

### Exportar solo documentos con errores
```bash
npm run export-errors
```

Los archivos CSV se guardan en la carpeta `./exports/` con la siguiente información:
- **Datos básicos**: ID, nombre, ruta, estado, páginas, tamaño
- **Metadatos**: fechas de creación y procesamiento
- **Análisis de texto**: palabras únicas, total de palabras, top 50 palabras
- **Contenido**: primeros 500 caracteres del texto extraído
- **Errores**: mensajes de error si los hay

## 📁 Estructura del Proyecto

## Scripts Disponibles

### Procesamiento de PDFs
- `npm run process` - Procesa todos los PDFs en la carpeta downloads/
- `npm run setup` - Configura la base de datos y procesa PDFs
- `npm run setup-normalize` - Normaliza nombres y configura la base de datos
- `npm run setup-process` - Configura la base de datos y procesa PDFs
- `npm run retry-failed` - Reintenta procesar PDFs que fallaron

### Gestión de Base de Datos
- `npm run clear-db` - Limpia toda la base de datos
- `npm run normalize` - Normaliza nombres de archivos (remueve prefijos)
- `npm run preview-names` - Previsualiza cambios de nombres sin aplicarlos

### Exportación de Datos
- `npm run export-csv` - Exporta todos los documentos a CSV
- `npm run export-csv-no-sort` - Exporta sin ordenamiento (para datasets grandes)
- `npm run export-errors` - Exporta solo documentos con errores

**Nota sobre exportación de datasets grandes:**
Si tienes más de 1000 documentos y encuentras errores de memoria durante la exportación, usa `npm run export-csv-no-sort` que evita el ordenamiento y es más eficiente para grandes volúmenes de datos.