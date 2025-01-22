import { DefinedType, Description, is } from 'guarantee-type'

type CommonEntityDefinition = {
    table: string
    description: Description
}

export const cod_nov = {
    table: 'cod_novedades',
    description: is.object({
        cod_nov: is.string,
        novedad: is.string,
        con_detalles: is.nullable.boolean,
        total: is.nullable.boolean,
        parcial: is.nullable.boolean,
    })
}
export type CodNovedades = DefinedType<typeof cod_nov.description>

export const fecha = {
    table: 'fechas',
    description: is.object({
        fecha: is.Date,
        laborable: is.nullable.boolean,
        repite: is.nullable.boolean,
        inamovible: is.nullable.boolean,
        leyenda: is.string
    })
}

export const grupos = {
    table: 'grupos',
    description: is.object({
        clase: is.string,
        grupo: is.string
    })
} satisfies CommonEntityDefinition

export type Grupo = DefinedType<typeof grupos.description>

export const nov_gru = {
    table: 'nov_gru',
    description: is.object({
        annio: is.number,
        clase: is.string,
        grupo: is.string,
        cod_nov: is.string,
        maximo: is.number,
    })
} satisfies CommonEntityDefinition

export type NovGru = DefinedType<typeof nov_gru.description>

export const nov_per = {
    table: 'nov_per',
    description: is.object({
        año: is.number,
        cod_nov: is.string,
        idper: is.string,
        cantidad: is.number,
        limite: is.number,
        saldo: is.number,
    })
} satisfies CommonEntityDefinition

export type NovPer = DefinedType<typeof nov_per.description>

export const per_nov_cant = {
    table: 'per_nov_cant',
    description: is.object({
        annio: is.number,
        cod_nov: is.string,
        idper: is.string,
        origen: is.string,
        cantidad: is.number,
    })
} satisfies CommonEntityDefinition

export type PerNovCant = DefinedType<typeof per_nov_cant.description>

export const novedades_registradas = {
    table: 'novedades_registradas',
    description: is.object({
        idper: is.string,
        desde: is.Date,
        hasta: is.Date,
        cod_nov: is.nullable.string,
        prioridad: is.nullable.number,
        cancela: is.nullable.boolean,
        dds0: is.nullable.boolean,
        dds1: is.nullable.boolean,
        dds2: is.nullable.boolean,
        dds3: is.nullable.boolean,
        dds4: is.nullable.boolean,
        dds5: is.nullable.boolean,
        dds6: is.nullable.boolean,
        detalles: is.nullable.string
    })
} satisfies CommonEntityDefinition

export type NovedadRegistrada = DefinedType<typeof novedades_registradas.description>

export const novedades_horarias = {
    table: 'novedades_horarias',
    description: is.object({
        idper: is.string,
        fecha: is.Date,
        desde_hora: is.nullable.string,
        hasta_hora: is.nullable.string,
        cod_nov: is.string,
        detalles: is.nullable.string,
    })
} satisfies CommonEntityDefinition

export type NovedadHoraria = DefinedType<typeof novedades_horarias.description>

export const horarios = {
    table: 'horarios',
    description: is.object({
        idper: is.string,
        dds: is.number,
        desde: is.Date,
        hora_desde: is.string,
        hora_hasta: is.string,
        trabaja: is.boolean,
        hasta: is.Date,
    })
} satisfies CommonEntityDefinition

export type Horarios = DefinedType<typeof horarios.description>

export const personas = {
    table: 'personas',
    description: is.object({
        idper:     is.string,
        ficha:     is.nullable.string,
        cuil:      is.string,
        idmeta4:   is.nullable.string,
        apellido:  is.string,
        nombres:   is.string,
        sector:    is.nullable.string,
        categoria: is.nullable.string,
        registra_novedades_desde: is.nullable.Date,
        para_antiguedad_relativa: is.nullable.Date,
        activo:    is.nullable.boolean,
        fecha_ingreso: is.nullable.Date,
        fecha_egreso : is.nullable.Date,
    })
} satisfies CommonEntityDefinition

export type Persona = DefinedType<typeof personas.description>

export const per_gru = {
    table: 'per_gru',
    description: is.object({
        clase: is.string,
        grupo: is.string,
        idper: is.string
    })
} satisfies CommonEntityDefinition

export type PerGru = DefinedType<typeof per_gru.description>

