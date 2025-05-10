# Sistema de Solicitudes Bodega-Fabricación

Este es un sistema web para gestionar solicitudes entre los departamentos de bodega y fabricación. La aplicación permite a los usuarios crear solicitudes, actualizar su estado y visualizar el historial de cambios.

## Estructura del Proyecto

El proyecto ha sido reorganizado siguiendo un patrón modular para facilitar su mantenimiento:

```
proyecto-solicitudes/
├── index.html              // Archivo HTML principal
├── css/
│   └── styles.css          // Estilos CSS separados del HTML
├── js/
│   ├── config.js           // Configuración de Firebase
│   ├── app.js              // Lógica principal de la aplicación
│   ├── auth.js             // Gestión de autenticación y roles
│   ├── bodega.js           // Funciones específicas del panel de bodega
│   ├── fabricacion.js      // Funciones específicas del panel de fabricación
│   ├── admin.js            // Funciones específicas del panel de administración
│   ├── utils.js            // Funciones de utilidad (formateo de fechas, etc.)
│   └── components/
│       ├── modals.js       // Gestión de modales
│       └── ui.js           // Funciones comunes de UI
```

## Implementación

Para implementar esta nueva estructura, sigue estos pasos:

1. Crea las carpetas necesarias:
   - `/css`
   - `/js`
   - `/js/components`

2. Copia cada archivo a su ubicación correspondiente.

3. Asegúrate de que el archivo `index.html` cargue todos los scripts JavaScript en el orden correcto:
   - Primero, las bibliotecas externas (Firebase, Bootstrap)
   - Después, los scripts internos en el siguiente orden:
     - `config.js`
     - `utils.js`
     - `auth.js`
     - `bodega.js`
     - `fabricacion.js`
     - `admin.js`
     - `components/modals.js`
     - `components/ui.js`
     - `app.js` (este debe ser el último ya que depende de todos los demás)

## Ventajas de esta estructura

1. **Mejor organización**: Separar el código por funcionalidad facilita encontrar y mantener cada parte.

2. **Modularidad**: Cada archivo tiene una responsabilidad específica, lo que mejora la legibilidad.

3. **Escalabilidad**: Es más fácil agregar nuevas funcionalidades sin afectar el código existente.

4. **Mantenimiento**: Cuando se necesite realizar cambios, solo habrá que modificar los archivos relevantes.

5. **Colaboración**: Diferentes desarrolladores pueden trabajar en diferentes módulos sin conflictos.

## Consideraciones futuras

A medida que el sistema crezca, se pueden implementar mejoras adicionales:

- Implementar un sistema de módulos ES6 (import/export)
- Añadir un bundler como Webpack o Parcel
- Implementar un framework como React o Vue para los componentes de UI
- Agregar pruebas unitarias y de integración
