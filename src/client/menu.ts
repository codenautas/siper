"use strict";
function obtenerDetalleVacaciones(row:any){
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

// @ts-expect-error no conoce en este punto el TypeStore
TypeStore.type.text.postInputs.soloDigitos = 
    function toUpperWithoutDiacritics(textWithValue: string){
        return textWithValue.toUpperCase()
            .replace(/[^0-9_]/g, '').replace(/^0+(\d)/,'$1');
};

// @ts-expect-error no conoce en este punto el TypeStore
TypeStore.type.text.postInputs.sinMinusculasNiAcentos = 
    function sinMinusculasNiAcentos(textWithValue: string){
        return textWithValue.toUpperCase()
            .replace(/[áÁàÀ]/g,'A')
            .replace(/[éÉèÈ]/g,'E')
            .replace(/[íÍìÌ]/g,'I')
            .replace(/[óÓòÒ]/g,'O')
            .replace(/[úÚùÙüÜ]/g,'U')
            .replace(/[ñ]/g,'Ñ')
            .replace(/[^A-Z0-9 ]/g,'_');
};

    // @ts-expect-error no conoce en este punto el TypeStore
TypeStore.type.text.postInputs.sinMinusculas = 
function sinMinusculasNiAcentos(textWithValue: string){
    return textWithValue.toUpperCase()
        .replace(/[ñ]/g,'Ñ');
};

myOwn.clientSides.detalle_dias = {
    update: function(){},
    prepare: function(depot, fieldName){
        // @ts-ignore
        myOwn.agregar_json(depot.rowControls[fieldName], obtenerDetalleVacaciones(depot.row));
    }
}

myOwn.wScreens.principal=async function(){
    history.replaceState(null, '', `${location.origin+location.pathname}/../react`);
    location.reload();
}