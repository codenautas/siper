set search_path = siper;
SET ROLE siper_muleto_owner;

insert into "roles" ("rol", "puede_cargar_todo", "puede_ver_todo", "puede_cargar_dependientes", "puede_ver_dependientes", "puede_cargar_propio", "puede_ver_propio", "puede_corregir_el_pasado") values
('rrhh_admin', 'true', 'true', 'true', 'true', 'true', 'true', 'true');
