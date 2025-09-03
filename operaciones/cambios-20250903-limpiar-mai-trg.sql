set search_path=siper;
--SET ROLE siper_muleto_owner;
SET ROLE siper_owner;

-- los que no cumplen
/*
select * from  "usuarios" where 
mail !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
or mail_alternativo !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
or usuario !~ '^[a-zA-Z0-9_-]+$';
*/
--

CREATE OR REPLACE FUNCTION validar_y_limpiar_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Eliminar espacios en blanco de todos los campos
    NEW.usuario := TRIM(REGEXP_REPLACE(NEW.usuario, '\s+', '', 'g'));

	IF NEW.mail IS NOT NULL THEN
	    NEW.mail := TRIM(REGEXP_REPLACE(NEW.mail, '\s+', '', 'g'));
    END IF;
    
    IF NEW.mail_alternativo IS NOT NULL THEN
        NEW.mail_alternativo := TRIM(REGEXP_REPLACE(NEW.mail_alternativo, '\s+', '', 'g'));
    END IF;

    -- Validar formato del usuario (solo caracteres permitidos)
    IF NEW.usuario !~ '^[a-zA-Z0-9_-]+$' THEN
        RAISE EXCEPTION 'El usuario solo puede contener letras, números y los caracteres _-';
    END IF;

    -- Validar formato del email principal
    IF NEW.mail IS NOT NULL AND NEW.mail !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
        RAISE EXCEPTION 'email principal solo letras, número o _-: %', NEW.mail;
    END IF;

    -- Validar formato del email alternativo (si existe)
    IF NEW.mail_alternativo IS NOT NULL AND NEW.mail_alternativo !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
        RAISE EXCEPTION 'email alternativo solo letras, número o _-: %', NEW.mail_alternativo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar el trigger si ya existe
DROP TRIGGER IF EXISTS tr_validar_usuario ON usuarios;

-- Crear el trigger
CREATE TRIGGER tr_validar_usuario
    BEFORE INSERT OR UPDATE OF usuario, mail, mail_alternativo
    ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION validar_y_limpiar_usuario();
