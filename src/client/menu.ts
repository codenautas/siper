"use strict";
import {DateTime, date} from "best-globals";
import {html} from "js-to-html"
import * as likeAr from "like-ar";

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
}

function timeStampHtml(timestamp: DateTime){
    const today = date.today()
    if (timestamp.toDmy() == today.toDmy()) {
        return html.span({class:'ts-time', title:timestamp.toLocaleString()}, [timestamp.toHm()])
    } else if (timestamp.getFullYear() == today.getFullYear()) {
        return html.span({class:'ts-sameyear', title:timestamp.toLocaleString()}, [timestamp.toDmy().replace(/[-/]\d+$/,'')])
    } else {
        return html.span({class:'ts-otheryear', title:timestamp.toLocaleString()}, [timestamp.toDmy()])
    }
}

myOwn.clientSides.timestamp = {
    prepare: function(depot, fieldName){
        const control = depot.rowControls[fieldName];
        if (control.disabled) {
            const timestamp = depot.row[fieldName];
            control.innerHTML = "";
            if (timestamp) {
                control.appendChild(timeStampHtml(timestamp).create())
            }
        }
    }
}

myOwn.clientSides.timestamp.update = myOwn.clientSides.timestamp.prepare;

const getSubirArchivoPathAndParams = (depot: myOwn.Depot) => ({
    ajaxPath: 'archivo_subir',
    params: {
        idper: depot.row.idper?.toString(), // ID de la persona
        tipo_adjunto_persona: depot.row.tipo_adjunto_persona?.toString(), // Tipo de adjunto
        numero_adjunto: depot.row.numero_adjunto?.toString(), // Número de adjunto    
    },
});

myOwn.clientSides.subirAdjunto = {
    prepare: function (depot: myOwn.Depot, fieldName: string) {
        const botonSubirArchivo = html.button('Subir archivo').create();

        // Verifica que el archivo no esté ya cargado
        if (depot.row.archivo_nombre == null) {
            depot.rowControls[fieldName].appendChild(botonSubirArchivo);

            botonSubirArchivo.addEventListener('click', async function () {
                const { ajaxPath, params } = getSubirArchivoPathAndParams(depot);

                // Verifica que los parámetros necesarios estén definidos
                if (!params.idper || !params.tipo_adjunto_persona || !params.numero_adjunto) {
                    alert("Faltan parámetros necesarios para subir el archivo.");
                    return;
                }

                my.dialogUpload(
                    [ajaxPath],
                    params,
                    function (result: { nombre: string; message: string; updatedRow: Record<string, string> }) {
                        depot.row.archivo_nombre = result.updatedRow.archivo_nombre;
                        depot.rowControls.archivo_nombre.setTypedValue(result.nombre);
                        botonSubirArchivo.disabled = true;
                        const grid = depot.manager;
                        grid.depotRefresh(depot, result.updatedRow);
                        return result.message;
                    },
                    false,
                    {
                        importDataFromFile: 'Seleccione un archivo',
                        import: 'Cargar',
                    }
                );
            });
        }
    },
    update: function (depot: myOwn.Depot) {
        const grid = depot.manager;

        likeAr(depot.rowControls).forEach((control, _i) => {
            control.onpaste = async function (e: ClipboardEvent) {
                if (e.clipboardData) {
                    const items = e.clipboardData.items;
                    if (!items) return;

                    let isFileUploaded = false;

                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];

                        const file = item.getAsFile();
                        if (file) {
                            let myDepot = depot;
                            let promiseChain = Promise.resolve();

                            if (depot.row.archivo_nombre) {
                                promiseChain = promiseChain.then(async () => {
                                    await confirmPromise("La fila ya contiene un archivo adjunto. ¿Desea crear una nueva fila?");
                                    myDepot = grid.createRowInsertElements(null, depot);
                                });
                            }

                            await promiseChain;

                            const { ajaxPath, params } = getSubirArchivoPathAndParams(myDepot);

                            // Sube el archivo al servidor
                            const { updatedRow } = await my.ajax[ajaxPath]({
                                ...params,
                                files: [file],
                            });

                            // Refresca la grilla con la fila actualizada
                            grid.depotRefresh(myDepot, updatedRow, { noDispatchEvents: false });

                            isFileUploaded = true;
                        }
                    }

                    if (isFileUploaded) {
                        e.preventDefault();
                    }
                }
            };
        });
    },
};

myOwn.clientSides.bajarAdjunto = {
    update: function (depot: myOwn.Depot, fieldName: string): void {
        const td = depot.rowControls[fieldName];
        td.innerHTML = '';
        if (depot.row.archivo_nombre) {
            const fileParts = depot.row.archivo_nombre.split('/');
            const fileName = fileParts.pop();
            if (fileName) {
                td.appendChild(
                    html
                        .a({
                            class: 'link-descarga-archivo',
                            href: `download/file?idper=${depot.row.idper}&tipo_adjunto_persona=${depot.row.tipo_adjunto_persona}&numero_adjunto=${depot.row.numero_adjunto}`,
                            download: fileName,
                        },
                            "Descargar archivo"
                        ).create()
                );
            }
        }
    },
    prepare: function (_depot: myOwn.Depot, _fieldName: string): void {
    },
};

