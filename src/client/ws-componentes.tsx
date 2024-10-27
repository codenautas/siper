import * as React from "react";

import {
    useEffect, useState, 
} from "react";

import { 
    Connector,
    ICON,
    renderConnectedApp, 
} from "frontend-plus";

import {
    Box,
    Card, 
    Typography, 
    Select, 
    MenuItem, 
    Button, 
    Paper
} from "@mui/material";

import { date } from "best-globals";

import { CalendarioResult, Annio, meses } from "../common/contracts"

// @ts-ignore 
var my=myOwn;

function Calendario(props:{idper:string}){
    const {idper} = props;
    const [annios, setAnnios] = useState<Annio[]>([]);
    type Periodo = {mes:number, annio:number} 
    const [periodo, setPeriodo] = useState<Periodo>({mes:date.today().getMonth()+1, annio:date.today().getFullYear()});
    const retrocederUnMes = (s:Periodo)=>({mes: (s.mes == 1 ? 12 : s.mes - 1), annio: (s.annio - (s.mes == 1  ? 1 : 0 ))})
    const avanzarUnMes    = (s:Periodo)=>({mes: (s.mes == 12 ? 1 : s.mes + 1), annio: (s.annio + (s.mes == 12 ? 1 : 0 ))})
    // var retrocederUnMes = (s:Periodo)=>({mes: (s.mes == 1 ? 12 : 5), annio: (s.annio - (s.mes == 1  ? 1 : 0 ))})
    // var avanzarUnMes    = (s:Periodo)=>({mes: (s.mes == 12 ? 1 : 5), annio: (s.annio + (s.mes == 12 ? 1 : 0 ))})
    const [calendario, setCalendario] = useState<CalendarioResult[][]>([]);
    const [diaSeleccionado, setDiaSeleccionado] = useState<{ dia: number | null, mes: number | null, annio: number | null, cod_nov?: string }>({ dia: null, mes: null, annio: null });
    useEffect(function(){
        setCalendario([]);
        // ver async
        my.ajax.table_data({table: 'annios', fixedFields: [],paramfun:{} }).then(_annios => {
            setAnnios(_annios);
        });
        if (idper != null) my.ajax.calendario_persona({idper, ...periodo}).then(dias => {
            var semanas = [];
            var semana = [];
            for(var i = 0; i < dias[0].dds; i++) {
                semana.push({});
            }
            for(var dia of dias){
                if (dia.dds == 0 && dia.dia !=1) {
                    semanas.push(semana);   
                    semana = []
                }
                semana.push(dia);
            }
            for(var j = dia.dds + 1; j <= 6; j++) {
                semana.push({});
            }
            semanas.push(semana);
            setCalendario(semanas)
        })

    },[idper, periodo.mes, periodo.annio])
    return <Card className="calendario-mes">
        <Box style={{ flex:1}}>
        <Box>
            <Button onClick={_ => setPeriodo(retrocederUnMes)}><ICON.ChevronLeft/></Button>
            <Button onClick={_ => setPeriodo(avanzarUnMes)}><ICON.ChevronRight/></Button>
            <Select 
                value={periodo.mes}
                onChange={(event) => { // buscar el tipo correcto
                    setPeriodo({mes:Number(event.target.value), annio:periodo.annio});
                }}
            >
                {meses.map((mes) => (
                    <MenuItem key={mes.value} value={mes.value}>
                        {mes.name}
                    </MenuItem>
                ))}
            </Select>
            <Select 
                value={periodo.annio}
                onChange={(event) => { // buscar el tipo correcto
                    setPeriodo({mes:periodo.mes, annio:Number(event.target.value)});
                }}
            >
                {
                    // @ts-ignore
                    annios.map((annio:Annio) => (
                    <MenuItem key={annio.annio} value={annio.annio}>
                        {annio.annio.toString()}
                    </MenuItem>
                ))
                    }
            </Select>
        </Box>
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
            {semana.map(dia => <div className={`calendario-dia tipo-dia-${dia.tipo_dia} ${
                diaSeleccionado.dia === dia.dia && diaSeleccionado.mes === periodo.mes && diaSeleccionado.annio === periodo.annio? 'calendario-dia-seleccionado' : ''
              }`}
              onClick={() => setDiaSeleccionado({ dia: dia.dia, mes: periodo.mes, annio: periodo.annio, cod_nov: dia.cod_nov })}
              >
                <span className="calendario-dia-numero">{dia.dia ?? ''}</span>
                <span className="calendario-dia-contenido">{dia.cod_nov ?? ''}</span>
            </div>)}
        </Box>)}
        </Box>
        <Box>
        {diaSeleccionado.cod_nov && (
          <div>
            <p><strong>Codigo:</strong> {diaSeleccionado.cod_nov}</p>
          </div>
        )}
      </Box>
    </Card>
}

function DemoDeComponentes(props: { conn: Connector }){
    var conn = { props };
    var [que, setQue] = useState<""|"calendario">("");
    console.log(conn);
    return <Paper>
        {({
            "": () => <Card>
                        <Box><Typography>Calendario </Typography><Button onClick={_=>setQue("calendario")}>Ver</Button></Box>
                </Card>,
            "calendario": () => <Calendario idper="AR8"/>,
        })[que]()}
    </Paper>
}

// @ts-ignore
myOwn.wScreens.componentesSiper = function componentesSiper(addrParams:any){
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams, table: 'personas' },
        document.getElementById('total-layout')!,
        ({ conn }) => <DemoDeComponentes conn={conn} />
    )
}
