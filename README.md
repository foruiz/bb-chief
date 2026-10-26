# BB Chief

Aplicación web para llevar el seguimiento de un partido de **Blood Bowl 2020** desde un único móvil o tableta compartido por ambos jugadores.

BB Chief está pensada para que los jugadores puedan consultar y actualizar el marcador, los turnos y las segundas oportunidades sin tener que llevar esas cuentas manualmente.

> **Estado del proyecto:** en desarrollo. Algunas funcionalidades o detalles de interfaz pueden cambiar durante la implementación del MVP.

## Funcionalidades previstas

- Configuración de un partido normal o de la variante **Sevens**.
- Registro del nombre y tipo de equipo de cada participante.
- Configuración de las segundas oportunidades disponibles para cada equipo.
- Selección del equipo pateador.
- Marcador de touchdowns por equipo.
- Contadores de segundas oportunidades disponibles, con descuento al utilizarlas.
- Seguimiento de la parte y los turnos de ambos equipos.
- Alternancia de equipo activo al finalizar un turno.
- Detección del descanso y confirmación antes de pasar a la segunda parte.
- Detección del final del partido.
- Corrección manual de touchdowns y segundas oportunidades.
- Deshacer la última acción.
- Interfaz responsive para móvil y tableta, tanto en orientación vertical como horizontal.
- Persistencia local en el dispositivo, sin necesidad de una cuenta de usuario ni de un servidor para guardar la partida.

## Tecnologías

- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- Pruebas unitarias para la lógica de dominio.

## Requisitos previos

- Node.js y npm. Utiliza una versión de Node.js compatible con las dependencias del proyecto.
- Git, si vas a clonar el repositorio.

## Instalación y ejecución

Clona el repositorio y entra en la carpeta del proyecto:

```bash
git clone <URL_DEL_REPOSITORIO>
cd bb-chief
```

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Vite mostrará la dirección local en la que se sirve la aplicación. Para probarla en un móvil conectado a la misma red, puede ser necesario iniciar Vite escuchando en la red local (por ejemplo, con `npm run dev -- --host 0.0.0.0`) y acceder desde el navegador del móvil a la dirección IP del equipo de desarrollo. No expongas el servidor de desarrollo a redes no confiables.

## Pruebas y compilación

Ejecuta las pruebas unitarias:

```bash
npm test
```

Genera la compilación de producción:

```bash
npm run build
```

Los comandos disponibles dependen de los scripts definidos en `package.json`. Consulta ese archivo si alguno de los comandos anteriores no está configurado en tu versión del proyecto.

## Uso y datos

BB Chief está diseñada para utilizarse en un único dispositivo compartido por los dos jugadores. La persistencia local evita depender de una conexión a un servicio remoto, pero **no equivale a una copia de seguridad**: los datos del navegador pueden perderse si se borran sus datos, se cambia de navegador o se cambia de dispositivo.

## Alcance y reglas

El proyecto toma como referencia Blood Bowl 2020 y contempla partidos normales y la variante Sevens. BB Chief es una herramienta de seguimiento del partido; no pretende sustituir el reglamento oficial. Ante cualquier discrepancia, prevalece el reglamento aplicable a la partida.

Blood Bowl es una marca de sus respectivos titulares. Este proyecto es independiente y no está afiliado, patrocinado ni respaldado por Games Workshop.

## Contribuciones

Por ahora, el proyecto está en desarrollo. Si deseas proponer cambios, abre una incidencia describiendo el problema o la mejora, incluyendo los pasos para reproducirlo cuando corresponda.

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [`LICENSE`](LICENSE) para ver el texto completo.

Antes de publicar el repositorio, añade el archivo `LICENSE` con el texto oficial de MIT y sustituye el titular del copyright por el nombre o alias que quieras utilizar.