export const sectores = {
    table: 'sectores',
    description: is.object({
        sector: is.string,
        nombre_sector: is.string,
        pertenece_a: is.nullable.string
    })
}

export const usuarios = {
    table: 'usuarios',
    description: is.object({
        usuario: is.string
    })
}

export type Usuario = DefinedType<typeof usuarios.description>

export const capacitaciones = {
    table: 'capacitaciones',
    description: is.object({
        editable: is.boolean,
        capacitacion: is.nullable.string,
        modalidad: is.nullable.string,
        tipo: is.nullable.string,
        puntos: is.nullable.number,
        duracion: is.nullable.string,
        dictado_por: is.nullable.string,
        fecha_inicio: is.nullable.Date,
        fecha_fin: is.nullable.Date
    })
}

export const per_capa = {
    table: 'per_capa',
    description: is.object({
        idper:      is.string,
        //año: is.number,
        editable: is.boolean,
        capacitacion: is.nullable.string,
        modalidad: is.nullable.string,
        tipo: is.nullable.string,
        fecha_inicio: is.nullable.Date,
        fecha_fin: is.nullable.Date,
        inscripcion: is.nullable.string,
        calificacion: is.nullable.string,
    })
}

export const historial_contrataciones = {
    table: 'historial_contrataciones',
    description: is.object({
        idper: is.string,
        desde: is.Date,
        hasta: is.nullable.Date,
        computa_antiguedad: is.nullable.boolean,
        organismo: is.nullable.string,
        observaciones: is.nullable.string,
    })
} satisfies CommonEntityDefinition

export type Historial_contratacion = DefinedType<typeof historial_contrataciones.description>

////////////// PROCEDIMEINTOS

export const si_cargara_novedad = {
    procedure: 'si_cargara_novedad',
    parameters: is.object({
        idper: is.nullable.string,
        cod_nov: is.nullable.string,
        desde: is.Date,
        hasta: is.Date,
        cancela: is.nullable.boolean
    }),
    result: is.object({
        mensaje: is.string,
        dias_corridos: is.number,
        dias_habiles: is.number,
        dias_coincidentes: is.number,
        con_detalles: is.nullable.boolean,
    })
}

export const novedades_disponibles = {
    procedure: 'novedades_disponibles',
    parameters: is.object({
        idper: is.string,
    }),
    result: is.object({
        cod_nov: is.string,
        novedad: is.nullable.string,
        con_detalles: is.nullable.boolean,
        cantidad: is.nullable.number,
        limite: is.nullable.number,
        saldo: is.nullable.number,
        con_disponibilidad: is.nullable.boolean,
        c_dds: is.nullable.boolean,
    })
}

export type NovedadesDisponiblesResult = DefinedType<typeof novedades_disponibles.result>

export const personas_novedad_actual = {
    procedure: 'personas_novedad_actual',
    result: is.object({
        cod_nov: is.string,
        novedad: is.nullable.string,
        idper: is.string,
        cuil: is.string,
        ficha: is.nullable.string,
        idmeta4: is.nullable.string,
        apellido: is.string,
        nombres: is.string,
        sector: is.string,
        cargable: is.boolean,
    })
}

export type PersonasNovedadActualResult = DefinedType<typeof personas_novedad_actual.result>


export const calendario_persona = {
    procedure: 'calendario_persona',
    parameters: is.object({
        idper: is.string,
        annio: is.number,
        mes: is.number
    }),
    result: is.object({
        dia: is.number,
        dds: is.number,
        semana: is.number,
        cod_nov: is.string,
        tipo_dia: is.string,
        prioridad: is.nullable.number
    })
}

export type CalendarioResult = DefinedType<typeof calendario_persona.result>

export const horario_semana_vigente = {
    procedure: 'horario_semana_vigente',
    parameters: is.object({
        idper: is.string,
        fecha: is.string,
    }),
    result: is.object({
        dds: is.number,
        trabaja: is.boolean,
        desde: is.Date,
        hasta: is.Date,
        hora_desde: is.nullable.string,
        hora_hasta: is.nullable.string,
        cod_nov: is.nullable.string,
    }),
};

export const historico_persona = {
    procedure: 'historico_persona',
    parameters: is.object({
        idper: is.string,
        annio: is.number,
        mes: is.number
    }),
    result: is.object({
        fecha: is.Date,
        cod_nov: is.string,
        novedad: is.string,
    })
}

