type queryFunction = ($: any, p: string, v: any) => any;
type Filters = { [key: string]: queryFunction };
type httpParams = { [key: string]: any };

type FilterMapValue = {
    query: queryFunction;
    dbIdentifier: string;
};

type FilterHashMap = { [httpParam: string]: FilterMapValue };

/**
 * Transforma el objeto Filters en un HashMap para una búsqueda O(1).
 * La clave del mapa es el parámetro HTTP (ej: 'cod_servicio').
 */
function mapOfFilters(filters: Filters): FilterHashMap {
    const filterMap: FilterHashMap = {};

    for (const [f, query] of Object.entries(filters)) {
        // 1. Obtiene los identificadores de DB completos (ej: 's.cod_servicio')
        const cleanKeys = f.trim().replace(/\s+/g, '').split(',');

        for (const fullDbIdentifier of cleanKeys) {
            // 2. Extrae el identificador HTTP (ej: 'cod_servicio')
            const httpParamIdentifier = fullDbIdentifier.split('.').pop();
            
            if (httpParamIdentifier) {
                // 3. Llena el mapa para permitir la búsqueda directa.
                // Si hay un conflicto (dos filtros apuntan al mismo httpParam),
                // el último filtro en la definición sobrescribirá al anterior.
                filterMap[httpParamIdentifier] = {
                    query: query,
                    dbIdentifier: fullDbIdentifier,
                };
            }
        }
    }
    return filterMap;
}

/**
 * Construye la cláusula WHERE usando la búsqueda directa en el HashMap.
 */
function whereBuilder(filters: Filters) {
    const filtersStructure = mapOfFilters(filters); // HashMap O(1)

    return function (queryBuilder: any, params: httpParams): string {
        const conditions = [];

        for (const [param, value] of Object.entries(params)) {
            // Validación de valores
            if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
                continue;
            }

            // Búsqueda directa O(1)
            const filterMapValue = filtersStructure[param];

            if (filterMapValue) {
                const { query, dbIdentifier } = filterMapValue;

                const condition = query(queryBuilder, dbIdentifier, value);

                if (condition) {
                    conditions.push(`(${condition})`);
                }
            }
        }

        if (conditions.length > 0) {
            return `WHERE ${conditions.join(' AND ')}`;
        }
        return '';
    };
}

// --- Prueba ---
(() => {
  const httpParams = {
    cod_servicio: 89,
    cod_oportunidad: 21,
    cod_medio_transporte: 321,
    numero_oportunidad: 87821, // Se usará en el filtro ILIKE
    serie_oportunidad: 12
  };

  const filtrosB: Filters  = {
    [`
      s.cod_servicio,
      s.cod_oportunidad,
      c.cod_medio_transporte
    `]: (_, p, v) => `${p} = ${v}`,
    's.serie_oportunidad': (__, _, v) => `op.serie = ${v}`,
    's.numero_oportunidad': (__, _, v) => `"op"."numero"::TEXT ILIKE '%${v}%"`
  };

  const whereCotizacion = whereBuilder(filtrosB);
  const result = whereCotizacion(null, httpParams);

  console.log(`Resultado HashMap:\n${result}`);
})()
