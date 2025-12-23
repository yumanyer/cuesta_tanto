
# **Proyecto: Cuánto Cuesta**

### **Descripción General**
**Cuánto Cuesta** es una aplicación web diseñada para el cálculo preciso del **costo real de recetas e ingredientes**, facilitando el control de precios y porciones en productos gastronómicos. El sistema permite a los usuarios ingresar ingredientes, cantidades y precios de compra para determinar automáticamente el costo total de una producción y el costo por porción. Está especialmente dirigida a **emprendedores gastronómicos, panaderías y cocineros independientes** que buscan profesionalizar su gestión de costos.

### **Motivación y Objetivo**
El proyecto surge al detectar que muchos productores calculan sus precios "a ojo" o con herramientas no adaptadas al rubro. El objetivo principal es ofrecer una herramienta **gratuita, rápida e intuitiva** que permita a las personas ponerle un valor real a su trabajo basándose en datos precisos.

---

### **Funcionalidades Clave**
*   **Gestión de Recetas:** Permite crear, modificar, visualizar y eliminar recetas completas.
*   **Gestión de Materias Primas:** Control detallado de ingredientes con sus respectivos precios, unidades y stock.
*   **Cálculo Automático:** Determinación inmediata del precio total y costo por porción en función de los ingredientes utilizados.
*   **Autenticación de Usuarios:** Sistema de registro e inicio de sesión seguro para proteger la información de cada usuario.
*   **Interfaz Dinámica:** Notificaciones visuales (tipo toast) ante cambios en los datos y diseño adaptable a dispositivos móviles y escritorio.

---

### **Arquitectura Técnica**

El proyecto se divide en dos componentes principales que se comunican a través de una **API RESTful**:

#### **1. Frontend**
*   **Tecnologías:** Desarrollado con **HTML, CSS (procesado con SCSS) y JavaScript puro (Vanilla)** para mantener la ligereza del sitio.
*   **Características:** Lógica de presentación modular, validación de formularios en el cliente y actualizaciones dinámicas mediante `fetch()` sin recargar la página.

#### **2. Backend**
*   **Tecnologías:** Construido sobre **Node.js** utilizando el framework **Express.js**.
*   **Seguridad:** Implementa **JWT (JSON Web Tokens)** para la gestión de sesiones y `bcrypt` para el hash de contraseñas.
*   **Base de Datos:** Utiliza **PostgreSQL**, gestionando tipos enumerados para medidas y roles de usuario (Admin/Pastelero), además de triggers para la actualización automática de precios.

---

### **Instalación y Ejecución**

#### **Backend**
1. Clonar el repositorio y navegar a la carpeta: `git clone https://github.com/yumanyer/cuanto_cuesta`.
2. Instalar dependencias: `npm install`.
3. Configurar el archivo `.env` con las credenciales de la base de datos y el secreto JWT.
4. Iniciar el servidor: `npm run app` (o `npm run dev` para desarrollo).

#### **Frontend**
1. Clonar el repositorio: `git clone https://github.com/yumanyer/cuanto_cuesta_front`.
2. Instalar dependencias y compilar estilos: `npm install` seguido de `npm run sass`.
3. Servir el directorio `/public` mediante un servidor web estático.

---

### **Despliegue**
La aplicación se encuentra desplegada y operativa las 24 horas en la plataforma **Render**:
*   **URL:** [https://cuesta-tanto.onrender.com/](https://cuesta-tanto.onrender.com/)
*   El entorno incluye el servidor de Node.js, la base de datos PostgreSQL y el servicio de archivos estáticos para el frontend.
