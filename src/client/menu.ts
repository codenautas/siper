"use strict";

import { obtenerDetalleVacaciones } from "./shared-functions";

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
};

myOwn.clientSides.cuil_style = {
    prepare: function (depot, fieldName) {
        const cuilValido = depot.row.cuil_valido;
        const fieldControl = depot.rowControls[fieldName];
        if (cuilValido === false) {
            fieldControl.setAttribute('red-color', 'si');
        }
    },
    update: function (depot, fieldName) {
        const cuilValido = depot.row.cuil_valido;
        const fieldControl = depot.rowControls[fieldName];

        if (fieldControl) {
            // Muestra el valor de cuil
            fieldControl.textContent = depot.row.cuil;

            // Aplica el atributo condicional
            if (cuilValido === false) {
                fieldControl.setAttribute('red-color', 'si');
            } else {
                fieldControl.removeAttribute('red-color');
            }
        } else {
            console.warn(`No se encontró el control para el campo: ${fieldName}`);
        }
    },
};
