import * as React from "react";

import {
    ReactNode,
    useEffect, useState, 
} from "react";

import { 
    CardEditorConnected, Connector,
    GenericField, GenericFieldProperties,
    ICON,
    OptionsInfo,
    renderConnectedApp,
    RowType
} from "frontend-plus";

import {
    Accordion, AccordionSummary, AccordionDetails, AppBar,
    Box, Button, 
    Card, CircularProgress,
    IconButton, InputBase,
    List, ListItemButton,
    MenuItem, 
    Paper,
    Select, 
    Toolbar, Typography, TextField
} from "@mui/material";

import { date, RealDate } from "best-globals";

import { CalendarioResult, Annio, meses, NovedadesDisponiblesResult, PersonasNovedadActualResult } from "../common/contracts"
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

function Calendario(props:{conn:Connector, idper:string, fecha: RealDate, fechaHasta?: RealDate, onFecha?: (fecha: RealDate) => void, onFechaHasta?: (fechaHasta: RealDate) => void}){
    const {conn, fecha, fechaHasta, idper} = props;
    const [annios, setAnnios] = useState<Annio[]>([]);
    type Periodo = {mes:number, annio:number} 
    const [periodo, setPeriodo] = useState<Periodo>({mes:date.today().getMonth()+1, annio:date.today().getFullYear()});
    const retrocederUnMes = (s:Periodo)=>({mes: (s.mes == 1 ? 12 : s.mes - 1), annio: (s.annio - (s.mes == 1  ? 1 : 0 ))})
    const avanzarUnMes    = (s:Periodo)=>({mes: (s.mes == 12 ? 1 : s.mes + 1), annio: (s.annio + (s.mes == 12 ? 1 : 0 ))})
    // var retrocederUnMes = (s:Periodo)=>({mes: (s.mes == 1 ? 12 : 5), annio: (s.annio - (s.mes == 1  ? 1 : 0 ))})
    // var avanzarUnMes    = (s:Periodo)=>({mes: (s.mes == 12 ? 1 : 5), annio: (s.annio + (s.mes == 12 ? 1 : 0 ))})
    const [calendario, setCalendario] = useState<CalendarioResult[][]>([]);
    useEffect(function(){
        setCalendario([]);
        // ver async
        // @ts-ignore infinito
        conn.ajax.table_data<Annio>({table: 'annios', fixedFields: [],paramfun:{} }).then(annios => {
            setAnnios(annios);
        });
        if (idper != null) conn.ajax.calendario_persona({idper, ...periodo}).then(dias => {
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

    const isInRange = (dia: number, mes: number, annio: number) => {
        if (!fecha || !fechaHasta || !Number.isInteger(dia) || dia <= 0) return false;
        const current = date.ymd(annio, mes as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12, dia);
        return current >= fecha && current <= fechaHasta;
    };

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
                {semana.map(dia => 
                <div 
                    className={`calendario-dia tipo-dia-${dia.tipo_dia} 
                        ${fecha && dia.dia === fecha.getDate() && periodo.mes === fecha.getMonth() + 1 && periodo.annio === fecha.getFullYear() ? 'calendario-dia-seleccionado' : ''}
                        ${fechaHasta && dia.dia === fechaHasta.getDate() && periodo.mes === fechaHasta.getMonth() + 1 && periodo.annio === fechaHasta.getFullYear() ? 'calendario-dia-seleccionado' : ''}
                        ${isInRange(dia.dia, periodo.mes, periodo.annio) ? 'calendario-dia-seleccionado' : ''}`}
                        
                        onClick={() => {
                            if (!dia.dia || !props.onFecha || !props.onFechaHasta) return;
                            const selectedDate = date.ymd(periodo.annio, periodo.mes as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12, dia.dia);
                            const hoy = date.today();
                            if (selectedDate < hoy) return;
                        
                            if (!fechaHasta || selectedDate <= fechaHasta) {
                                props.onFecha(selectedDate);
                                props.onFechaHasta(selectedDate);
                            } 
                            else {
                                props.onFechaHasta(selectedDate);
                            }
                        }}
                    >
                    <span className="calendario-dia-numero">{dia.dia ?? ''}</span>
                    <span className="calendario-dia-contenido">{dia.cod_nov ?? ''}</span>
                </div>)}
            </Box>)}
        </Box>
    </Componente>
}

// @ts-ignore
type ProvisorioPersonas = {sector:string, idper:string, apellido:string, nombres:string, cuil:string, ficha:string, idmeta4:string};
type ProvisorioSectores = {sector:string, nombre_sector:string, pertenece_a:string};
type ProvisorioSectoresAumentados = ProvisorioSectores & {perteneceA: Record<string, boolean>, nivel:number}
// @ts-ignore
type ProvisorioCodNovedades = {cod_nov:string, novedad:string}

type IdperFuncionCambio = (idper:string)=>void

function SearchBox(props: {onChange:(newValue:string)=>void}){
    var [textToSearch, setTextToSearch] = useState("");
    return <Paper sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <ICON.Search/>
        <InputBase
            value = {textToSearch} 
            onChange = {(event)=>{ var newValue = event.target.value; props.onChange(newValue); setTextToSearch(newValue)}}
        />
        <Button onClick={_=>{props.onChange(""); setTextToSearch("")}}><ICON.BackspaceOutlined/></Button>
    </Paper>;
}

function GetRecordFilter<T extends RowType>(filter:string, attributteList:(keyof T)[]){
    if (filter == "") return function(){ return true }
    var f = filter.replace(/[^A-Z0-9 ]+/gi,'');
    var regExp = new RegExp(f.replace(/\s+/, '(\\w* \\w*)+'), 'i');
    return function(row: T){
        return attributteList.some(a => regExp.test(row[a]+''))
    }
}

function ListaPersonasEditables(props: {conn: Connector, sector:string, idper:string, onIdper?:IdperFuncionCambio}){
    const {conn, idper, onIdper} = props;
    const [sector, _setSector] = useState(props.sector);
    const [sectores, setSectores] = useState<ProvisorioSectoresAumentados[]>([]);
    const [listaPersonas, setListaPersonas] = useState<PersonasNovedadActualResult[]>([]);
    const [abanicoPersonas, setAbanicoPersonas] = useState<Partial<Record<string, PersonasNovedadActualResult[]>>>({});
    const [filtro, setFiltro] = useState("");
    const APELLIDOYNOMBRES = 'apellidoynombres' as keyof PersonasNovedadActualResult
    const attributosBuscables:(keyof PersonasNovedadActualResult)[] = ['apellido', 'nombres', 'cuil', 'ficha', 'idmeta4', 'idper', APELLIDOYNOMBRES]
    useEffect(function(){
        console.log(listaPersonas)
        const recordFilter = GetRecordFilter<PersonasNovedadActualResult>(filtro, attributosBuscables);
        const personasFiltradas = listaPersonas.filter(recordFilter)
        var abanico = Object.groupBy(personasFiltradas, p => p.sector);
        setAbanicoPersonas(abanico);
    }, [listaPersonas, filtro])
    useEffect(function(){
        // conn.ajax.table_data<ProvisorioPersonas>({
        //     table: 'personas',
        //     fixedFields: [],
        //     paramfun: {}
        // }).then(async (personas) => {
        //     personas.forEach(p => p[APELLIDOYNOMBRES] = p.apellido+' '+p.nombres+' '+p.apellido)
        //     setListaPersonas(personas);
        // })
        setListaPersonas([])
        conn.ajax.personas_novedad_actual().then(personas => {
            setListaPersonas(personas);
        });
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
        <SearchBox onChange={setFiltro}/>
        {sectores.filter(s => s.perteneceA[sector]).map(s =>
            filtro && !abanicoPersonas[s.sector]?.length ? null :
            <Accordion key = {s.sector?.toString()} defaultExpanded = {sector == s.sector} >
                <AccordionSummary id = {s.sector} expandIcon={<ICON.NavigationDown />} > 
                    <span className="box-id" style={{paddingLeft: s.nivel+"em", paddingRight:"1em"}}> {s.sector} </span>  
                    {s.nombre_sector} 
                </AccordionSummary>
                <AccordionDetails>
                    <List>
                        {abanicoPersonas[s.sector]?.map(p=>
                            <ListItemButton key = {p.idper} onClick={() => {if (onIdper != null) onIdper(p.idper)}} className={`${p.idper == idper ? ' seleccionado' : ''}`}>
                                <span className="box-id"> {p.cod_nov} </span>
                                <div style={{ display: 'flex', flexDirection: 'column'}}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span className="box-id persona-id">{p.idper}</span>
                                        <span>
                                            {p.apellido}, {p.nombres}
                                        </span>
                                    </div>
                                    
                                    <div>
                                        <span>Ficha: {p.ficha}</span> - <span>CUIL: {p.cuil}</span>
                                    </div>
                                </div>
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

function DatosPersonales(props:{conn: Connector, idper:string}){
    const {idper, conn} = props;
    const [persona, setPersona] = useState<RowType>({});
    useEffect(function(){
        conn.ajax.table_data({
            table: 'personas',
            fixedFields: [{fieldName:'idper', value:idper}],
            paramfun: {}
        }).then(function(personas){
            setPersona(personas[0] ?? {});
        })
    },[idper])
    return <Componente componentType="datos-personales">
        <table>
        {["ficha", "cuil", "apellido", "nombres"].map(n => 
            <tr key={n}>
                <td>{n}</td>
                <td><ValueDB value={persona[n]}/></td>
            </tr>
        )}
        </table>
    </Componente>
}

function NovedadesPer(props:{conn: Connector, idper:string, cod_nov:string, paraCargar:boolean, onCodNov?:(codNov:string, conDetalles: boolean)=>void}){
    // @ts-ignore
    const {idper, cod_nov, onCodNov, conn} = props;
    const [codNovedades, setCodNovedades] = useState<NovedadesDisponiblesResult[]>([]);
    const [codNovedadesFiltradas, setCodNovedadesFiltradas] = useState<NovedadesDisponiblesResult[]>([]);
    const [filtro, setFiltro] = useState("");

    useEffect(function(){
        setCodNovedades([])
        if (idper != null) {
            conn.ajax.novedades_disponibles({ idper }).then(novedades => {
                setCodNovedades(novedades);
            });
        }
    },[idper])
    useEffect(function(){
        const recordFilter = GetRecordFilter<NovedadesDisponiblesResult>(filtro,['cod_nov', 'novedad']);
        setCodNovedadesFiltradas(codNovedades.filter(recordFilter))
    },[codNovedades, filtro])
    return <Componente componentType="codigo-novedades">
        <SearchBox onChange={setFiltro}/>
        <List>
            {codNovedadesFiltradas.map(c=>
                <ListItemButton key = {c.cod_nov} 
                    onClick={() => {if (onCodNov != null && c.cargable) onCodNov(c.cod_nov, c.con_detalles)}} 
                    className={`${c.cod_nov == cod_nov ? 'seleccionado' : ''} ${!c.cargable ? 'deshabilitado' : ''}`}
                    disabled={!c.cargable}>
                    <span className="box-id"> {c.cod_nov} </span>   
                    {c.novedad} {c.cantidad > 0 ? `(${c.limite} - ${c.cantidad} = ${c.saldo})`: ''}
                </ListItemButton>
            )}
        </List>
    </Componente>
}

type ProvisorioInfoUsuario = {idper:string, sector:string, fecha:RealDate};

declare module "frontend-plus" {
    interface BEAPI {
        info_usuario: (params: {
            table: string;
        }) => Promise<ProvisorioInfoUsuario>;
        calendario_persona: (params:{

        }) => Promise<any>;
        novedades_disponibles: (params:{

        }) => Promise<any>;
        personas_novedad_actual: () => Promise<any>;
    }
}

function Persona(props:{conn: Connector, idper:string, fecha:RealDate}){
    return <Paper className="componente-persona">
        <DatosPersonales {...props}/>
        <Horario {...props}/>
        <Calendario {...props}/>
        <NovedadesRegistradas {...props}/>
    </Paper>
}

function Pantalla1(props:{conn: Connector}){
    const {conn} = props;
    const [infoUsuario, setInfoUsuario] = useState({} as ProvisorioInfoUsuario);
    const [idper, setIdper] = useState("");
    const [cod_nov, setCodNov] = useState("");
    const [detalles, setDetalles] = useState("");
    const [conDetalles, setConDetalles] = useState(false);
    const [fecha, setFecha] = useState<RealDate>(date.today());
    const [hasta, setHasta] = useState<RealDate>(date.today());
    const [registrandoNovedad, setRegistrandoNovedad] = useState(false);
    const [error, setError] = useState<Error|null>(null);
    useEffect(function(){
        // @ts-ignore
        conn.ajax.info_usuario().then(function(infoUsuario:ProvisorioInfoUsuario){
            setIdper(infoUsuario.idper);
            setInfoUsuario(infoUsuario);
        })
    },[])
    function registrarNovedad(){
        setRegistrandoNovedad(true);
        conn.ajax.table_record_save({
            table:'novedades_registradas',
            primaryKeyValues:[],
            newRow:{idper, desde:fecha, hasta, cod_nov, detalles},
            oldRow:{},
            status:'new'
        }).then(function(result){
            console.log(result)
        }).catch(setError).finally(()=>setRegistrandoNovedad(false));
    }
    function handleCodNovChange(codNov: string, conDetalles: boolean) {
        setCodNov(codNov);
        console.log(conDetalles)
        setConDetalles(conDetalles);
    }

    return infoUsuario.sector == null ?  
            <CircularProgress />
        : <Paper className="componente-pantalla-1">
            <ListaPersonasEditables conn={conn} sector={infoUsuario.sector} idper={idper} onIdper={idper=>setIdper(idper)}/>
            <Paper>
                <Box>
                    {idper}
                </Box>
                <Box>
                    {cod_nov}
                </Box>
                <Calendario conn={conn} idper={idper} fecha={fecha} fechaHasta={hasta} onFecha={setFecha} onFechaHasta={setHasta}/>
                {/* <Calendario conn={conn} idper={idper} fecha={hasta} onFecha={setHasta}/> */}
                <Box>
                    <TextField
                        label="Detalles"
                        placeholder={conDetalles ? "Obligatorio" : ""}
                        multiline
                        rows={4}
                        value={detalles}
                        onChange={(e) => setDetalles(e.target.value)}
                        required={conDetalles}
                        error={conDetalles && !detalles}
                        helperText={conDetalles && !detalles ? "El campo es obligatorio." : ""}
                    />
                </Box>
                <Box>{cod_nov && idper && fecha && hasta && !registrandoNovedad ?
                    <Button key="button" onClick={() => registrarNovedad()}>Registrar Novedad</Button>
                : null}</Box>
                <Box>{registrandoNovedad || error ?
                    <Typography>{error?.message ?? (registrandoNovedad && "registrando..." || "error")}</Typography>
                : null}</Box>
            </Paper>
            <NovedadesPer conn={conn} idper={idper} paraCargar={false} cod_nov={cod_nov} onCodNov={(codNov, conDetalles) => handleCodNovChange(codNov, conDetalles)}/>
        </Paper>;
}


function RegistrarNovedadesDisplay(props:{fieldsProps:GenericFieldProperties[], optionsInfo:OptionsInfo}){
    const {fieldsProps /*, optionsInfo*/} = props;
    const f = createIndex(fieldsProps, f => f.fd.name)
    const [forEdit, setForEdit] = useState(true)
    // const rowsCodNov = optionsInfo.tables!.cod_novedades;
    if (f.idper == null) return <Card> <Typography>Cargando...</Typography> </Card>
    // const novedad = likeAr(f).filter((_, name) => !(/__/.test(name as string))).map(f => f.value).plain() as Partial<any>
    console.log(setForEdit)
    return <Card style={{ width: 'auto' }}>
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '20em',
            }}
        >
            <Box
                sx={{
                    width: '100%',
                }}
            >
                <Box>
                    <GenericField {...f.idper } forEdit={false} />
                    <GenericField {...f.personas__ficha} />
                    <GenericField {...f.personas__apellido} />
                    <GenericField {...f.personas__nombres} />
                </Box>
            </Box>
        
            <Box
                sx={{
                    display: 'flex',
                    flexGrow: 1,
                }}
            >
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',

                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                        <GenericField {...f.cod_nov} forEdit={forEdit}/>
                        <GenericField {...f.cod_novedades__novedad} />
                    </Box>
            
                    <Box>
                        <GenericField {...f.desde} forEdit={forEdit}/>
                        <GenericField {...f.hasta} forEdit={forEdit}/>
                    </Box>
            
                </Box>
            </Box>
        </Box>
    </Card>
}

function RegistrarNovedades(props:{conn: Connector, idper:string}){
    const {idper, conn} = props;
    return CardEditorConnected({
        table:'novedades_registradas', 
        fixedFields:[{fieldName:'idper', value:idper}/*, {fieldName:'desde', value:null}*/], 
        conn, 
        CardDisplay: RegistrarNovedadesDisplay
    });
}

const IDPER_DEMO = "AR8"

function DemoDeComponentes(props: {conn: Connector}){
    const {conn} = props;
    type QUE = ""|"calendario"|"personas"|"novedades-registradas"|"horario"|"persona"|"datos-personales"|"pantalla-1"|"registrar-novedades"|"novedades-per"
    const [que, setQue] = useState<QUE>("");
    const UnComponente = (props:{titulo:string, que:QUE}) =>
        <Box><Typography><Button onClick={_=>setQue(props.que)}>Ver:</Button> {props.titulo}</Typography></Box>
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
                    <Typography>♪ Componentes invididuales</Typography>
                    <UnComponente titulo="Lista de personas" que="personas"/>
                    <UnComponente titulo="Calendario" que="calendario"/>
                    <UnComponente titulo="Novedades registradas" que="novedades-registradas"/>
                    <UnComponente titulo="Horario" que="horario"/>
                    <UnComponente titulo="Datos personales" que="datos-personales"/>
                    <UnComponente titulo="Novedades de Personas" que="novedades-per"/>
                    <hr/>
                    <Typography>🎼 Composición de componentes</Typography>
                    <UnComponente titulo="Info de una persona" que="persona"/>
                    <UnComponente titulo="Pantalla 1 (primera total)" que="pantalla-1"/>
                </Card>,
            "calendario": () => <Calendario conn={conn} idper={IDPER_DEMO} fecha={date.today()}/>,
            "personas": () => <ListaPersonasEditables conn={conn} sector="MS" idper={IDPER_DEMO}/>,
            "novedades-registradas": () => <NovedadesRegistradas conn={conn} idper={IDPER_DEMO}/>,
            "horario": () => <Horario conn={conn} idper={IDPER_DEMO} fecha={date.today()}/>,
            "datos-personales": () => <DatosPersonales conn={conn} idper={IDPER_DEMO}/>,
            "registrar-novedades": () => <RegistrarNovedades conn={conn} idper={IDPER_DEMO}/>,
            "novedades-per": () => <NovedadesPer conn={conn} idper={IDPER_DEMO} cod_nov="101" paraCargar={false}/>,
            "persona": () => <Persona conn={conn} idper={IDPER_DEMO} fecha={date.today()}/>,
            "pantalla-1": () => <Pantalla1 conn={conn}/>
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
