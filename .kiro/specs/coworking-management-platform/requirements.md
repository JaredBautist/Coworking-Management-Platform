# Requirements Document

## Introduction

Este documento define los requerimientos funcionales del **frontend** de la Plataforma de Gestión de Coworking, un SaaS Enterprise que permite a organizaciones administrar sus espacios de trabajo compartido. La plataforma atiende dos roles principales: el `office_manager`, que administra espacios y supervisa la utilización, y el `member`, que reserva y gestiona sus propios espacios. El backend está implementado en Supabase (PostgreSQL + Auth + RLS), por lo que el frontend se integra directamente con sus APIs.

---

## Glossary

- **App**: La aplicación frontend de la Plataforma de Gestión de Coworking.
- **Auth_Module**: Módulo responsable del flujo de autenticación con Supabase Auth.
- **Dashboard**: Vista principal diferenciada por rol que se muestra tras el login.
- **Space_Manager**: Módulo de gestión de espacios disponible para el rol `office_manager`.
- **Reservation_System**: Módulo para buscar disponibilidad y gestionar reservas.
- **Calendar_View**: Vista de calendario que muestra disponibilidad y reservas en tiempo real.
- **Report_Module**: Módulo de reporting y utilización basado en la vista `space_utilization`.
- **Team_Manager**: Módulo de gestión del equipo disponible para el rol `office_manager`.
- **Space**: Espacio físico disponible para reserva (escritorio, sala de reuniones, cabina telefónica, espacio para eventos).
- **Reservation**: Registro de una reserva de un espacio por un usuario en un intervalo de tiempo.
- **office_manager**: Rol con permisos completos de administración dentro de una organización.
- **member**: Rol que puede reservar espacios y gestionar sus propias reservas.
- **Tenant**: Organización dentro del sistema multi-tenant.
- **RLS**: Row Level Security — política de seguridad a nivel de fila configurada en Supabase que limita el acceso a datos por organización.
- **space_utilization**: Vista de Supabase que agrega reservas y horas reservadas por espacio en los últimos 30 días.

---

## Requirements

### Requirement 1: Autenticación y Acceso

**User Story:** Como usuario de la plataforma, quiero poder iniciar sesión y cerrar sesión de forma segura, para que pueda acceder a las funcionalidades según mi rol sin comprometer la información de mi organización.

#### Acceptance Criteria

1. THE Auth_Module SHALL mostrar un formulario de inicio de sesión con campos de correo electrónico y contraseña.
2. WHEN el usuario envía credenciales válidas, THE Auth_Module SHALL autenticar al usuario mediante Supabase Auth y redirigirlo al Dashboard correspondiente a su rol (`office_manager` al dashboard de administración, `member` al dashboard de miembro).
3. IF el usuario envía credenciales incorrectas, THEN THE Auth_Module SHALL mostrar un mensaje de error genérico (p.ej. "Credenciales inválidas") dentro de 1 segundo, sin indicar qué campo específico es incorrecto.
4. WHEN el usuario permanece inactivo durante 60 minutos consecutivos, THE Auth_Module SHALL invalidar la sesión local, limpiar el estado de sesión y redirigir al usuario a la pantalla de inicio de sesión.
5. THE Auth_Module SHALL mantener la sesión activa entre recargas de página mediante el token de sesión almacenado por Supabase Auth.
6. WHEN el usuario solicita cerrar sesión, THE Auth_Module SHALL invocar `supabase.auth.signOut()` y redirigir a la pantalla de inicio de sesión; la limpieza del estado de sesión local es implícita al completarse la redirección.
7. THE Auth_Module SHALL mostrar un enlace de recuperación de contraseña en la pantalla de login. WHEN el usuario envía el formulario de recuperación con un correo válido, THE Auth_Module SHALL invocar el flujo de restablecimiento de Supabase Auth y mostrar una confirmación de envío.
8. IF un usuario no autenticado intenta acceder a cualquier ruta que requiera autenticación, THEN THE App SHALL redirigirlo a la pantalla de inicio de sesión.
9. IF el usuario introduce credenciales incorrectas 5 veces consecutivas, THEN THE Auth_Module SHALL bloquear el formulario durante 5 minutos y mostrar un mensaje indicando el tiempo de espera restante.

