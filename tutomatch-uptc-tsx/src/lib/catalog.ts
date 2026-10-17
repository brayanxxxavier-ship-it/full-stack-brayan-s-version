import type { Category } from '../types';
export const categoryLabels: Record<Category, string> = { licenciaturas: 'Licenciaturas', ingenierias: 'Ingenierías', arquitectura: 'Arquitectura' };
export const fallbackSubjects: Record<Category, string[]> = {
  licenciaturas: ['Didáctica General', 'Pedagogía', 'Lengua Castellana', 'Inglés', 'Ciencias Naturales', 'Matemáticas para la Educación'],
  ingenierias: ['Cálculo Diferencial', 'Álgebra Lineal', 'Programación', 'Física Mecánica', 'Bases de Datos', 'Circuitos Eléctricos'],
  arquitectura: ['Geometría Descriptiva', 'Diseño Arquitectónico', 'Historia de la Arquitectura', 'Construcción', 'Urbanismo', 'Dibujo Técnico']
};
