-- Agrega las políticas de seguridad a per_domicilios y per_telefonos: solo se ven los datos de las personas que se pueden ver
set role to siper_muleto_owner;
set search_path = siper;

ALTER TABLE "per_domicilios" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "per_domicilios" AS PERMISSIVE FOR all TO siper_muleto_admin USING ( true );
CREATE POLICY "bp select" ON "per_domicilios" AS RESTRICTIVE FOR select TO siper_muleto_admin USING ( per_domicilios.idper IN (SELECT idper FROM personas) );
CREATE POLICY "bp insert" ON "per_domicilios" AS RESTRICTIVE FOR insert TO siper_muleto_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND per_domicilios.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = per_domicilios.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) );
CREATE POLICY "bp update" ON "per_domicilios" AS RESTRICTIVE FOR update TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND per_domicilios.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = per_domicilios.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) );
CREATE POLICY "bp delete" ON "per_domicilios" AS RESTRICTIVE FOR delete TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND per_domicilios.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = per_domicilios.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) );
ALTER TABLE "per_telefonos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "per_telefonos" AS PERMISSIVE FOR all TO siper_muleto_admin USING ( true );
CREATE POLICY "bp select" ON "per_telefonos" AS RESTRICTIVE FOR select TO siper_muleto_admin USING ( per_telefonos.idper IN (SELECT idper FROM personas) );
CREATE POLICY "bp insert" ON "per_telefonos" AS RESTRICTIVE FOR insert TO siper_muleto_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND per_telefonos.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = per_telefonos.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) );
CREATE POLICY "bp update" ON "per_telefonos" AS RESTRICTIVE FOR update TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND per_telefonos.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = per_telefonos.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) );
CREATE POLICY "bp delete" ON "per_telefonos" AS RESTRICTIVE FOR delete TO siper_muleto_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND per_telefonos.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = per_telefonos.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) );
