import * as React from "react";

import { 
    CardEditorConnected,
    Connector,
    GenericField,
    GenericFieldProperties,
    OptionsInfo,
    renderConnectedApp, 
} from "frontend-plus";

import {
    Box,
    Card,
    Typography,
} from "@mui/material";

// import * as BestGlobals from "best-globals";
import { createIndex } from "like-ar";

import { Persona } from "../common/contracts"
// import { FieldDefinition } from "backend-plus";

// @ts-ignore 
var my=myOwn;

/* Dos líneas para incluir contracts: */
var persona: Persona | null = null;
console.log(persona)

export function NovedadesDisplay(props:{fieldsProps:GenericFieldProperties[], optionsInfo:OptionsInfo}){
    const {fieldsProps, optionsInfo} = props;
    const f = createIndex(fieldsProps, f => f.fd.name)
    const rowsCodNov = optionsInfo.tables!.cod_novedades;
    if (f.cuil == null) return <Card> <Typography>Cargando...</Typography> </Card>
    return <Card style={{width:'auto'}}>
        <Box>
            <GenericField {...f.cuil              }/>
            <GenericField {...f.personal__nomyape }/>
            <GenericField {...f.personal__ficha   }/>
            <GenericField {...f.personal__idmeta4 }/>
        </Box>
        <Box style={{display: 'flex', flexDirection:'row'}}>
            <GenericField {...f.cod_nov   }/>
            <GenericField {...f.cod_novedades__novedad }/>
        </Box>
        <Box>
            <GenericField {...f.desde }/>
            <GenericField {...f.hasta }/>
            { rowsCodNov?.[f.cod_nov.value]?.c_dds ?
            <>
                <GenericField {...f.dds1}/>
                <GenericField {...f.dds2}/>
                <GenericField {...f.dds3}/>
                <GenericField {...f.dds4}/>
                <GenericField {...f.dds5}/>
            </>
            : null}
        </Box>
    </Card>
}

/*
*/

// @ts-ignore
myOwn.wScreens.registroNovedades = function registroNovedades(addrParams:any){
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams, table: 'novedades_registradas' },
        document.getElementById('total-layout')!,
        ({table, fixedFields, conn}) => CardEditorConnected({table, fixedFields, conn, CardDisplay: NovedadesDisplay})
    )
}

