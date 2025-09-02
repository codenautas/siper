set search_path = siper;

update roles 
  set puede_ver_todo = puede_cargar_todo,
      puede_ver_dependientes = puede_cargar_dependientes,
      puede_ver_propio = true;

ALTER TABLE "personas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "personas" AS PERMISSIVE FOR all TO siper_admin USING ( true );
CREATE POLICY "bp select" ON "personas" AS RESTRICTIVE FOR select TO siper_admin USING ( (case when get_app_user('mode') = 'login' then true else ( -- PUEDE TODO:
                SELECT puede_ver_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_ver_propio FROM roles WHERE rol = get_app_user('rol') AND personas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_ver_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        sector,
                        get_app_user('sector')
                    )
                )
            )
         end) );
CREATE POLICY "bp insert" ON "personas" AS RESTRICTIVE FOR insert TO siper_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND personas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        sector,
                        get_app_user('sector')
                    )
                )
            )
        ) );
CREATE POLICY "bp update" ON "personas" AS RESTRICTIVE FOR update TO siper_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND personas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        sector,
                        get_app_user('sector')
                    )
                )
            )
        ) );
CREATE POLICY "bp delete" ON "personas" AS RESTRICTIVE FOR delete TO siper_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND personas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        sector,
                        get_app_user('sector')
                    )
                )
            )
        ) );
ALTER TABLE "novedades_registradas" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "novedades_registradas" AS PERMISSIVE FOR all TO siper_admin USING ( true );
CREATE POLICY "bp select" ON "novedades_registradas" AS RESTRICTIVE FOR select TO siper_admin USING ( ( -- PUEDE TODO:
                SELECT puede_ver_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_ver_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_registradas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_ver_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_registradas.idper),
                        get_app_user('sector')
                    )
                )
            )
         );
CREATE POLICY "bp insert" ON "novedades_registradas" AS RESTRICTIVE FOR insert TO siper_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_registradas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_registradas.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (desde 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp update" ON "novedades_registradas" AS RESTRICTIVE FOR update TO siper_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_registradas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_registradas.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (desde 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp delete" ON "novedades_registradas" AS RESTRICTIVE FOR delete TO siper_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_registradas.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_registradas.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (desde 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
ALTER TABLE "novedades_horarias" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "novedades_horarias" AS PERMISSIVE FOR all TO siper_admin USING ( true );
CREATE POLICY "bp select" ON "novedades_horarias" AS RESTRICTIVE FOR select TO siper_admin USING ( ( -- PUEDE TODO:
                SELECT puede_ver_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_ver_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_horarias.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_ver_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_horarias.idper),
                        get_app_user('sector')
                    )
                )
            )
         );
CREATE POLICY "bp insert" ON "novedades_horarias" AS RESTRICTIVE FOR insert TO siper_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_horarias.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_horarias.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (fecha 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp update" ON "novedades_horarias" AS RESTRICTIVE FOR update TO siper_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_horarias.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_horarias.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (fecha 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp delete" ON "novedades_horarias" AS RESTRICTIVE FOR delete TO siper_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_horarias.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_horarias.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (fecha 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
ALTER TABLE "novedades_vigentes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp base" ON "novedades_vigentes" AS PERMISSIVE FOR all TO siper_admin USING ( true );
CREATE POLICY "bp select" ON "novedades_vigentes" AS RESTRICTIVE FOR select TO siper_admin USING ( ( -- PUEDE TODO:
                SELECT puede_ver_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_ver_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_vigentes.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_ver_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_vigentes.idper),
                        get_app_user('sector')
                    )
                )
            )
         );
CREATE POLICY "bp insert" ON "novedades_vigentes" AS RESTRICTIVE FOR insert TO siper_admin WITH CHECK ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_vigentes.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_vigentes.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (fecha 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp update" ON "novedades_vigentes" AS RESTRICTIVE FOR update TO siper_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_vigentes.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_vigentes.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (fecha 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );
CREATE POLICY "bp delete" ON "novedades_vigentes" AS RESTRICTIVE FOR delete TO siper_admin USING ( (( -- PUEDE TODO:
                SELECT puede_cargar_todo FROM roles WHERE rol = get_app_user('rol')
            ) OR ( -- PUEDE LO PROPIO:
                SELECT puede_cargar_propio FROM roles WHERE rol = get_app_user('rol') AND novedades_vigentes.idper = get_app_user('idper')
            ) OR ( -- PUEDE LO DEPENDIENTE:
                (
                    SELECT puede_cargar_dependientes FROM roles WHERE rol = get_app_user('rol')
                ) AND (
                    SELECT sector_pertenece(
                        (SELECT sector FROM personas WHERE idper = novedades_vigentes.idper),
                        get_app_user('sector')
                    )
                )
            )
        ) AND (
            (fecha 
                >= (SELECT fecha_actual FROM parametros WHERE unico_registro)
            ) OR (
                SELECT puede_corregir_el_pasado FROM roles WHERE rol = get_app_user('rol')
            )
        )
     );      