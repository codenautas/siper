# Usando Nix

El archivo `flake.nix` define el ambiente de desarrollo: Node.js 22, PostgreSQL 18, git y yq.

## Instalación de la máquina local

Se hace una sola vez por máquina.

### WSL

Hace falta Windows 11 o Windows 10 (versión 2004 o posterior) con la virtualización habilitada en el BIOS.

En una consola de Windows con permisos de administrador:

```sh
wsl --install
```

Después se abre Ubuntu desde el menú Inicio (escribiendo `Ubuntu`) o ejecutando `wsl` en una consola de Windows.
La primera vez:
* pregunta si se quiere enviar a Canonical datos anónimos del sistema (_platform metrics_);
  no influye en nada de lo que sigue
* pide crear un usuario y una contraseña de Linux, independientes de los de Windows;
  la contraseña se usa para `sudo`

### Nix

En la terminal de Ubuntu:

```sh
cd ~
sudo apt install nix-bin nix-setup-systemd
sudo usermod -aG nix-users $USER
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

1. `cd ~` cambia a la carpeta del usuario de Linux (al abrir Ubuntu se puede estar en `/mnt/c/...`, que es el disco de Windows)
2. instala Nix y el servicio que lo administra
3. agrega el usuario al grupo `nix-users`, que es el que puede usar ese servicio
4. y 5. habilitan los flakes para el usuario

Para que tome el grupo nuevo hay que reiniciar WSL:
cerrar la terminal de Ubuntu, ejecutar `wsl --shutdown` en una consola de Windows y volver a abrir Ubuntu.

Para verificar:

```sh
nix --version
groups
```

`groups` tiene que incluir `nix-users`.

### direnv (opcional)

Instalar [direnv](https://direnv.net/) con [nix-direnv](https://github.com/nix-community/nix-direnv)
para que la terminal y Visual Studio Code (con la extensión WSL) entren al ambiente solos.

### coderun

Clonar coderun dentro del sistema de archivos de WSL (no en `/mnt/c`) y agregar `coderun/devel` al `PATH`.
De ahí se toman `run-sql`, `install-dev-env` y `pg-env.sh`.

## Instalación del ambiente de SiPer

Se hace una sola vez por cada copia del repositorio.

Clonar este repositorio dentro del sistema de archivos de WSL (no en `/mnt/c`)
y desde su carpeta ejecutar:

```sh
nix run .#install
```

Eso corre `install-dev-env`, que:
* genera `local-config.yaml` a partir de `example-local-config.yaml` usando los valores marcados con `# for-test:`
* crea e inicia una instancia de PostgreSQL en `local-pg/` (descartable, sin claves, solo accesible desde localhost)
* ejecuta `npm ci`, `npm run prepare`, `npm start -- --dump-db` y `run-sql create-db`

Se detiene ante el primer error y no se ejecuta si `local-config.yaml` o `local-pg/` ya existen.

## Desarrollo

Se entra al ambiente con `nix develop` (o automáticamente con direnv).
Al entrar no se modifica nada: solo se inicia la instancia de PostgreSQL si estaba detenida
(queda corriendo al salir; se detiene con `pg_ctl stop`).

Son los mismos comandos que en Windows, sin `call`:

```sh
npm run prepare && npm start -- --dump-db && run-sql create-schema && npm test
```

Correr solo algunos tests:

```sh
npm test -- --grep "texto del test"
```
