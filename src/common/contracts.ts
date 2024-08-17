import { DefinedType, is } from 'guarantee-type'

export const personaDescriptor = is.object({
    cuil:      is.string,
    ficha:     is.optional.string,
    idmeta4:   is.optional.string,
    nomyape:   is.optional.string,
    sector:    is.optional.string,
    categoria: is.optional.string,
})

export type Persona = DefinedType<typeof personaDescriptor>;