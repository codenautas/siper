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
        idper: depot.row.idper, // ID de la persona
        tipo_adjunto: depot.row.tipo_adjunto, // Tipo de adjunto
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
                if (!params.idper || !params.tipo_adjunto || !params.numero_adjunto) {
                    const missingParams = [];
                    if (!params.idper) missingParams.push("ID de la persona (idper)");
                    if (!params.tipo_adjunto) missingParams.push("Tipo de adjunto (tipo_adjunto)");
                    if (!params.numero_adjunto) missingParams.push("Número de adjunto (numero_adjunto)");
                
                    alert(`Faltan los siguientes parámetros necesarios para subir el archivo:\n- ${missingParams.join("\n- ")}`);
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
        const row = depot.row;
        if (row.archivo_nombre) {
            const fileParts = depot.row.archivo_nombre.split('/');
            const fileName = String(fileParts.pop());
            if (fileName) {
                const baseUrl = (window as any).myOwn?.config?.config?.baseUrl || '';
                const params = new URLSearchParams({
                    idper: String(row.idper),
                    tipo_adjunto: String(row.tipo_adjunto ?? ''),
                    numero_adjunto: row.numero_adjunto == null ? '' : String(row.numero_adjunto),
                });

                td.appendChild(
                    html
                        .a({
                            class: 'link-descarga-archivo',
                            href: `${baseUrl}/download/file?${params.toString()}`,
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

