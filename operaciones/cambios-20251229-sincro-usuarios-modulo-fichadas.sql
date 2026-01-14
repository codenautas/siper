set search_path=siper;
SET ROLE siper_muleto_owner;
--SET ROLE siper_owner;

create table "cola_sincronizacion_usuarios_modulo" (
  "num_sincro" bigint, 
  "usuario" text, 
  "accion" text, 
  "estado" text, 
  "intentos" integer default '0', 
  "parametros" text, 
  "respuesta_sp" text, 
  "creado_en" timestamp, 
  "actualizado_en" timestamp
, primary key ("num_sincro")
);
grant select, insert, update, delete on "cola_sincronizacion_usuarios_modulo" to siper_muleto_admin;
grant all on "cola_sincronizacion_usuarios_modulo" to siper_muleto_owner;


CREATE SEQUENCE "cola_usuarios_seq" START 1;
ALTER TABLE "cola_sincronizacion_usuarios_modulo" ALTER COLUMN "num_sincro" SET DEFAULT nextval('cola_usuarios_seq'::regclass);
GRANT USAGE, SELECT ON SEQUENCE "cola_usuarios_seq" TO siper_muleto_admin;

alter table "cola_sincronizacion_usuarios_modulo" alter column "num_sincro" set not null;
alter table "cola_sincronizacion_usuarios_modulo" add constraint "usuario<>''" check ("usuario"<>'');
alter table "cola_sincronizacion_usuarios_modulo" alter column "usuario" set not null;
alter table "cola_sincronizacion_usuarios_modulo" add constraint "accion<>''" check ("accion"<>'');
alter table "cola_sincronizacion_usuarios_modulo" alter column "accion" set not null;
alter table "cola_sincronizacion_usuarios_modulo" add constraint "estado<>''" check ("estado"<>'');
alter table "cola_sincronizacion_usuarios_modulo" alter column "estado" set not null;
alter table "cola_sincronizacion_usuarios_modulo" alter column "intentos" set not null;
alter table "cola_sincronizacion_usuarios_modulo" add constraint "respuesta_sp<>''" check ("respuesta_sp"<>'');
alter table "cola_sincronizacion_usuarios_modulo" add constraint "parametros<>''" check ("parametros"<>'');
alter table "cola_sincronizacion_usuarios_modulo" add constraint "estados_cola" check (estado IN ('PENDIENTE', 'EN_PROCESO', 'PROCESADO', 'ERROR', 'AGOTADO'));
alter table "cola_sincronizacion_usuarios_modulo" add constraint "acciones_cola" check (accion IN ('DESACTIVAR', 'ACTUALIZAR'));

CREATE UNIQUE INDEX "idx_usuario_activo_sincro" 
ON "cola_sincronizacion_usuarios_modulo" ("usuario") 
WHERE ("estado" != 'PROCESADO');

CREATE OR REPLACE FUNCTION siper.fn_trigger_sincro_usuarios_modulo()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
    -- Banderas de decisión
    v_debe_desactivar_previo   BOOLEAN := false;
    v_debe_procesar_actual     BOOLEAN := false;
    v_accion_actual            TEXT; -- 'ACTUALIZAR' o 'DESACTIVAR'
    
    -- Variables auxiliares
    v_algoritmo_actual         TEXT;
BEGIN
    -- 1. Determinar algoritmo del registro que disparó el trigger
    v_algoritmo_actual := CASE WHEN TG_OP = 'DELETE' THEN OLD.algoritmo_pass ELSE NEW.algoritmo_pass END;

    -- Guard: Si no es el algoritmo requerido, ignoramos
    IF (COALESCE(v_algoritmo_actual, '') != 'PG-SHA256') THEN
        RETURN NULL;
    END IF;

    -- 2. LÓGICA DE DECISIÓN
    
    -- Caso A: Cambio de nombre (Renombre)
    -- Si es un UPDATE y el nombre de usuario cambió, hay que "apagar" el nombre anterior.
    IF (TG_OP = 'UPDATE' AND OLD.usuario IS DISTINCT FROM NEW.usuario) THEN
        v_debe_desactivar_previo := true;
    END IF;

    -- Caso B: Determinar qué hacer con el usuario "actual"
    IF (TG_OP = 'DELETE') THEN
        v_debe_procesar_actual := true;
        v_accion_actual        := 'DESACTIVAR';

    ELSIF (NEW.idper IS NULL) THEN
        -- Si el registro actual no tiene persona, solo nos interesa si antes SÍ tenía (Desvínculo)
        IF (TG_OP = 'UPDATE' AND OLD.idper IS NOT NULL) THEN
            v_debe_procesar_actual := true;
            v_accion_actual        := 'DESACTIVAR';
        END IF;
    
    ELSE 
        -- El registro tiene idper (está vinculado)
        -- Sincronizamos si es nuevo o si cambiaron datos relevantes
        IF (TG_OP = 'INSERT' OR OLD.* IS DISTINCT FROM NEW.*) THEN
            v_debe_procesar_actual := true;
            v_accion_actual        := 'ACTUALIZAR';
        END IF;
    END IF;

    -- 3. EJECUCIÓN DE ACCIONES EN LA COLA

    -- Acción para el usuario PREVIO (solo en renombres)
    IF (v_debe_desactivar_previo) THEN
        INSERT INTO siper.cola_sincronizacion_usuarios_modulo (usuario, accion, estado, creado_en, actualizado_en)
        VALUES (OLD.usuario, 'DESACTIVAR', 'PENDIENTE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT (usuario) WHERE (estado != 'PROCESADO')
        DO UPDATE SET accion = 'DESACTIVAR', estado = 'PENDIENTE', actualizado_en = NOW(), intentos = 0, respuesta_sp = null;
    END IF;

    -- Acción para el usuario ACTUAL (Alta, Modificación, Baja o Desvínculo)
    IF (v_debe_procesar_actual) THEN
        INSERT INTO siper.cola_sincronizacion_usuarios_modulo (usuario, accion, estado, creado_en, actualizado_en)
        VALUES (CASE WHEN TG_OP = 'DELETE' THEN OLD.usuario ELSE NEW.usuario END, v_accion_actual, 'PENDIENTE',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT (usuario) WHERE (estado != 'PROCESADO')
        DO UPDATE SET accion = v_accion_actual, estado = 'PENDIENTE', actualizado_en = NOW(), intentos = 0, respuesta_sp = null;
    END IF;

    RETURN NULL;
END;
$$;


DROP TRIGGER IF EXISTS tr_sincro_usuarios_modulo_global ON "usuarios";

CREATE TRIGGER tr_sincro_usuarios_modulo_global
    AFTER INSERT OR DELETE OR UPDATE OF usuario, activo, hashpass, idper
    ON "usuarios"
    FOR EACH ROW
    EXECUTE FUNCTION siper.fn_trigger_sincro_usuarios_modulo();


alter table "fichadas_recibidas" drop constraint "fichadas_recibidas personas REL";
drop index "idper 4 fichadas_recibidas IDX" ;


--permisos faltantes en grilla fichadas recibidas
SET ROLE postgres;

grant select, insert, update, delete on "fichadas_recibidas" to siper_muleto_admin;
grant all on "fichadas_recibidas" to siper_muleto_owner;