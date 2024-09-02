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

import { date } from "best-globals";
import { strict as likear, createIndex } from "like-ar";
import * as json4all from "json4all";

import { NovedadRegistrada, CalendarioResult } from "../common/contracts"

// @ts-ignore 
var my=myOwn;

function DiasHabiles(props:{novedad:Partial<NovedadRegistrada>}){
    const {novedad} = props;
    const leyendaVacia = {leyenda:"ingrese desde hasta para calcular días hábiles"}; 
    const leyendaCalculando = {leyenda:"calculando..."};
    const [leyenda, setLeyenda] = useState({leyenda:"..."})
    const grabado = true;
    useEffect(()=>{
        if (novedad.desde == null || novedad.hasta == null) {
            setLeyenda(leyendaVacia);
        } else {
            setLeyenda(leyendaCalculando);
            my.ajax.si_cargara_novedad(novedad).then(
                info => {
                    setLeyenda({leyenda: `${info.dias_habiles} días hábiles (${info.dias_corridos} días corridos)${
                        !grabado && info.dias_coincidentes?` Atención hay ${info.dias_coincidentes} días que coinciden con una carga anterior`:``
                    }.`})
                },
                err => {
                    setLeyenda({leyenda: err.message})
                }
            )
        }
    },[json4all.toUrl(novedad)]);
    return <Typography>{leyenda.leyenda}</Typography>
}

function Calendario(props:{cuil:string}){
    const {cuil} = props;
    const [periodo, _setPeriodo] = useState({mes:date.today().getMonth()+1, annio:date.today().getFullYear()});
    const [calendario, setCalendario] = useState<CalendarioResult[][]>([]);
    useEffect(function(){
        setCalendario([]);
        if (cuil != null) my.ajax.calendario_persona({cuil, ...periodo}).then(dias => {
            var semanas = [];
            var semana = [];
            for(var i = 0; i < dias[0].dds; i++) {
                semana.push({});
            }
            for(var dia of dias){
                semana.push(dia);
                if (dia.dds == 6) {
                    semanas.push(semana);
                    semana = []
                }
            }
            if (dia.dds != 6) {
                for(var j = dias[0].dds + 1; j < 6; j++) {
                    semana.push({});
                }
                semanas.push(semana);
            }
            setCalendario(semanas)
        })

    },[cuil, periodo.mes, periodo.annio])
    return <Card className="calendario-mes">
        <Box className="calendario-semana">
            <div className="calendario-nombre-dia tipo-dia-no-laborable">dom</div>
            <div className="calendario-nombre-dia">lun</div>
            <div className="calendario-nombre-dia">mar</div>
            <div className="calendario-nombre-dia">mié</div>
            <div className="calendario-nombre-dia">jue</div>
            <div className="calendario-nombre-dia">vie</div>
            <div className="calendario-nombre-dia tipo-dia-no-laborable">sáb</div>
        </Box>
        {calendario.map(semana => <Box className="calendario-semana">
            {semana.map(dia => <div className={`calendario-dia tipo-dia-${dia.tipo_dia}`}>
                <span className="calendario-dia-numero">{dia.dia ?? ''}</span>
                <span className="calendario-dia-contenido">{dia.cod_nov ?? ''}</span>
            </div>)}
        </Box>)}
    </Card>
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
        <Calendario cuil={f.cuil.value} />
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

