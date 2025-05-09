# Sistema de Solicitudes Bodega-Fabricación

Este sistema permite gestionar solicitudes desde bodega a fabricación, con seguimiento de estado y acceso según roles de usuario.

## Características Principales

- **Tres roles de usuario**: Bodega, Fabricación y Administrador
- **Formulario de solicitud**: Bodega puede enviar solicitudes con nota de venta, fecha y detalle de productos
- **Panel de fabricación**: Para actualizar estados y agregar observaciones
- **Panel de administrador**: Con acceso completo para modificar cualquier campo
- **Historial de cambios**: Registro de todas las modificaciones con fechas
- **Almacenamiento en GitHub**: Los datos se guardan en archivos JSON en un repositorio de GitHub

## Tecnologías Utilizadas

- HTML5, CSS3 y JavaScript
- Bootstrap 5 para el diseño responsivo
- GitHub Pages para el hosting
- GitHub API para el almacenamiento de datos

## Estructura de Archivos

- **index.html**: Página principal con la estructura del sistema
- **styles.css**: Estilos CSS para la interfaz de usuario
- **auth.js**: Manejo de autenticación con GitHub
- **database.js**: Manejo de datos con GitHub API
- **bodega.js**: Funcionalidad para el rol de bodega
- **fabricacion.js**: Funcionalidad para el rol de fabricación
- **admin.js**: Funcionalidad para el rol de administrador

## Instalación y Configuración

1. **Crear un repositorio en GitHub**:
   - Crear un nuevo repositorio llamado "sistema-solicitudes-datos"
   - Habilitar GitHub Pages en la rama principal

2. **Configurar OAuth en GitHub**:
   - Registrar una nueva aplicación OAuth en GitHub Developer Settings
   - Obtener el Client ID y el Client Secret
   - Configurar la URL de redirección a la URL de tu GitHub Pages

3. **Configurar el sistema**:
   - Reemplazar `YOUR_GITHUB_CLIENT_ID` en auth.js con tu Client ID
   - Reemplazar `YOUR_GITHUB_USERNAME` en database.js con tu usuario de GitHub

4. **Subir archivos**:
   - Subir todos los archivos al repositorio creado
   - Crear un archivo `solicitudes.json` inicial con un array vacío `[]`
   - Crear un archivo `historico.json` inicial con un array vacío `[]`

## Uso del Sistema

### Rol de Bodega

1. **Crear una nueva solicitud**:
   - Ingresar nota de venta y fecha
   - Agregar productos y cantidades
   - Enviar la solicitud

2. **Ver historial de solicitudes**:
   - Consultar el estado actual de las solicitudes enviadas
   - Ver el detalle de cada solicitud

### Rol de Fabricación

1. **Actualizar estado de solicitudes**:
   - Cambiar el estado a "En fabricación" o "Entregado"
   - Agregar observaciones cuando sea necesario

2. **Ver detalles**:
   - Consultar la información completa de cada solicitud
   - Ver el historial de cambios de estado

### Rol de Administrador

1. **Gestión completa**:
   - Acceso a todas las solicitudes
   - Capacidad para editar cualquier campo
   - Monitoreo del historial de cambios

## Flujo de Trabajo

1. **Bodega** crea una solicitud con estado inicial "Solicitud enviada por bodega"
2. **Fabricación** actualiza el estado a "En fabricación" cuando comienza a trabajar en la solicitud
3. **Fabricación** puede agregar observaciones si hay pendientes por materiales u otros motivos
4. **Fabricación** actualiza el estado a "Entregado" cuando completa la solicitud
5. **Administrador** puede intervenir en cualquier momento para corregir información si es necesario

## Personalización y Mejoras Posibles

1. **Autenticación real con GitHub**:
   - Implementar el flujo completo de OAuth con GitHub
   - Asociar roles a usuarios reales en una base de datos

2. **Almacenamiento real en GitHub**:
   - Implementar las funciones para leer y escribir archivos en GitHub
   - Usar el API de GitHub para gestionar los datos

3. **Funcionalidades adicionales**:
   - Búsqueda y filtrado de solicitudes
   - Exportación de datos a CSV o PDF
   - Notificaciones por correo electrónico
   - Subida de archivos adjuntos a las solicitudes

## Soporte

Para problemas o mejoras, crear un Issue en el repositorio de GitHub.

---

Esta aplicación es un ejemplo y no debe usarse en producción sin implementar adecuadamente la autenticación y el almacenamiento real de datos.