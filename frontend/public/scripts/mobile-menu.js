// ===============================
// Mobile Menu Handler
// ===============================
  // 🎯 SIDEBAR COLLAPSE
  const sidebar = document.querySelector(".app-sidebar");
  const toggleBtn = document.getElementById('toggleBtn');
  toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));

// Ejecutar inmediatamente para evitar retrasos
(function() {
  // Crear botón hamburguesa para móviles
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.className = 'mobile-menu-btn';
  mobileMenuBtn.innerHTML = '☰';
  mobileMenuBtn.setAttribute('aria-label', 'Abrir menú de navegación');
  mobileMenuBtn.style.cssText = `
    display: none;
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1001;
    background: #2a2a2a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 24px;
    padding: 10px 15px;
    border-radius: 8px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    line-height: 1;
  `;

  // Crear overlay para cerrar sidebar
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  `;

  // Insertar elementos en el DOM
  document.body.insertBefore(mobileMenuBtn, document.body.firstChild);
  document.body.insertBefore(overlay, document.body.firstChild);

  // Función para verificar si es móvil
  const isMobile = () => window.innerWidth <= 768;

  // Función para mostrar/ocultar botón hamburguesa
  const updateMobileButton = () => {
    if (isMobile()) {
      mobileMenuBtn.style.display = 'block';
    } else {
      mobileMenuBtn.style.display = 'none';
    }
  };

  // Ejecutar al cargar
  updateMobileButton();

  // Ejecutar en resize
  window.addEventListener('resize', updateMobileButton);

  // Esperar a que el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');

    if (!sidebar) {
      console.error('Sidebar no encontrado');
      return;
    }

    // Función para abrir sidebar en móvil
    const openMobileSidebar = () => {
      if (isMobile()) {
        sidebar.classList.add('mobile-open');
        sidebar.classList.remove('collapsed');
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
      }
    };

    // Función para cerrar sidebar en móvil
    const closeMobileSidebar = () => {
      sidebar.classList.remove('mobile-open');
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    };

    // Toggle desktop (collapse/expand)
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isMobile()) {
          // En móvil, cierra el sidebar
          closeMobileSidebar();
        } else {
          // En desktop, colapsa/expande el sidebar
          sidebar.classList.toggle('collapsed');
          
          // Guardar estado en localStorage (opcional)
          const isCollapsed = sidebar.classList.contains('collapsed');
          localStorage.setItem('sidebarCollapsed', isCollapsed);
        }
      });
    }

    // Restaurar estado del sidebar al cargar (opcional)
    if (!isMobile()) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState === 'true') {
        sidebar.classList.add('collapsed');
      }
    }

    // Botón hamburguesa móvil - ABRIR
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openMobileSidebar();
    });

    // Cerrar al hacer click en overlay
    overlay.addEventListener('click', closeMobileSidebar);

    // Cerrar al hacer click en un nav-item en móvil
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (isMobile()) {
          setTimeout(closeMobileSidebar, 200);
        }
      });
    });

    // Ajustar en resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!isMobile()) {
          closeMobileSidebar();
          sidebar.classList.remove('mobile-open');
        }
        updateMobileButton();
      }, 250);
    });

    // Cerrar con tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMobile() && sidebar.classList.contains('mobile-open')) {
        closeMobileSidebar();
      }
    });

    // Prevenir scroll cuando el sidebar está abierto en móvil
    sidebar.addEventListener('touchmove', (e) => {
      if (isMobile() && sidebar.classList.contains('mobile-open')) {
        e.stopPropagation();
      }
    }, { passive: true });

  });
})();