export function obtenerDetalleVacaciones(row:any){
    if (!row.esquema) return null;
    var esquema = JSON.parse(row.esquema || '{}');
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
        esquema.inconsistencia = {cantidad:'', usados:'', pendientes:'', saldo: usados + pendientes}
    }
    return esquema;
}