import * as React from "react";

import {
    useEffect, useState, 
} from "react";

import { 
    Connector,
    ICON,
    renderConnectedApp
} from "frontend-plus";

import {
    Box,
    Card, 
    Typography, 
    Select, 
    MenuItem, 
    Button, 
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItemButton
} from "@mui/material";

import { date } from "best-globals";

import { CalendarioResult, Annio, meses } from "../common/contracts"
import { createIndex } from "like-ar";

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

type ProvisorioPersonas = {sector:string, idper:string, apellido:string, nombres:string};
type ProvisorioSectores = {sector:string, nombre_sector:string, pertenece_a:string};
type ProvisorioSectoresAumentados = ProvisorioSectores & {perteneceA: Record<string, boolean>}

function ListaPersonasEditables(props: {conn: Connector, sector:string}){
    const {conn} = props;
    const [sector, _setSector] = useState(props.sector);
    const [sectores, setSectores] = useState<ProvisorioSectoresAumentados[]>([]);
    const [_abanicoPersonas, setAvanicoPersonas] = useState<Partial<Record<string, ProvisorioPersonas[]>>>({});
    useEffect(function(){
        conn.ajax.table_data<ProvisorioPersonas>({
            table: 'personas',
            fixedFields: [],
            paramfun: {}
        }).then(async (personas) => {
            var abanico = Object.groupBy(personas, p => p.sector);
            setAvanicoPersonas(abanico);
        })
        conn.ajax.table_data<ProvisorioSectores>({
            table: 'sectores',
            fixedFields: [],
            paramfun: {}
        }).then(async (sectores) => {
            var idxSectores = createIndex(sectores, 'sector');
            var sectoresAumentados = sectores.map(s => ({...s, perteneceA:{[s.sector]: true} as Record<string, boolean>}));
            sectoresAumentados.forEach(s => {
                var {pertenece_a} = s;
                var sigoBuscando = 100
                while (pertenece_a != null && --sigoBuscando) {
                    s.perteneceA[pertenece_a] = true;
                    pertenece_a = idxSectores[pertenece_a].pertenece_a
                }
            })
            setSectores(sectoresAumentados);
        })
    },[]);
    return <Paper>
        {sectores.filter(s => s.perteneceA[sector]).map(s =>
            <Accordion key = {s.sector?.toString()} defaultExpanded = {sector == s.sector}>
                <AccordionSummary id = {s.sector}>{s.sector} <ICON.ChevronLeft/> {s.nombre_sector} </AccordionSummary>
                <AccordionDetails>
                    <List>
                        {_abanicoPersonas[s.sector]?.map(p=>
                            <ListItemButton key = {p.idper}>{p.idper}: {p.apellido}, {p.nombres}</ListItemButton>
                        )}
                    </List>
                </AccordionDetails>
            </Accordion>
        )}
    </Paper>
}

function DemoDeComponentes(props: {conn: Connector}){
    var {conn} = props;
    var [que, setQue] = useState<""|"calendario"|"personas">("");
    return <Paper>
        {({
            "": () => <Card>
                        <Box><Typography>Calendario <Button onClick={_=>setQue("calendario")}>Ver</Button></Typography></Box>
                        <Box><Typography>Lista de personas <Button onClick={_=>setQue("personas")}>Ver</Button></Typography></Box>
                </Card>,
            "calendario": () => <Calendario idper="AR8"/>,
            "personas": () => <ListaPersonasEditables conn = {conn} sector="MS"/>,
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
