//src/utils/unidades.utils.js
const unidadesValidas = {
    gramos: { normalizada: "Gramos", factor: 1 },
    mililitro: { normalizada: "Mililitro", factor: 1 },
    individual: { normalizada: "Individual", factor: 1 },
    kilo: { normalizada: "Gramos", factor: 1000 },
    litro: { normalizada: "Mililitro", factor: 1000 }
};

export function normalizarUnidad(unidad, cantidad) {
    const unidadKey = unidad.trim().toLowerCase();
    const unidadInfo = unidadesValidas[unidadKey];
    if (!unidadInfo) return null;

    return {
        unidadNormalizada: unidadInfo.normalizada,
        cantidadNormalizada: Number(cantidad) * unidadInfo.factor
    };
}

export function getUnidadesValidas() {
    return Object.keys(unidadesValidas);
}
