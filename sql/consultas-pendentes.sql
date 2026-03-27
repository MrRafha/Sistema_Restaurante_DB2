-- ==============================================================
-- CONSULTAS PENDENTES - SISTEMA RESTAURANTE
-- Banco: SQLite / Prisma
-- Data: 20/03/2026
-- ==============================================================

-- 1) Clientes cadastrados
SELECT id, name, phone, cpf, email, createdAt
FROM "Customer"
ORDER BY name ASC;

-- 2) Pedidos com nome do cliente (pedidos + clientes)
SELECT
  o.id AS pedido_id,
  o.createdAt AS data_pedido,
  o.status,
  o.channel,
  c.name AS cliente,
  o.totalAmount AS valor_total
FROM "Order" o
LEFT JOIN "Customer" c ON c.id = o.customerId
ORDER BY o.createdAt DESC;

-- 3) Itens do pedido + produtos (itens_pedido + produtos)
SELECT
  oi.orderId AS pedido_id,
  d.name AS produto,
  oi.quantity AS quantidade,
  oi.unitPrice AS preco_unitario,
  oi.subtotal AS subtotal
FROM "OrderItem" oi
INNER JOIN "Dish" d ON d.id = oi.dishId
ORDER BY oi.orderId ASC, d.name ASC;

-- 4) Produtos vendidos em cada pedido
SELECT
  o.id AS pedido_id,
  d.name AS produto,
  oi.quantity AS quantidade,
  oi.subtotal AS subtotal
FROM "Order" o
INNER JOIN "OrderItem" oi ON oi.orderId = o.id
INNER JOIN "Dish" d ON d.id = oi.dishId
ORDER BY o.id ASC, d.name ASC;

-- 5) Pedidos realizados
SELECT
  id AS pedido_id,
  createdAt AS data_pedido,
  status,
  channel,
  totalAmount AS valor_total
FROM "Order"
ORDER BY createdAt DESC;

-- 6) Produtos vendidos (ranking)
SELECT
  d.id AS produto_id,
  d.name AS produto,
  SUM(oi.quantity) AS total_quantidade_vendida,
  SUM(oi.subtotal) AS total_faturado
FROM "OrderItem" oi
INNER JOIN "Dish" d ON d.id = oi.dishId
GROUP BY d.id, d.name
ORDER BY total_quantidade_vendida DESC, total_faturado DESC;

-- 7) Pedidos por cliente
SELECT
  c.id AS cliente_id,
  c.name AS cliente,
  COUNT(o.id) AS total_pedidos,
  COALESCE(SUM(o.totalAmount), 0) AS total_gasto
FROM "Customer" c
LEFT JOIN "Order" o ON o.customerId = c.id
GROUP BY c.id, c.name
ORDER BY total_pedidos DESC, total_gasto DESC;

-- 8) Pedidos por mesa
SELECT
  t.id AS mesa_id,
  COALESCE(t.label, CAST(t.numero AS TEXT)) AS mesa,
  COUNT(o.id) AS total_pedidos,
  COALESCE(SUM(o.totalAmount), 0) AS valor_total_mesa
FROM "Table" t
LEFT JOIN "Order" o ON o.tableId = t.id
GROUP BY t.id, t.label, t.numero
ORDER BY total_pedidos DESC, valor_total_mesa DESC;

-- 9) Cliente que mais gastou
SELECT
  c.id AS cliente_id,
  c.name AS cliente,
  COALESCE(SUM(o.totalAmount), 0) AS total_gasto
FROM "Customer" c
INNER JOIN "Order" o ON o.customerId = c.id
GROUP BY c.id, c.name
ORDER BY total_gasto DESC
LIMIT 1;

-- 10) Mesas que nunca receberam pedidos
SELECT
  t.id AS mesa_id,
  COALESCE(t.label, CAST(t.numero AS TEXT)) AS mesa,
  t.capacity AS capacidade
FROM "Table" t
LEFT JOIN "Order" o ON o.tableId = t.id
WHERE o.id IS NULL
ORDER BY t.id ASC;

-- 11) Pedido com maior valor total
SELECT
  o.id AS pedido_id,
  o.totalAmount AS maior_valor,
  o.createdAt AS data_pedido,
  c.name AS cliente,
  COALESCE(t.label, CAST(t.numero AS TEXT)) AS mesa
FROM "Order" o
LEFT JOIN "Customer" c ON c.id = o.customerId
LEFT JOIN "Table" t ON t.id = o.tableId
ORDER BY o.totalAmount DESC
LIMIT 1;

-- 12) Nome do cliente + total de pedidos + valor total gasto
-- Ordenado do maior para o menor
SELECT
  c.name AS cliente,
  COUNT(o.id) AS total_pedidos,
  COALESCE(SUM(o.totalAmount), 0) AS valor_total_gasto
FROM "Customer" c
LEFT JOIN "Order" o ON o.customerId = c.id
GROUP BY c.id, c.name
ORDER BY valor_total_gasto DESC, total_pedidos DESC;

-- 13) Media do valor dos pedidos
SELECT ROUND(AVG(totalAmount), 2) AS media_valor_pedidos
FROM "Order";
