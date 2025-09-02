set search_path = siper, public;

do $do$
declare
  v_actualizados integer;
begin
  if (select 1 from information_schema.table_constraints where constraint_name='trayectoria_laboral grados REL') is null then
    update trayectoria_laboral set grado = substr(grado, 2) where grado like '0%' and length(grado) > 1;
    get diagnostics v_actualizados = row_count;
    raise notice 'HUBO QUE corregir los grados que comienzan con 0 en % trayectoria_laboral', v_actualizados;
  else
    raise notice 'No es necesario corregir los grados que comienzan con 0';
  end if;
end;
$do$;