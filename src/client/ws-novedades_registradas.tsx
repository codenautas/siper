import * as React from "react";

import {
    useEffect, useState, 
} from "react";

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
import { strict as likear, createIndex } from "like-ar";
import * as json4all from "json4all";

// import { guarantee } from "guarantee-type"

import { NovedadRegistrada } from "../common/contracts"

// @ts-ignore 
var my=myOwn;

function DiasHabiles(props:{novedad:Partial<NovedadRegistrada>}){
    const {novedad} = props;
    const leyendaVacia = {leyenda:"ingrese desde hasta para calcular días hábiles"}; 
    const leyendaCalculando = {leyenda:"calculando..."};
    const [leyenda, setLeyenda] = useState({leyenda:"..."})
    useEffect(()=>{
        if (novedad.desde == null || novedad.hasta == null) {
            setLeyenda(leyendaVacia);
        } else {
            setLeyenda(leyendaCalculando);
            my.ajax.si_cargara_novedad(novedad).then(setLeyenda, setLeyenda)
        }
    },[json4all.toUrl(novedad)]);
    return <Typography>{leyenda.leyenda}</Typography>
}

function NovedadesDisplay(props:{fieldsProps:GenericFieldProperties[], optionsInfo:OptionsInfo}){
    const {fieldsProps, optionsInfo} = props;
    const f = createIndex(fieldsProps, f => f.fd.name)
    const rowsCodNov = optionsInfo.tables!.cod_novedades;
    if (f.cuil == null) return <Card> <Typography>Cargando...</Typography> </Card>
    const novedad = likear(f).filter((_, name) => !(/__/.test(name as string))).map(f => f.value).plain() as Partial<NovedadRegistrada>
    const c_dds = !!rowsCodNov?.[f.cod_nov.value]?.c_dds;
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
            { c_dds ?
            <>
                <GenericField {...f.dds1}/>
                <GenericField {...f.dds2}/>
                <GenericField {...f.dds3}/>
                <GenericField {...f.dds4}/>
                <GenericField {...f.dds5}/>
            </>
            : null}
        </Box>
        <Box>
            <DiasHabiles novedad={novedad} />
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

