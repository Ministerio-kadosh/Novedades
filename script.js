// Script para asistencia con Google Apps Script y diseño responsive
window.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('asistencia-form');
    const input = document.getElementById('nombre');
    const telefonoInput = document.getElementById('telefono');
    const tipoPersonaSelect = document.getElementById('tipo-persona');
    const lista = document.getElementById('lista-asistentes');

    // --- SUPABASE CONFIGURACIÓN ---
    const supabaseUrl = 'https://vztpbpontffuawntmixp.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dHBicG9udGZmdWF3bnRtaXhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTMwOTQsImV4cCI6MjA2NzA4OTA5NH0.6CbDGLtfr493dJFXRNPczMW2oGms9JOO7QLAsgakdvs';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // --- Estado ---
    let asistentes = [];
    let isLoading = false;

    // Inicializar la aplicación
    initApp();

    // Efecto de partículas al cargar
    createParticleEffect();

    // Formatear teléfono automáticamente
    telefonoInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // Solo números
        if (value.length > 15) value = value.slice(0, 15); // Máximo 15 dígitos
        
        // Formatear según la longitud
        if (value.length >= 7) {
            if (value.length <= 10) {
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
            } else {
                value = value.replace(/(\d{3})(\d{3})(\d{4})(\d{1,5})/, '$1-$2-$3-$4');
            }
        }
        
        e.target.value = value;
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isLoading) return;
        
        const nombre = input.value.trim();
        const telefono = telefonoInput.value.trim();
        const tipoPersona = tipoPersonaSelect.value;
        
        // Validación del nombre
        if (!nombre || nombre.length < 2) {
            showMessage('Por favor ingresa un nombre válido (mínimo 2 caracteres)', 'error');
            input.focus();
            return;
        }
        if (nombre.length > 50) {
            showMessage('El nombre es demasiado largo (máximo 50 caracteres)', 'error');
            input.focus();
            return;
        }
        
        // Validación del teléfono
        if (!telefono) {
            showMessage('Por favor ingresa tu teléfono', 'error');
            telefonoInput.focus();
            return;
        }
        const telefonoLimpio = telefono.replace(/\D/g, '');
        if (telefonoLimpio.length < 7 || telefonoLimpio.length > 15) {
            showMessage('Por favor ingresa un teléfono válido (7-15 dígitos)', 'error');
            telefonoInput.focus();
            return;
        }
        
        // Validación del tipo de persona
        if (!tipoPersona) {
            showMessage('Por favor selecciona si eres miembro o amigo', 'error');
            tipoPersonaSelect.focus();
            return;
        }
        
        // Verificar duplicados (case insensitive)
        const existe = asistentes.find(a => a.nombre.toLowerCase().trim() === nombre.toLowerCase());
        if (existe) {
            showMessage('¡Ya estás registrado!', 'info');
            input.focus();
            return;
        }
        
        isLoading = true;
        showLoading(true);
        
        // Insertar en Supabase
        const { data, error } = await supabase.from('asistentes').insert([{ 
            nombre: nombre,
            telefono: telefonoLimpio,
            tipo_persona: tipoPersona
        }]);
        
        if (error) {
            showMessage('Error al registrar: ' + error.message, 'error');
        } else {
            showMessage('¡Registrado!', 'success');
            input.value = '';
            telefonoInput.value = '';
            tipoPersonaSelect.value = '';
            await cargarAsistentes();
        }
        isLoading = false;
        showLoading(false);
    });

    async function initApp() {
        showLoading(true);
        try {
            await cargarAsistentes();
        } catch (error) {
            console.error('Error al cargar asistentes:', error);
            showMessage('Error al cargar datos', 'error');
        } finally {
            showLoading(false);
        }
    }

    async function cargarAsistentes() {
        isLoading = true;
        showLoading(true);
        const { data, error } = await supabase.from('asistentes').select('*').order('nombre', { ascending: true });
        if (error) {
            showMessage('Error al cargar asistentes: ' + error.message, 'error');
            asistentes = [];
        } else {
            asistentes = data || [];
        }
        renderAsistentes();
        isLoading = false;
        showLoading(false);
    }

    function renderAsistentes() {
        lista.innerHTML = '';
        // Eliminar mensaje vacío residual
        const emptyMsg = document.querySelector('.empty-message');
        if (emptyMsg && emptyMsg.parentNode) {
            emptyMsg.parentNode.removeChild(emptyMsg);
        }
        if (asistentes.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.innerHTML = `
                <div>
                    <i class="fas fa-users"></i>
                    <p>No hay asistentes registrados aún</p>
                    <small>¡Sé el primero en registrarte!</small>
                </div>
            `;
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '20px';
            emptyMessage.style.color = '#666';
            lista.appendChild(emptyMessage);
        } else {
            asistentes.forEach(asistente => {
                const li = document.createElement('li');
                const tipoIcon = asistente.tipo_persona === 'miembro' ? 'fas fa-church' : 'fas fa-user-friends';
                const tipoText = asistente.tipo_persona === 'miembro' ? 'Miembro' : 'Amigo';
                
                // Formatear teléfono para mostrar
                let telefonoFormateado = 'N/A';
                if (asistente.telefono) {
                    const telefonoLimpio = asistente.telefono.toString().replace(/\D/g, '');
                    if (telefonoLimpio.length >= 7) {
                        if (telefonoLimpio.length <= 10) {
                            telefonoFormateado = telefonoLimpio.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                        } else {
                            telefonoFormateado = telefonoLimpio.replace(/(\d{3})(\d{3})(\d{4})(\d{1,5})/, '$1-$2-$3-$4');
                        }
                    } else {
                        telefonoFormateado = telefonoLimpio;
                    }
                }
                
                li.innerHTML = `
                    <div class="asistente-item">
                        <div class="asistente-info">
                            <span class="asistente-nombre">${asistente.nombre}</span>
                            <span class="asistente-telefono"><i class="fas fa-phone"></i> ${telefonoFormateado}</span>
                            <span class="asistente-tipo"><i class="${tipoIcon}"></i> ${tipoText}</span>
                        </div>
                        <button class="delete-btn" onclick="eliminarAsistente('${asistente.id}')" title="Eliminar ${asistente.nombre}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                lista.appendChild(li);
            });
        }
        updateAsistentesCounter();
    }

    // --- Eliminar Asistente ---
    window.eliminarAsistente = async function(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este asistente?')) return;
        isLoading = true;
        showLoading(true);
        const { error } = await supabase.from('asistentes').delete().eq('id', id);
        if (error) {
            showMessage('Error al eliminar: ' + error.message, 'error');
        } else {
            showMessage('Asistente eliminado', 'success');
            await cargarAsistentes();
        }
        isLoading = false;
        showLoading(false);
    };

    // --- Contador de asistentes ---
    function updateAsistentesCounter() {
        const titleElement = document.querySelector('.asistentes-container h3');
        if (titleElement) {
            titleElement.innerHTML = `<i class="fas fa-list"></i> Asistentes (${asistentes.length})`;
        }
    }

    function showLoading(show) {
        const button = form.querySelector('button');
        const icon = button.querySelector('i');
        if (show) {
            button.disabled = true;
            icon.className = 'fas fa-spinner fa-spin';
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
        } else {
            button.disabled = false;
            icon.className = 'fas fa-check';
            button.innerHTML = '<i class="fas fa-check"></i> ¡Estoy presente!';
        }
    }

    function createParticleEffect() {
        const particles = document.querySelector('.particles');
        for(let i = 0; i < 5; i++) {
            setTimeout(() => {
                const particle = document.createElement('i');
                particle.className = 'fas fa-heart';
                particle.style.position = 'absolute';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.color = 'rgba(255,255,255,0.2)';
                particle.style.fontSize = '15px';
                particle.style.animation = 'float 4s ease-in-out infinite';
                particles.appendChild(particle);
                
                setTimeout(() => {
                    particle.remove();
                }, 4000);
            }, i * 800);
        }
    }

    function celebrateAsistencia() {
        // Crear confeti
        for(let i = 0; i < 20; i++) {
            setTimeout(() => {
                createConfeti();
            }, i * 100);
        }
        
        showMessage('¡Bienvenido! Dios te bendiga', 'success');
    }

    function createConfeti() {
        const confeti = document.createElement('div');
        confeti.style.position = 'fixed';
        confeti.style.left = Math.random() * 100 + '%';
        confeti.style.top = '-10px';
        confeti.style.width = '10px';
        confeti.style.height = '10px';
        confeti.style.background = ['#FF9800', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722'][Math.floor(Math.random() * 5)];
        confeti.style.borderRadius = '50%';
        confeti.style.pointerEvents = 'none';
        confeti.style.zIndex = '9999';
        confeti.style.animation = 'confetiFall 3s linear forwards';
        
        document.body.appendChild(confeti);
        
        setTimeout(() => {
            confeti.remove();
        }, 3000);
    }

    function showMessage(text, type) {
        const message = document.createElement('div');
        message.textContent = text;
        message.style.position = 'fixed';
        message.style.top = '20px';
        message.style.right = '20px';
        message.style.padding = '15px 25px';
        message.style.borderRadius = '25px';
        message.style.color = '#fff';
        message.style.fontWeight = 'bold';
        message.style.zIndex = '10000';
        message.style.transform = 'translateX(100%)';
        message.style.transition = 'all 0.5s ease';
        message.style.maxWidth = '300px';
        message.style.wordWrap = 'break-word';
        
        if(type === 'success') {
            message.style.background = 'linear-gradient(135deg, #4CAF50, #66BB6A)';
        } else if(type === 'info') {
            message.style.background = 'linear-gradient(135deg, #2196F3, #42A5F5)';
        } else if(type === 'error') {
            message.style.background = 'linear-gradient(135deg, #F44336, #E53935)';
        }
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            message.style.transform = 'translateX(100%)';
            setTimeout(() => {
                message.remove();
            }, 500);
        }, 3000);
    }

    // Efectos hover en iconos sociales
    const socialIcons = document.querySelectorAll('.social-icons i');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.3) rotate(10deg)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // Efecto de escritura en el título
    const title = document.querySelector('header h1');
    if(title) {
        const originalText = title.textContent;
        title.textContent = '';
        let i = 0;
        
        function typeWriter() {
            if (i < originalText.length) {
                title.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        }
        
        setTimeout(typeWriter, 1000);
    }

    // Manejo responsive
    function handleResize() {
        const isMobile = window.innerWidth <= 768;
        const isTablet = window.innerWidth <= 1024;
        
        // Ajustar tamaños de fuente
        const root = document.documentElement;
        if (isMobile) {
            root.style.setProperty('--font-size-base', '14px');
            root.style.setProperty('--font-size-large', '1.2em');
            root.style.setProperty('--font-size-xlarge', '1.5em');
        } else if (isTablet) {
            root.style.setProperty('--font-size-base', '16px');
            root.style.setProperty('--font-size-large', '1.4em');
            root.style.setProperty('--font-size-xlarge', '1.8em');
        } else {
            root.style.setProperty('--font-size-base', '16px');
            root.style.setProperty('--font-size-large', '1.6em');
            root.style.setProperty('--font-size-xlarge', '2em');
        }
    }

    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', handleResize);
    handleResize(); // Ejecutar al cargar

    // Bloquear clic derecho y teclas de inspección
    window.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showMessage('Inspeccionar código está deshabilitado', 'error');
    });

    window.addEventListener('keydown', function(e) {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Cmd+Opt+I (Mac)
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'U') ||
            (e.ctrlKey && e.key === 'S') ||
            (e.metaKey && e.altKey && e.key.toLowerCase() === 'i')
        ) {
            e.preventDefault();
            showMessage('Inspeccionar código está deshabilitado', 'error');
            return false;
        }
    });
});

// Agregar estilos CSS para animaciones adicionales y responsive
const style = document.createElement('style');
style.textContent = `
    @keyframes confetiFall {
        0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    .Novedad:hover {
        transform: scale(1.02);
        transition: transform 0.3s ease;
    }
    
    .asistencia:hover {
        transform: translateY(-5px);
        transition: transform 0.3s ease;
    }
    
    .verse-header:hover {
        transform: scale(1.05);
        transition: transform 0.3s ease;
    }

    .asistente-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }

    .asistente-info {
        display: flex;
        flex-direction: column;
        gap: 5px;
        flex: 1;
    }

    .asistente-nombre {
        font-weight: 600;
        font-size: 1.1em;
        color: #00796B;
    }

    .asistente-telefono {
        font-size: 0.9em;
        color: #666;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .asistente-telefono i {
        color: #4CAF50;
        font-size: 0.8em;
    }

    .asistente-tipo {
        font-size: 0.8em;
        color: #FF9800;
        display: flex;
        align-items: center;
        gap: 5px;
        font-weight: 500;
    }

    .asistente-tipo i {
        font-size: 0.9em;
    }

    .delete-btn {
        background: none;
        border: none;
        color: #F44336;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        transition: all 0.3s ease;
        font-size: 0.9em;
    }

    .delete-btn:hover {
        background: #F44336;
        color: white;
        transform: scale(1.1);
        box-shadow: 0 2px 8px rgba(244,67,54,0.3);
    }

    /* Variables CSS para responsive */
    :root {
        --font-size-base: 16px;
        --font-size-large: 1.6em;
        --font-size-xlarge: 2em;
    }

    /* Responsive mejorado */
    @media (max-width: 480px) {
        .Novedad {
            width: 95%;
            height: auto;
            min-height: 500px;
            padding: 15px;
        }
        
        .Parrafo_uno, .Parrafo_dos {
            width: 95%;
            font-size: 1.2em;
            padding: 15px;
        }
        
        .asistencia {
            margin: 20px 10px;
            padding: 25px 15px;
        }
        
        header h1 {
            font-size: 1.8em;
        }
        
        .verse-header h1 {
            font-size: 1.3em;
        }
        
        .verse-header {
            padding: 10px 15px;
            gap: 10px;
        }
        
        .verse-header i {
            font-size: 1.2em;
        }
        
        .social-icons {
            gap: 15px;
        }
        
        .social-icons i {
            font-size: 1.5em;
        }
        
        .asistente-item {
            flex-direction: column;
            gap: 8px;
            text-align: center;
        }
        
        .asistente-info {
            gap: 3px;
        }
        
        .asistente-nombre {
            font-size: 1em;
        }
        
        .asistente-telefono {
            font-size: 0.8em;
        }
        
        .asistente-tipo {
            font-size: 0.7em;
        }
    }

    @media (max-width: 768px) {
        .Novedad {
            width: 90%;
            height: auto;
            min-height: 600px;
        }
        
        .Parrafo_uno, .Parrafo_dos {
            width: 90%;
            font-size: 1.4em;
        }
        
        .asistencia {
            margin: 20px;
            padding: 30px 20px;
        }
        
        header h1 {
            font-size: 2em;
        }
        
        .verse-header h1 {
            font-size: 1.5em;
        }
    }

    @media (max-width: 1024px) {
        .Novedad {
            width: 80%;
        }
        
        .Parrafo_uno, .Parrafo_dos {
            width: 80%;
        }
    }
`;
document.head.appendChild(style);
