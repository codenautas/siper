import * as React from "react";

import {
    ReactNode,
    useEffect, useState, 
} from "react";

import { 
    Connector,
    ICON,
    renderConnectedApp,
    RowType
} from "frontend-plus";

import {
    Accordion, AccordionSummary, AccordionDetails, AppBar,
    Box, Button, 
    Card, 
    IconButton,
    List, ListItemButton,
    MenuItem, 
    Paper,
    Select, 
    Toolbar, Typography, 
} from "@mui/material";

import { date, RealDate } from "best-globals";

import { CalendarioResult, Annio, meses } from "../common/contracts"
import { strict as likeAr, createIndex } from "like-ar";

export function Componente(props:{children:ReactNode[]|ReactNode, componentType:string}){
    return <Card className={"componente-" + props.componentType}>
        {props.children}
    </Card>
}

export function ValueDB(props:{value:any}){
    var {value} = props
    switch(typeof value){
        case "object": if (value == null) return <span/>;
            else if (value instanceof Date) {
                if (
                    // @ts-ignore
                    value.isRealDate
                ) {
                    return <span>{(value as RealDate).toDmy()}</span>
                } else {
                    return <span className="error-valor">{value.toString()}</span>
                }
            } else {
                return <span className="error-valor">{JSON.stringify(value)}</span> 
            }
        case "string": return <span>{value}</span>
        case "number": return <span>{value}</span>
        default: return <span className="error-valor">{value}</span> 
    }
}

export const DDS = {
    0: {abr:'dom', habil:true , nombre:'domingo'  },
    1: {abr:'lun', habil:true , nombre:'lunes'    },
    2: {abr:'mar', habil:true , nombre:'martes'   },
    3: {abr:'mié', habil:true , nombre:'miércoles'},
    4: {abr:'jue', habil:true , nombre:'jueves'   },
    5: {abr:'vie', habil:true , nombre:'viernes'  },
    6: {abr:'sáb', habil:true , nombre:'sábado'   },
}

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
    return <Componente componentType="calendario-mes">
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
            {likeAr(DDS).map(dds =>
                <div className={"calendario-nombre-dia " + (dds.habil ? "" : "tipo-dia-no-laborable")}>{dds.abr}</div>
            ).array()}
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
    </Componente>
}

type ProvisorioPersonas = {sector:string, idper:string, apellido:string, nombres:string};
type ProvisorioSectores = {sector:string, nombre_sector:string, pertenece_a:string};
type ProvisorioSectoresAumentados = ProvisorioSectores & {perteneceA: Record<string, boolean>, nivel:number}

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
            const abanico = Object.groupBy(personas, p => p.sector);
            setAvanicoPersonas(abanico);
        })
        conn.ajax.table_data<ProvisorioSectores>({
            table: 'sectores',
            fixedFields: [],
            paramfun: {}
        }).then(async (sectores) => {
            const idxSectores = createIndex(sectores, 'sector');
            const sectoresAumentados = sectores.map(s => ({...s, nivel:0, perteneceA:{[s.sector]: true} as Record<string, boolean>}));
            sectoresAumentados.forEach(s => {
                var {pertenece_a} = s;
                var nivel = 0
                while (pertenece_a != null && ++nivel < 100) {
                    s.perteneceA[pertenece_a] = true;
                    pertenece_a = idxSectores[pertenece_a].pertenece_a
                }
                s.nivel = nivel;
            })
            setSectores(sectoresAumentados);
        })
    },[]);
    return <Componente componentType="lista-personas">
        {sectores.filter(s => s.perteneceA[sector]).map(s =>
            <Accordion key = {s.sector?.toString()} defaultExpanded = {sector == s.sector}>
                <AccordionSummary id = {s.sector} expandIcon={<ICON.NavigationDown />} > 
                    <span className="box-id" style={{paddingLeft: s.nivel+"em", paddingRight:"1em"}}> {s.sector} </span>  
                    {s.nombre_sector} 
                </AccordionSummary>
                <AccordionDetails>
                    <List>
                        {_abanicoPersonas[s.sector]?.map(p=>
                            <ListItemButton key = {p.idper}>
                                <span className="box-id" style={{minWidth:'3.5em'}}> {p.idper} </span>   
                                {p.apellido}, {p.nombres}
                            </ListItemButton>
                        )}
                    </List>
                </AccordionDetails>
            </Accordion>
        )}
    </Componente>
}

