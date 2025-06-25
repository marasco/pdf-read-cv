// Variables globales
let currentPage = 1;
let currentSearch = '';
let currentStatus = '';
let documents = [];
let totalPages = 1;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadDocuments();
    loadStats();
    
    // Event listener para búsqueda con Enter
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchDocuments();
        }
    });
});

// Cargar documentos
async function loadDocuments(page = 1) {
    showLoading(true);
    currentPage = page;
    
    try {
        let url = `/api/pdfs?page=${page}&limit=12`;
        if (currentSearch) {
            url = `/api/pdfs/search?q=${encodeURIComponent(currentSearch)}&page=${page}&limit=12`;
        }
        if (currentStatus) {
            url += `&status=${currentStatus}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        documents = data.documents || [];
        totalPages = data.pagination?.pages || 1;
        
        renderDocuments();
        renderPagination();
    } catch (error) {
        console.error('Error cargando documentos:', error);
        showError('Error cargando documentos');
    } finally {
        showLoading(false);
    }
}

// Renderizar documentos
function renderDocuments() {
    const container = document.getElementById('documentsList');
    
    if (documents.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No se encontraron documentos
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = documents.map(doc => `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card document-card h-100" onclick="showDocumentDetails('${doc._id}')">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0 text-truncate" title="${doc.filename}">
                            <i class="fas fa-file-pdf text-danger me-2"></i>
                            ${doc.filename}
                        </h6>
                        ${getStatusBadge(doc.status)}
                    </div>
                    
                    <div class="small text-muted">
                        <div><i class="fas fa-calendar me-1"></i> ${formatDate(doc.createdAt)}</div>
                        ${doc.metadata ? `
                            <div><i class="fas fa-file-alt me-1"></i> ${doc.metadata.pages || 0} páginas</div>
                            <div><i class="fas fa-weight-hanging me-1"></i> ${formatFileSize(doc.metadata.fileSize)}</div>
                        ` : ''}
                        ${doc.words ? `
                            <div><i class="fas fa-font me-1"></i> ${doc.words.length} palabras únicas</div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Renderizar paginación
function renderPagination() {
    const container = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Botón anterior
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadDocuments(${currentPage - 1})">Anterior</a>
        </li>
    `;
    
    // Páginas
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="loadDocuments(${i})">${i}</a>
            </li>
        `;
    }
    
    // Botón siguiente
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadDocuments(${currentPage + 1})">Siguiente</a>
        </li>
    `;
    
    container.innerHTML = paginationHTML;
}

// Buscar documentos
function searchDocuments() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    currentSearch = searchTerm;
    loadDocuments(1);
}

// Filtrar por estado
function filterByStatus() {
    const status = document.getElementById('statusFilter').value;
    currentStatus = status;
    loadDocuments(1);
}

// Mostrar detalles del documento
async function showDocumentDetails(docId) {
    try {
        const response = await fetch(`/api/pdfs/${docId}`);
        const doc = await response.json();
        
        // Llenar modal
        document.getElementById('modalTitle').textContent = doc.filename;
        document.getElementById('modalFilename').textContent = doc.filename;
        document.getElementById('modalStatus').innerHTML = getStatusBadge(doc.status);
        document.getElementById('modalPages').textContent = doc.metadata?.pages || 'N/A';
        document.getElementById('modalSize').textContent = formatFileSize(doc.metadata?.fileSize);
        document.getElementById('modalProcessed').textContent = formatDate(doc.metadata?.processedAt);
        
        // Mostrar palabras más frecuentes
        const wordsContainer = document.getElementById('modalWords');
        if (doc.words && doc.words.length > 0) {
            const topWords = doc.words
                .sort((a, b) => b.count - a.count)
                .slice(0, 20);
            
            wordsContainer.innerHTML = topWords.map(word => `
                <span class="word-tag" title="${word.count} veces">
                    ${word.word} (${word.count})
                </span>
            `).join('');
        } else {
            wordsContainer.innerHTML = '<p class="text-muted">No hay palabras procesadas</p>';
        }
        
        // Mostrar contenido
        const contentContainer = document.getElementById('modalContent');
        if (doc.content) {
            contentContainer.textContent = doc.content.substring(0, 1000) + 
                (doc.content.length > 1000 ? '...' : '');
        } else {
            contentContainer.textContent = 'No hay contenido disponible';
        }
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('documentModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error cargando detalles:', error);
        showError('Error cargando detalles del documento');
    }
}

// Procesar todos los PDFs
async function processAllPdfs() {
    const button = event.target;
    const originalText = button.innerHTML;
    
    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Procesando...';
        
        const response = await fetch('/api/pdfs/process', { method: 'POST' });
        const result = await response.json();
        
        showSuccess('PDFs procesados exitosamente');
        loadDocuments();
        loadStats();
        
    } catch (error) {
        console.error('Error procesando PDFs:', error);
        showError('Error procesando PDFs');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Cargar estadísticas
async function loadStats() {
    try {
        const response = await fetch('/api/pdfs/stats/overview');
        const stats = await response.json();
        
        // Contar documentos por estado
        const statusCounts = {};
        stats.statusStats.forEach(item => {
            statusCounts[item._id] = item.count;
        });
        
        document.getElementById('totalDocs').textContent = 
            Object.values(statusCounts).reduce((a, b) => a + b, 0);
        document.getElementById('completedDocs').textContent = statusCounts.completed || 0;
        document.getElementById('pendingDocs').textContent = 
            (statusCounts.pending || 0) + (statusCounts.processing || 0);
        document.getElementById('totalWords').textContent = 
            stats.wordStats.totalWords || 0;
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Utilidades
function getStatusBadge(status) {
    const badges = {
        'completed': '<span class="badge bg-success status-badge">Completado</span>',
        'pending': '<span class="badge bg-warning status-badge">Pendiente</span>',
        'processing': '<span class="badge bg-info status-badge">Procesando</span>',
        'error': '<span class="badge bg-danger status-badge">Error</span>'
    };
    return badges[status] || '<span class="badge bg-secondary status-badge">Desconocido</span>';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'danger');
}

function showNotification(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
} 