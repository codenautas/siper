set search_path=siper;
SET ROLE siper_muleto_owner;
--SET ROLE siper_owner;

drop function if exists set_app_user(text);

create or replace procedure set_app_user(p_user text)
  security definer language plpgsql
as
$body$
declare
    
        "v_usuario" text;
        "v_rol" text;
        "v_idper" text;
        "v_sector" text;
begin
    if p_user = '!login' then
        
        set backend_plus._usuario = '!';
        set backend_plus._rol = '!';
        set backend_plus._idper = '!';
        set backend_plus._sector = '!';

        set backend_plus._mode = login;
    else
        select "usuario", "rol", "idper", "sector"
            into "v_usuario", "v_rol", "v_idper", "v_sector"
            
            from usuarios left join personas p using (idper)
                where "usuario" = p_user;
        
        perform set_config('backend_plus._usuario', v_usuario, false);
        perform set_config('backend_plus._rol', v_rol, false);
        perform set_config('backend_plus._idper', v_idper, false);
        perform set_config('backend_plus._sector', v_sector, false);

        set backend_plus._mode = normal;
    end if;
    perform set_config('backend_plus._user', p_user, false);
end;    
$body$;
