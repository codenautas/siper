type DetalleMultiorigenEsquema = {
    cantidad: number
    usados: number
    pendientes: number
    saldo: number
}

type DetalleMultiorigen = {
    esquema: string
    usados: number
    pendientes: number
    inconsistencia: DetalleMultiorigenEsquema
}

const BLANK_NUM = '' as unknown as number;

export function obtenerDetalleMultiorigen(row:DetalleMultiorigen){
    if (!row.esquema) return null;
    var esquema = JSON.parse(row.esquema || '{}') as Record<string, DetalleMultiorigenEsquema>;
    var usados = 0 + row.usados;
    var pendientes = 0 + row.pendientes;
    Object.keys(esquema).forEach(key => {
        var renglon = esquema[key];
        renglon.usados = usados > renglon.cantidad ? renglon.cantidad : usados;
        usados -= renglon.usados;
        var resto = renglon.cantidad - renglon.usados;
        renglon.pendientes = pendientes > resto ? resto : pendientes;
        pendientes -= renglon.pendientes;
        renglon.saldo = renglon.cantidad - (renglon.usados + renglon.pendientes);
    });
    if(usados > 0 || pendientes > 0){
        esquema.inconsistencia = {cantidad:BLANK_NUM, usados:BLANK_NUM, pendientes:BLANK_NUM, saldo: usados + pendientes}
    }
    row.esquema = JSON.stringify(esquema);
    return esquema;
}