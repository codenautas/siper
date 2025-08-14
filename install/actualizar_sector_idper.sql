CREATE OR REPLACE PROCEDURE actualizar_sector_idper(p_sector text, p_idper text)
  SECURITY DEFINER
  LANGUAGE PLPGSQL
AS
$BODY$
BEGIN
MERGE INTO trayectoria_laboral tl 
  USING (SELECT p.idper, p.sector, t.idt
            FROM personas p 
            LEFT JOIN (SELECT * 
                    FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY idper ORDER BY desde DESC, idt DESC) AS rn
                            FROM trayectoria_laboral
                            WHERE propio) l 
                    WHERE rn = 1) t 
            ON p.idper = t.idper
        ) q
    ON tl.idper = q.idper AND tl.idt = q.idt AND tl.idper = p_idper AND tl.sector = p_sector
  WHEN MATCHED AND 
      tl.sector IS DISTINCT FROM q.sector THEN
    UPDATE SET sector = q.sector
  --WHEN NOT MATCHED THEN
  --  INSERT (idper, sector)
  --    VALUES (q.idper, q.sector)
  --WHEN NOT MATCHED BY SOURCE AND tl.idper = p_idper THEN DELETE
  ;
END;
$BODY$;