---

### Requirement 2: Onboarding y Configuración Inicial

**User Story:** Como `office_manager` recién registrado, quiero completar la configuración inicial de mi organización, para que mi equipo pueda comenzar a usar la plataforma de inmediato.

#### Acceptance Criteria

1. WHEN un `office_manager` inicia sesión por primera vez y su organización no tiene espacios configurados, THE App SHALL mostrar un flujo de onboarding de exactamente 2 pasos: (1) configuración del nombre de la organización y (2) creación del primer espacio.
2. THE App SHALL requerir que el nombre de la organización tenga entre 2 y 100 caracteres. IF el valor ingresado no cumple este rango, THEN THE App SHALL mostrar un mensaje de error inline antes de permitir avanzar al paso 2.
3. THE App SHALL requerir que el primer espacio tenga al menos nombre (entre 2 y 100 caracteres) y tipo seleccionado. IF alguno de estos campos es inválido, THEN THE App SHALL mostrar mensajes de error inline sin avanzar.
4. IF la creación del primer espacio falla por un error del servidor, THEN THE App SHALL mostrar un mensaje de error descriptivo, conservar los datos ingresados en el formulario y permitir al usuario reintentar sin perder la información.
5. WHEN el onboarding se completa con éxito, THE App SHALL redirigir al `office_manager` al Dashboard principal.
6. IF el `office_manager` cierra la sesión o la sesión expira antes de completar el onboarding, THEN THE App SHALL retomar el flujo de onboarding en el último paso completado la próxima vez que inicie sesión, en lugar de reiniciarlo desde el paso 1.
7. IF el usuario autenticado tiene rol `member` y su organización tiene al menos un espacio configurado, THEN THE App SHALL omitir el flujo de onboarding y redirigir directamente al Dashboard. IF el usuario autenticado tiene rol `office_manager` y su organización no tiene espacios configurados, THEN THE App SHALL mostrar el flujo de onboarding en cada inicio de sesión hasta que exista al menos un espacio configurado.

---

### Requirement 3: Dashboard Principal

**User Story:** Como usuario de la plataforma, quiero ver un resumen relevante al iniciar sesión, para que pueda tomar decisiones rápidas sobre el uso del espacio.

#### Acceptance Criteria

1. WHEN un `office_manager` accede al Dashboard, THE Dashboard SHALL mostrar: total de espacios activos, número de reservas del día actual, tasa de ocupación del día (expresada como porcentaje con un decimal de precisión) y un enlace de acceso directo al módulo de reportes.
2. WHEN un `member` accede al Dashboard, THE Dashboard SHALL mostrar: sus próximas reservas ordenadas por `start_time` ascendente (máximo 5 en la vista inicial), un formulario de búsqueda rápida de disponibilidad y un enlace de acceso al Calendar_View.
3. WHEN se crea o cancela una reserva en cualquier sesión de la misma organización, THE Dashboard SHALL reflejar el cambio en las métricas de ocupación en un máximo de 5 segundos mediante suscripciones de Supabase Realtime, sin requerir recarga manual de la página.
4. THE Dashboard SHALL ser responsivo y funcionar correctamente en dispositivos con ancho de pantalla entre 320px y 1920px. En pantallas más anchas de 1920px, el comportamiento del layout no está garantizado.
5. THE Dashboard SHALL mostrar el nombre completo del usuario autenticado y su rol en la barra de navegación en todas las vistas de la aplicación.

---

### Requirement 4: Gestión de Espacios

