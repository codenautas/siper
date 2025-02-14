export function obtenerDetalleVacaciones(row:any){
    if (!row.esquema) return null;
    var esquema = JSON.parse(row.esquema || '{}');
    var saldo = 0 + row.usados + row.pendientes;
    Object.keys(esquema).forEach(key => {
        var renglon = esquema[key];
        var pedidos = saldo > renglon.cantidad ? renglon.cantidad : saldo;
        saldo -= pedidos;
        renglon.pedidos = pedidos;
        renglon.saldo = renglon.cantidad - renglon.pedidos;
    });
    if(saldo) {
        esquema.inconsistencia = {cantidad:'', pedidos:'', saldo}
    }
    return esquema;
}