import { prisma } from "@/lib/prisma";

// =============================================================================
// DML — dishService.ts
// Este arquivo concentra todas as operações de banco de dados da entidade Dish.
// Cada função corresponde a uma operação DML clássica:
// SELECT, INSERT, UPDATE ou DELETE.
// =============================================================================

export interface CreateDishInput {
  name: string;
  description?: string;
  price: number;
  qtyAvailable?: number;
  isActive?: boolean;
  isAvailable?: boolean;
}

export interface UpdateDishInput {
  name?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
  isAvailable?: boolean;
  qtyAvailable?: number;
}

// -----------------------------------------------------------------------------
// SELECT — Busca vários registros
// Equivalente SQL:
//   SELECT * FROM Dish ORDER BY name ASC;
//   SELECT * FROM Dish WHERE isActive = 1 ORDER BY name ASC; (quando onlyActive=true)
//
// findMany() → retorna um array com todos os registros que atendem ao filtro.
// where       → cláusula WHERE; se undefined, não filtra nada.
// orderBy     → cláusula ORDER BY.
// -----------------------------------------------------------------------------
export async function listDishes(onlyActive = false) {
  return prisma.dish.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
  });
}

// -----------------------------------------------------------------------------
// SELECT — Busca um único registro pela chave primária
// Equivalente SQL:
//   SELECT * FROM Dish WHERE id = ? LIMIT 1;
//
// findUnique() → retorna o registro encontrado ou null se não existir.
// -----------------------------------------------------------------------------
export async function getDish(id: number) {
  return prisma.dish.findUnique({ where: { id } });
}

// -----------------------------------------------------------------------------
// INSERT — Insere um novo registro na tabela
// Equivalente SQL:
//   INSERT INTO Dish (name, description, price, qtyAvailable, isActive, isAvailable)
//   VALUES (?, ?, ?, ?, ?, ?);
//
// create() → insere e retorna o registro criado com o id gerado.
// O operador ?? define valores padrão caso o campo não seja informado.
// -----------------------------------------------------------------------------
export async function createDish(data: CreateDishInput) {
  return prisma.dish.create({
    data: {
      name: data.name,
      description: data.description ?? "",
      price: data.price,
      qtyAvailable: data.qtyAvailable ?? 0,
      isActive: data.isActive ?? true,
      isAvailable: data.isAvailable ?? true,
    },
  });
}

// -----------------------------------------------------------------------------
// UPDATE — Atualiza campos de um registro existente
// Equivalente SQL:
//   UPDATE Dish SET <campos> WHERE id = ?;
//
// update() → atualiza apenas os campos presentes em `data` e retorna o registro.
// Como UpdateDishInput tem todos os campos opcionais, só o que for passado é alterado.
// -----------------------------------------------------------------------------
export async function updateDish(id: number, data: UpdateDishInput) {
  return prisma.dish.update({ where: { id }, data });
}

// -----------------------------------------------------------------------------
// SELECT + UPDATE — Ajusta o estoque somando ou subtraindo uma quantidade (delta)
// Equivalente SQL (em duas etapas):
//   SELECT qtyAvailable FROM Dish WHERE id = ?;
//   UPDATE Dish SET qtyAvailable = ?, isAvailable = ? WHERE id = ?;
//
// findUniqueOrThrow() → igual ao findUnique, mas lança erro se não encontrar.
// Math.max(0, ...) garante que o estoque jamais fique negativo.
// isAvailable é atualizado automaticamente: false quando chega a zero.
// -----------------------------------------------------------------------------
export async function adjustStock(id: number, delta: number) {
  const dish = await prisma.dish.findUniqueOrThrow({ where: { id } });
  const newQty = Math.max(0, dish.qtyAvailable + delta);
  return prisma.dish.update({
    where: { id },
    data: {
      qtyAvailable: newQty,
      isAvailable: newQty > 0,
    },
  });
}

// -----------------------------------------------------------------------------
// SELECT + UPDATE — Inverte o status ativo/inativo do prato
// Equivalente SQL (em duas etapas):
//   SELECT isActive FROM Dish WHERE id = ?;
//   UPDATE Dish SET isActive = NOT isActive WHERE id = ?;
//
// Lemos o valor atual primeiro para então inverter com o operador !.
// -----------------------------------------------------------------------------
export async function toggleActive(id: number) {
  const dish = await prisma.dish.findUniqueOrThrow({ where: { id } });
  return prisma.dish.update({
    where: { id },
    data: { isActive: !dish.isActive },
  });
}

// -----------------------------------------------------------------------------
// DELETE — Remove permanentemente um registro
// Equivalente SQL:
//   DELETE FROM Dish WHERE id = ?;
//
// delete() → remove o registro e o retorna. Lança erro se o id não existir.
// -----------------------------------------------------------------------------
export async function deleteDish(id: number) {
  return prisma.dish.delete({ where: { id } });
}