**User Story:** Como `office_manager`, quiero crear, editar y desactivar espacios, para que el inventario de la plataforma refleje siempre la disponibilidad real de la oficina.

#### Acceptance Criteria

1. THE Space_Manager SHALL mostrar una lista paginada de todos los espacios de la organización con 25 ítems por página, incluyendo nombre, tipo, capacidad y estado activo/inactivo.
2. WHEN el `office_manager` crea un espacio nuevo, THE Space_Manager SHALL requerir: nombre (texto, máximo 100 caracteres), tipo (`desk`, `meeting_room`, `phone_booth`, `event_space`), capacidad (entero positivo entre 1 y 500) y estado activo.
3. WHEN el `office_manager` guarda un espacio nuevo con datos válidos, THE Space_Manager SHALL persistir el espacio en Supabase y mostrarlo en la lista sin recargar la página.
4. IF el `office_manager` intenta guardar un espacio (en creación o edición) con campos obligatorios vacíos o con valores fuera de rango, THEN THE Space_Manager SHALL mostrar mensajes de error de validación junto a cada campo inválido y bloquear la persistencia hasta que los errores sean corregidos.
5. WHEN el `office_manager` edita un espacio existente y guarda cambios válidos, THE Space_Manager SHALL pre-poblar el formulario con los datos actuales, persistir los cambios en Supabase y actualizar la lista sin recargar la página.
6. WHEN el `office_manager` desactiva un espacio (`is_active = false`) y confirma el diálogo de confirmación, THE Space_Manager SHALL marcar el espacio como inactivo, ocultarlo de los resultados de búsqueda de disponibilidad para nuevas reservas y mostrar una notificación de confirmación. El espacio permanece visible en los resultados de búsqueda hasta que el `office_manager` confirme la desactivación.
7. WHILE un espacio tiene reservas futuras confirmadas, THE Space_Manager SHALL mostrar un diálogo de confirmación que indique el número de reservas futuras afectadas y requiera confirmación explícita del `office_manager` antes de proceder con la desactivación.
8. WHEN el `office_manager` confirma la desactivación de un espacio con reservas futuras, THE Space_Manager SHALL cancelar automáticamente todas las reservas futuras confirmadas del espacio y notificar a los usuarios afectados mediante un indicador visual en su lista de reservas.
9. IF una operación de creación o edición de espacio falla por error del servidor, THEN THE Space_Manager SHALL mostrar un mensaje de error descriptivo, conservar los datos ingresados en el formulario y mantener la lista de espacios en su estado anterior sin alteraciones.
10. IF un usuario con rol `member` intenta acceder a la ruta de gestión de espacios, THEN THE App SHALL redirigirlo al Dashboard y mostrar un mensaje de acceso denegado.

---

### Requirement 5: Sistema de Reservas — Búsqueda de Disponibilidad

**User Story:** Como usuario de la plataforma, quiero buscar espacios disponibles por fecha, hora y tipo, para que pueda encontrar y reservar el espacio que mejor se adapte a mis necesidades.

#### Acceptance Criteria

1. THE Reservation_System SHALL proveer un formulario de búsqueda con los campos: fecha (selector de calendario), hora de inicio, hora de fin y tipo de espacio (opcional).
2. WHEN el usuario envía el formulario de búsqueda con fecha, hora de inicio y hora de fin válidos, THE Reservation_System SHALL mostrar únicamente los espacios activos para los que no exista ninguna reserva con `status = confirmed` que cumpla `existing_start < requested_end AND existing_end > requested_start`.
3. IF el usuario especifica una capacidad mínima requerida con un valor fuera del rango 1–999, THEN THE Reservation_System SHALL ignorar el filtro de capacidad y mostrar todos los espacios disponibles que cumplan los demás criterios.
4. WHEN el usuario ejecuta una búsqueda y no existen espacios disponibles para los criterios indicados, THE Reservation_System SHALL mostrar un mensaje indicando la ausencia de disponibilidad y sugerir hasta 3 franjas horarias alternativas dentro de ±24 horas que cumplan los demás filtros activos.
5. IF la hora de fin no es posterior a la hora de inicio, THEN THE Reservation_System SHALL mostrar un error inline junto al campo de hora de fin y bloquear la ejecución de la búsqueda.
6. IF la fecha seleccionada es anterior a la fecha actual del cliente, THEN THE Reservation_System SHALL mostrar un error inline junto al campo de fecha y bloquear la ejecución de la búsqueda.

