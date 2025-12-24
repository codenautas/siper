# siper
Sistema Integral de Gestión de Agentes, Recursos, Personal y Actividades

# pruebas

Usando code-run como se ve en [Codenautas](https://codenautas.com/operaciones/comandos-locales.html) 
y suponiendo que en `\bin\local-path.bat` están las variables de ambiente y el path.

## Ejemplos

Probar el circuito completo del backend (recreando cada vez la base de datos):

```sh
call npm run prepare && call npm start -- --dump-db && call run-sql create-schema && call npm test
```

Probar el front-end recompilando pero sin recrear la base de datos:

```sh
call npm run prepare && call npm test -- --nav-only
```

Probar el front-end in recompilar y manteniendo el backend abierto para poder probar a mano

```sh
npm test -- --nav-only --no-close
```