function NovedadesRegistradas(props:{conn: Connector, idper:string}){
    const {idper, conn} = props;
    const [novedades, setNovedades] = useState<RowType[]>([]);
    useEffect(function(){
        conn.ajax.table_data({
            table: 'novedades_registradas',
            fixedFields: [{fieldName:'idper', value:idper}],
            paramfun: {}
        }).then(function(novedadesRegistradas){
            setNovedades(novedadesRegistradas);
        })
    },[idper])
    return <Componente componentType="novedades-registradas">
        <table>
        {novedades.map(n => 
            <tr>
                <td><ValueDB value={n.desde}/></td>
                <td><ValueDB value={n.hasta}/></td>
                <td><ValueDB value={n.cod_nov}/></td>
                <td><ValueDB value={n.cod_novedades__novedad}/></td>
                <td><ValueDB value={n.detalles}/></td>
            </tr>
        )}
        </table>
    </Componente>
}

function Horario(props:{conn: Connector, idper:string, fecha:RealDate}){
    // datos de ejemplo, TODO traerlos de la base
    const {fecha} = props
    const desdeFecha = fecha.sub({days:14});
    const hastaFecha = fecha.add({days:34});
    const horario = [
        {dds:0, trabaja:false, hora_desde:null, hora_hasta:null, cod_nov:null},
        {dds:1, trabaja:true , hora_desde: '9:00', hora_hasta:'16:00', cod_nov:1},
        {dds:2, trabaja:true , hora_desde:'10:00', hora_hasta:'17:00', cod_nov:1},
        {dds:3, trabaja:true , hora_desde: '9:00', hora_hasta:'16:00', cod_nov:1},
        {dds:4, trabaja:true , hora_desde: '9:00', hora_hasta:'16:00', cod_nov:1},
        {dds:5, trabaja:true , hora_desde: '9:00', hora_hasta:'16:00', cod_nov:1},
        {dds:6, trabaja:false, hora_desde:null, hora_hasta:null, cod_nov:null},
    ]
    return <Componente componentType="horario">
        <div>Horario vigente del {desdeFecha.toDmy()} al {hastaFecha.toDmy()}.</div>
        {horario.filter(h => h.trabaja).map(h =>
            <div className={"linea-horario " + (h.trabaja ? "" : "tipo-dia-no-laborable")}>
                {DDS[h.dds as 0|1|2|3|4|5|6].nombre} de {h.hora_desde} a {h.hora_hasta}, novedad {h.cod_nov}
            </div>
        )}
    </Componente>
}

function Persona(props:{conn: Connector, idper:string, fecha:RealDate}){
    return <Paper className="componente-persona">
        <Horario {...props}/>
        <Calendario {...props}/>
        <NovedadesRegistradas {...props}/>
        <NovedadesRegistradas {...props}/>
    </Paper>
}

function DemoDeComponentes(props: {conn: Connector}){
    const {conn} = props;
    type QUE = ""|"calendario"|"personas"|"novedades-registradas"|"horario"|"persona"
    const [que, setQue] = useState<QUE>("");
    const UnComponente = (props:{titulo:string, que:QUE}) =>
        <Box><Typography>{props.titulo}<Button onClick={_=>setQue(props.que)}>Ver</Button></Typography></Box>
    return <Paper>
        <AppBar position="static">
            <Toolbar>
                {que == "" ?
                    null
                : 
                    <IconButton color="inherit" onClick={()=>setQue("")}><ICON.ChevronLeft/></IconButton>
                }
                <Typography flexGrow={2}>
                    Demo de componentes
                </Typography>
                <Typography>
                    {que}
                </Typography>
                {que == "" ?
                    <IconButton color="inherit" onClick={()=>location.hash="i=devel"}><ICON.ExitToApp/></IconButton>
                : 
                    null
                }
            </Toolbar>
        </AppBar>
        {({
            "": () => <Card>
                    <UnComponente titulo="Calendario" que="calendario"/>
                    <UnComponente titulo="Lista de personas" que="personas"/>
                    <UnComponente titulo="Novedades registradas" que="novedades-registradas"/>
                    <UnComponente titulo="Horario" que="horario"/>
                    <UnComponente titulo="Info de una persona" que="persona"/>
                </Card>,
            "calendario": () => <Calendario idper="AR8"/>,
            "personas": () => <ListaPersonasEditables conn={conn} sector="MS"/>,
            "novedades-registradas": () => <NovedadesRegistradas conn={conn} idper="AR8"/>,
            "horario": () => <Horario conn={conn} idper="AR8" fecha={date.today()}/>,
            "persona": () => <Persona conn={conn} idper="AR8" fecha={date.today()}/>
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

// @ts-ignore
myOwn.wScreens.componentesSiper = function componentesSiper(addrParams:any){
    renderConnectedApp(
        myOwn as never as Connector,
        { ...addrParams, table: 'personas' },
        document.getElementById('total-layout')!,
        ({ conn }) => <DemoDeComponentes conn={conn} />
    )
}