---

### Requirement 6: Sistema de Reservas — Creación y Cancelación

**User Story:** Como usuario de la plataforma, quiero crear y cancelar mis reservas, para que pueda gestionar mi tiempo en la oficina de manera flexible.

#### Acceptance Criteria

1. WHEN el usuario selecciona un espacio disponible de los resultados de búsqueda, THE Reservation_System SHALL mostrar un panel de confirmación con los detalles de la reserva (nombre del espacio, fecha, hora de inicio, hora de fin, número de puestos de capacidad del espacio).
2. WHEN el usuario confirma la reserva, THE Reservation_System SHALL crear el registro en Supabase con `status = confirmed` y mostrar una notificación de confirmación visible durante al menos 3 segundos en el panel de confirmación.
3. IF el usuario decide no confirmar la reserva en el panel de confirmación, THEN THE Reservation_System SHALL cerrar el panel sin crear ningún registro y devolver al usuario a los resultados de búsqueda.
4. IF ocurre un conflicto de reserva entre la selección del usuario y otra reserva creada concurrentemente, THEN THE Reservation_System SHALL detectar el conflicto antes de ejecutar cualquier operación en la base de datos, bloquear la creación del registro y notificar al usuario que el espacio ya no está disponible, eliminando el espacio conflictivo de los resultados de búsqueda visibles.
5. WHEN un `member` cancela una de sus reservas con `start_time > fecha y hora actuales`, THE Reservation_System SHALL actualizar el `status` a `cancelled` en Supabase y reflejar el cambio en la lista de reservas del usuario sin recargar la página.
6. WHEN un `office_manager` cancela cualquier reserva de la organización con `start_time > fecha y hora actuales`, THE Reservation_System SHALL actualizar el `status` a `cancelled` en Supabase y reflejar el cambio en un máximo de 5 segundos en todas las sesiones activas de la organización.
7. IF el usuario intenta cancelar una reserva con `start_time` anterior o igual a la fecha y hora actuales, THEN THE Reservation_System SHALL rechazar la acción, no modificar el `status` en Supabase y mostrar un mensaje indicando que no es posible cancelar reservas pasadas o en curso.
8. THE Reservation_System SHALL mostrar al usuario una lista de sus reservas ordenadas por `start_time` ascendente (la más próxima primero), diferenciando próximas de pasadas, con opción de cancelación disponible únicamente para reservas con `status = confirmed` y `start_time > fecha y hora actuales`.

---

### Requirement 7: Vista de Calendario y Disponibilidad en Tiempo Real

**User Story:** Como usuario de la plataforma, quiero ver un calendario de disponibilidad de espacios, para que pueda identificar rápidamente huecos libres y planificar mis reservas.

#### Acceptance Criteria