export type HistoricoResult = DefinedType<typeof historico_persona.result>

export const annio = {
    table: 'annio',
    description: is.object({
        annio: is.number,
        cerrado: is.boolean
    })
} satisfies CommonEntityDefinition

export type Annio = DefinedType<typeof annio.description>

export const tipos_doc = {
    table: 'tipos_doc',
    description: is.object({
        tipo_doc: is.string,
        documento: is.string
    })
} satisfies CommonEntityDefinition

export type Tipos_doc = DefinedType<typeof tipos_doc.description>

export const paises = {
    table : 'paises',
    description: is.object({
        pais: is.string,
        codigoagip: is.string,
        nombre_pais: is.string,
        gentilicio: is.string,
        orden: is.number
    })
}

export type Paises = DefinedType<typeof paises.description>

export const sexos = {
    table : 'sexos',
    description: is.object({
        sexo: is.string,
        descripcion: is.string
    })
}

export type sexos = DefinedType<typeof sexos.description>

export const estados_civiles = {
    table : 'estado_civil',
    description : is.object({
        estado_civil: is.string,
        estadoagip: is.number,
        descripcion: is.string
    })
}

export type estados_civiles = DefinedType<typeof estados_civiles.description>

export const agrupamientos = {
    table : 'agrupamientos',
    description : is.object({
        agrupamiento: is.string,
        descripcion: is.string
    })
}

export type agrupamientos = DefinedType<typeof agrupamientos.description>

export const tramos = {
    table : 'tramos',
    description : is.object({
        tramo: is.string,
        descripcion: is.string
    })
}

export type tramos = DefinedType<typeof tramos.description>

export const grados = {
    table : 'grados',
    description : is.object({
        tramo: is.string,
        grado: is.string,
        descripcion: is.string
    })
}

export type grados = DefinedType<typeof grados.description>

export const categorias = {
    table : 'categorias',
    description : is.object({
        categoria: is.string,
        descripcion: is.string
    })
}

export type categorias = DefinedType<typeof categorias.description>

export const situacion_revista = {
    table : 'situacion_revista',
    description : is.object({
        situacion_revista: is.string,
        codigo_agip: is.number,
        con_novedad: is.boolean
    })
}

export type situacion_revista = DefinedType<typeof situacion_revista.description>

export const motivos_egreso = {
    table : 'motivos_egreso',
    description : is.object({
        motivo_egreso_agip : is.number,
        motivo_egreso : is.string,
        descripcion : is.string
    })
}

export type motivos_egreso = DefinedType<typeof motivos_egreso.description>

export const jerarquias = {
    table : 'jerarquias',
    description : is.object({
        jerarquia_agip : is.string,
        jerarquia : is.string,
        descripcion : is.string
    })
}

export type jerarquias = DefinedType<typeof jerarquias.description>

export const meses = [
    {  value:1, name:'enero' },
    {  value:2, name:'febrero' },
    {  value:3, name:'marzo' },
    {  value:4, name:'abril' },
    {  value:5, name:'mayo' },
    {  value:6, name:'junio' },
    {  value:7, name:'julio' },
    {  value:8, name:'agosto' },
    {  value:9, name:'septiembre' },
    {  value:10, name:'octubre' },
    {  value:11, name:'noviembre' },
    {  value:12, name:'diciembre' }]

//////////// ERRORES POSTGRES PROPIOS:
export const ERROR_REFERENCIA_CIRCULAR_EN_SECTORES = 'P1001';
export const ERROR_NO_SE_PUEDE_CARGAR_EN_EL_PASADO = 'P1002';
export const ERROR_COD_NOVEDAD_INDICA_CON_DETALLES = 'P1003';
export const ERROR_COD_NOVEDAD_INDICA_SIN_DETALLES = 'P1004';
export const ERROR_COD_NOVEDAD_NO_INDICA_TOTAL     = 'P1005';
export const ERROR_COD_NOVEDAD_NO_INDICA_PARCIAL   = 'P1006';
export const ERROR_COD_NOVEDAD_NO_INDICA_CON_HORARIO= 'P1007';
export const ERROR_COD_NOVEDAD_NO_INDICA_CON_NOVEDAD= 'P1008';

//////////// ERRORES POSTGRES:
export const insufficient_privilege = '42501';
export const check_sin_superponer = '23P01';
