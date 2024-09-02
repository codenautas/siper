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
    })
}

export const fecha = {
    table: 'fechas',
    description: is.object({
        fecha: is.Date,
    },{
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

export const novedades_registradas = {
    table: 'novedades_registradas',
    description: is.object({
        cuil: is.string,
        cod_nov: is.string,
        desde: is.Date,
        hasta: is.Date,
    },{
        dds1: is.boolean,
        dds2: is.boolean,
        dds3: is.boolean,
        dds4: is.boolean,
        dds5: is.boolean,
    })
} satisfies CommonEntityDefinition

export type NovedadRegistrada = DefinedType<typeof novedades_registradas.description>

export const personas = {
    table: 'personal',
    description: is.object({
        cuil:      is.string,
    },{
        ficha:     is.string,
        idmeta4:   is.string,
        nomyape:   is.string,
        sector:    is.string,
        categoria: is.string,
    })
} satisfies CommonEntityDefinition

export type Persona = DefinedType<typeof personas.description>

export const per_gru = {
    table: 'per_gru',
    description: is.object({
        clase: is.string,
        grupo: is.string,
        cuil: is.string
    })
} satisfies CommonEntityDefinition

export type PerGru = DefinedType<typeof per_gru.description>

export const si_cargara_novedad = {
    procedure: 'si_cargara_novedad',
    parameters: is.object({},{
        cuil: is.nullable.string,
        cod_nov: is.nullable.string,
        desde: is.Date,
        hasta: is.Date,
        dds1: is.nullable.boolean,
        dds2: is.nullable.boolean,
        dds3: is.nullable.boolean,
        dds4: is.nullable.boolean,
        dds5: is.nullable.boolean,
    }),
    result: is.object({
        dias_corridos: is.number,
        dias_habiles: is.number,
        dias_coincidentes: is.number,
    },{})
}

export const calendario_persona = {
    procedure: 'calendario_persona',
    parameters: is.object({
        cuil: is.string,
        annio: is.number,
        mes: is.number
    }),
    result: is.object({
        dia: is.number,
        dds: is.number,
        semana: is.number,
        cod_nov: is.string,
        tipo_dia: is.string
    })
}

export type CalendarioResult = DefinedType<typeof calendario_persona.result>