1. WHEN el usuario accede al Calendar_View, THE Calendar_View SHALL mostrar las reservas confirmadas de la organización en una vista de calendario con modos de visualización: día, semana y mes.
2. WHEN el usuario cambia entre los modos de visualización (día/semana/mes), THE Calendar_View SHALL actualizar la vista en menos de 500ms sin recargar la página.
3. THE Calendar_View SHALL diferenciar visualmente las reservas del usuario autenticado (color A) de las reservas de otros miembros (color B), donde A y B son dos colores distintos con contraste WCAG AA entre sí y respecto al fondo.
4. WHEN se crea o cancela una reserva en cualquier sesión de la misma organización, THE Calendar_View SHALL reflejar el cambio en un máximo de 3 segundos mediante suscripciones de Supabase Realtime.
5. WHEN el usuario hace clic en una reserva del calendario, THE Calendar_View SHALL mostrar un panel lateral para todos los usuarios. WHERE el usuario tiene rol `office_manager`, el panel SHALL incluir: nombre del espacio, nombre completo del usuario que realizó la reserva, hora de inicio, hora de fin y estado de la reserva.
6. WHERE el usuario tiene rol `office_manager`, THE Calendar_View SHALL mostrar el nombre del usuario que realizó cada reserva en el panel de detalles.
7. WHERE el usuario tiene rol `member`, THE Calendar_View SHALL mostrar únicamente el tipo de espacio y el intervalo horario para reservas de otros miembros en el panel lateral, sin exponer nombre u otros datos personales del reservante.
8. THE Calendar_View SHALL resaltar visualmente los bloques de tiempo sin ninguna reserva confirmada dentro del horario laboral (08:00–20:00 hora local), permitiendo al usuario identificar disponibilidad de un vistazo.

---

### Requirement 8: Reporting y Dashboard de Utilización

**User Story:** Como `office_manager`, quiero acceder a reportes de utilización de espacios, para que pueda tomar decisiones informadas sobre la distribución y planificación de la oficina.

#### Acceptance Criteria

1. THE Report_Module SHALL mostrar una tabla de utilización por espacio consultando la vista `space_utilization` de Supabase, con columnas: nombre del espacio, tipo, total de reservas y horas reservadas; el período cubierto son los 30 días calendario contados hacia atrás desde la fecha actual en el servidor.
2. THE Report_Module SHALL mostrar una gráfica de barras con la tasa de ocupación por espacio calculada como `(horas_reservadas / (capacidad_diaria_horas × 30)) × 100`, expresada con un decimal de precisión; WHERE `capacidad_diaria_horas` es el número de horas disponibles diariamente por espacio. IF la capacidad es 0 o indefinida, THEN THE Report_Module SHALL mostrar "N/A" en lugar de un porcentaje.
3. THE Report_Module SHALL mostrar una gráfica de línea temporal con el número de reservas por día en los últimos 30 días calendario, incluyendo como puntos de datos los días con 0 reservas.
4. WHEN el `office_manager` selecciona un filtro de tipo de espacio, THE Report_Module SHALL actualizar todas las métricas, tablas y gráficas en un máximo de 2 segundos para mostrar únicamente los datos del tipo seleccionado.
5. WHEN el `office_manager` solicita exportar los datos, THE Report_Module SHALL generar y descargar un archivo CSV con las columnas de la vista `space_utilization` más el nombre del espacio, correspondiente al filtro de tipo activo en ese momento.
6. IF un usuario con rol `member` intenta acceder a la ruta del módulo de reportes, THEN THE App SHALL redirigirlo al Dashboard y mostrar un mensaje de acceso denegado visible durante al menos 3 segundos, independientemente de si el `office_manager` ya se encuentra en el módulo. El cumplimiento requiere tanto la redirección como la visualización del mensaje.
7. THE Report_Module SHALL mostrar el rango de fechas cubierto por el reporte (fecha de inicio y fecha actual) como indicador visual en la cabecera del módulo.
8. IF la consulta a `space_utilization` no retorna registros para los filtros activos, THEN THE Report_Module SHALL mostrar un mensaje informativo en lugar de tablas o gráficas vacías.

---

### Requirement 9: Gestión del Equipo

**User Story:** Como `office_manager`, quiero ver y gestionar los miembros de mi organización, para que pueda mantener actualizado el directorio del equipo y sus permisos de acceso.

#### Acceptance Criteria

