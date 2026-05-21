# Guía de Despliegue On-Premise (Servicios)

Una vez que has compilado tu aplicación en un archivo ejecutable (usando `npm run build:onpremise`), el siguiente paso para blindar la instalación en el servidor del cliente es configurarlo como un **Servicio del Sistema**.

Esto garantiza que:
1. El sistema arranque automáticamente si el servidor se reinicia (por cortes de luz, actualizaciones, etc.).
2. El cliente no tenga que abrir una consola negra que pueda cerrar por error.
3. Corra en segundo plano (background) de forma silenciosa.

Aquí tienes cómo hacerlo en los sistemas operativos más comunes:

## La Arquitectura Dual (Cloud vs On-Premise)

Actualmente nuestro proyecto está diseñado para coexistir en dos mundos usando Docker, lo cual es la mejor práctica de DevOps.

### 1. Versión Cloud (Railway, AWS, Vercel, Tu propio host)
*   **Archivos:** `Dockerfile` y `docker-compose.yml`
*   **Script de deploy:** En Railway, solo conectas el repositorio de GitHub y Railway automáticamente leerá el `Dockerfile` principal.
*   **Qué incluye:** Tu código fuente original (`server.ts`, etc.).
*   **¿Es seguro?:** Sí, porque está alojado en tus servidores (Railway). Nadie tiene acceso SSH a tu máquina.

### 2. Versión On-Premise (Servidores del Cliente)
*   **Archivos:** `Dockerfile.onpremise` y `docker-compose.onpremise.yml`
*   **Qué incluye:** **NO** incluye tu código fuente. Solo incluye el archivo `/dist-onpremise/server.bin.js` (completamente ofuscado, encriptado y con el chequeo de licencia oculto) y el frontend estático.
*   **¿Es seguro?:** Sí, aunque el cliente tiene el contenedor de Docker en su servidor local, si intenta meterse al contenedor a leer el código de validación, solo encontrará símbolos incomprensibles y código basura gracias a `javascript-obfuscator`.

### Flujo de Trabajo para Entregar al Cliente:
1. Compilas la app blindada:
   ```bash
   npm run build:onpremise
   ```
2. Entregas un `.zip` al cliente conteniendo **SOLAMENTE**:
   - La carpeta `dist/` (El frontend público pre-compilado).
   - La carpeta `dist-onpremise/` (Solo con el archivo `server.bin.js` adentro, nada más).
   - El archivo `Dockerfile.onpremise`
   - El archivo `docker-compose.onpremise.yml`
   - El archivo `package.json` (solo con dependencias de producción y prisma)
   - La carpeta `prisma/`
3. El cliente en su servidor, dentro de la carpeta, ejecuta:
   ```bash
   docker-compose -f docker-compose.onpremise.yml up -d --build
   ```
4. ¡Listo! El entorno del cliente levanta de forma 100% aislada de tu Cloud.

La forma más profesional y robusta de instalar un `.exe` como servicio en Windows es usando **NSSM (Non-Sucking Service Manager)**.

### Pasos:
1. Descarga NSSM desde su página oficial (http://nssm.cc/).
2. Abre una terminal (CMD) como Administrador.
3. Ejecuta el comando para instalar tu binario como servicio:
   ```cmd
   nssm install NexusService "C:\Ruta\A\Tu\Carpeta\nexus-server-win.exe"
   ```
4. Se abrirá una interfaz gráfica. Asegúrate de configurar:
   - **Path**: La ruta a tu `.exe`.
   - **Details -> Startup type**: Automatic.
   - **Log on**: Local System account.
5. Inicia el servicio:
   ```cmd
   nssm start NexusService
   ```

*Nota: También puedes usar el comando nativo de Windows `sc create`, pero NSSM gestiona mejor los reinicios si la app llegase a fallar.*

---

## 🐧 Para Servidores Linux (Ubuntu / Debian / CentOS)

En Linux, el estándar de la industria es utilizar **systemd**.

### Pasos:
1. Mueve tu binario procesado a una ruta segura, por ejemplo `/opt/nexus/`:
   ```bash
   sudo mkdir -p /opt/nexus
   sudo cp nexus-server-linux /opt/nexus/
   sudo chmod +x /opt/nexus/nexus-server-linux
   ```
2. Crea un archivo de servicio en systemd:
   ```bash
   sudo nano /etc/systemd/system/nexus.service
   ```
3. Pega esta configuración adentro:
   ```ini
   [Unit]
   Description=Nexus On-Premise Service
   After=network.target

   [Service]
   Type=simple
   User=root
   WorkingDirectory=/opt/nexus
   ExecStart=/opt/nexus/nexus-server-linux
   Restart=always
   # Reiniciar si falla después de 5 segundos
   RestartSec=5
   Environment=NODE_ENV=production
   Environment=PORT=3000
   # IMPORTANTE: Coloca aquí las variables de entorno de BD
   Environment=DATABASE_URL="postgresql://usuario:pass@localhost:5432/nexus_db"

   [Install]
   WantedBy=multi-user.target
   ```
4. Recarga los demonios de systemd para que detecte tu nuevo servicio:
   ```bash
   sudo systemctl daemon-reload
   ```
5. Habilita el servicio para que arranque en cada reinicio del servidor:
   ```bash
   sudo systemctl enable nexus
   ```
6. Inicia el servicio ahora:
   ```bash
   sudo systemctl start nexus
   ```

Con esto, el sistema del cliente estará corriendo 100% en segundo plano y será resiliente a apagones o bloqueos.