1. THE Team_Manager SHALL mostrar una lista paginada de 25 perfiles por página de todos los miembros de la organización, con columnas: nombre completo, correo electrónico y rol actual.
2. WHEN el `office_manager` cambia el rol de un miembro de `member` a `office_manager`, THE Team_Manager SHALL actualizar el campo `role` en la tabla `profiles` de Supabase y reflejar el cambio en la lista sin recargar la página. Solo los usuarios con rol `office_manager` pueden promover miembros.
3. WHEN el `office_manager` cambia el rol de un `office_manager` a `member`, THE Team_Manager SHALL actualizar el campo `role` y reflejar el cambio en la lista sin recargar la página. Solo los usuarios con rol `office_manager` pueden degradar a otros `office_managers`.
4. THE Team_Manager SHALL mostrar el número total de miembros de la organización como indicador numérico en la cabecera del módulo.
5. IF el `office_manager` intenta degradar su propio rol a `member`, THEN THE Team_Manager SHALL mostrar un diálogo de confirmación advirtiendo explícitamente que perderá los privilegios de administración, con opciones de confirmar o cancelar la acción.
6. IF el `office_manager` es el único miembro con rol `office_manager` en la organización e intenta degradar su propio rol, THEN THE Team_Manager SHALL bloquear la acción y mostrar un mensaje indicando que debe haber al menos un `office_manager` activo en la organización.
7. IF un usuario con rol `member` intenta acceder a la ruta de gestión del equipo, THEN THE App SHALL redirigirlo al Dashboard y mostrar un mensaje de acceso denegado.
8. THE Team_Manager SHALL proveer un campo de búsqueda por nombre o correo electrónico que filtre la lista de miembros con un debounce de 300ms, actualizando los resultados sin recargar la página.
9. IF una operación de cambio de rol falla por un error del servidor, THEN THE Team_Manager SHALL mostrar un mensaje de error descriptivo y revertir el rol al valor anterior en la interfaz sin modificar el estado en Supabase.

---

### Requirement 10: UX/UI, Accesibilidad y Rendimiento

**User Story:** Como usuario de la plataforma, quiero una interfaz moderna, accesible y rápida, para que pueda completar mis tareas de gestión de espacios de forma eficiente sin fricciones.

#### Acceptance Criteria

1. THE App SHALL aplicar la misma tipografía, escala de espaciado y biblioteca de componentes en todas las vistas, de modo que elementos del mismo tipo sean visualmente indistinguibles entre módulos.
2. THE App SHALL cumplir con los criterios de accesibilidad WCAG 2.1 nivel AA, incluyendo contraste de color mínimo 4.5:1 para texto normal y navegación completa por teclado.
3. WHEN una operación asíncrona tarda 301ms o más en responder, THE App SHALL mostrar un skeleton screen o spinner (a elección de la implementación) en el área afectada, que permanezca visible hasta que la operación se resuelva o falle.
4. WHEN una acción del usuario se completa con éxito, THE App SHALL mostrar una notificación toast no bloqueante que se descarta automáticamente tras 4 segundos.
5. IF una operación falla, THEN THE App SHALL mostrar una notificación toast de error no bloqueante que persiste hasta que el usuario la descarte manualmente o hasta 8 segundos.
6. WHEN el usuario navega entre módulos, THE App SHALL completar la transición de ruta en menos de 200ms en condiciones de red estándar (latencia < 100ms).
7. THE App SHALL ser completamente funcional en Chrome 120+, Firefox 121+, Safari 17+ y Edge 120+.
8. THE App SHALL producir un bundle inicial comprimido en gzip que no supere los 250KB al primer acceso.
9. WHEN el viewport tiene un ancho menor a 768px, THE App SHALL reorganizar los layouts de múltiples columnas a una sola columna, garantizando que todos los controles interactivos, campos de formulario y acciones sean accesibles sin scroll horizontal.
10. WHEN el usuario navega hacia atrás usando el historial del navegador, THE App SHALL restaurar los filtros y términos de búsqueda que estaban activos en el momento en que el usuario abandonó esa vista.
