export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    contacto VARCHAR(120) NULL,
    telefono VARCHAR(40) NULL,
    email VARCHAR(160) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(160) NOT NULL,
    principio_activo VARCHAR(160) NULL,
    categoria_id INT NULL,
    proveedor_id INT NULL,
    precio_compra DECIMAL(10,2) NOT NULL DEFAULT 0,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    fecha_vencimiento DATE NULL,
    requiere_receta TINYINT(1) NOT NULL DEFAULT 0,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    CONSTRAINT fk_prod_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    INDEX idx_prod_nombre (nombre)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente VARCHAR(120) NULL,
    metodo_pago ENUM('efectivo','tarjeta','transferencia') NOT NULL DEFAULT 'efectivo',
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ventas_fecha (fecha)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_det_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    CONSTRAINT fk_det_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
]

export const SEED_CATEGORIAS = [
  'Analgésicos',
  'Antibióticos',
  'Gastrointestinales',
  'Antialérgicos',
  'Cardiovasculares',
  'Respiratorios',
  'Vitaminas y suplementos',
  'Cuidado personal',
  'Material de curación',
]

export const SEED_PROVEEDORES: [string, string, string, string][] = [
  ['Distribuidora FarmaSur', 'Lucía Méndez', '+52 55 1234 5678', 'ventas@farmasur.com'],
  ['Laboratorios Andinos', 'Jorge Paredes', '+51 1 555 0192', 'pedidos@labandinos.com'],
  ['MedSupply Global', 'Ana Torres', '+34 910 555 210', 'contacto@medsupply.com'],
  ['Droguería Central', 'Ricardo Gómez', '+57 1 555 8899', 'atencion@drogueriacentral.com'],
]

type SeedProducto = {
  codigo: string
  nombre: string
  principio: string
  categoria: number
  proveedor: number
  compra: number
  venta: number
  stock: number
  minimo: number
  venceEnDias: number
  receta: boolean
}

export const SEED_PRODUCTOS: SeedProducto[] = [
  { codigo: 'MED-001', nombre: 'Paracetamol 500 mg x20', principio: 'Paracetamol', categoria: 1, proveedor: 1, compra: 1.2, venta: 2.5, stock: 240, minimo: 40, venceEnDias: 540, receta: false },
  { codigo: 'MED-002', nombre: 'Ibuprofeno 400 mg x10', principio: 'Ibuprofeno', categoria: 1, proveedor: 2, compra: 1.8, venta: 3.9, stock: 160, minimo: 30, venceEnDias: 420, receta: false },
  { codigo: 'MED-003', nombre: 'Amoxicilina 500 mg x12', principio: 'Amoxicilina', categoria: 2, proveedor: 2, compra: 4.1, venta: 8.5, stock: 18, minimo: 25, venceEnDias: 300, receta: true },
  { codigo: 'MED-004', nombre: 'Omeprazol 20 mg x14', principio: 'Omeprazol', categoria: 3, proveedor: 1, compra: 2.3, venta: 5.2, stock: 120, minimo: 20, venceEnDias: 610, receta: false },
  { codigo: 'MED-005', nombre: 'Loratadina 10 mg x10', principio: 'Loratadina', categoria: 4, proveedor: 3, compra: 1.5, venta: 3.4, stock: 95, minimo: 20, venceEnDias: 25, receta: false },
  { codigo: 'MED-006', nombre: 'Metformina 850 mg x30', principio: 'Metformina', categoria: 5, proveedor: 4, compra: 3.0, venta: 6.9, stock: 70, minimo: 15, venceEnDias: 480, receta: true },
  { codigo: 'MED-007', nombre: 'Losartán 50 mg x30', principio: 'Losartán potásico', categoria: 5, proveedor: 4, compra: 3.6, venta: 7.8, stock: 8, minimo: 15, venceEnDias: 390, receta: true },
  { codigo: 'MED-008', nombre: 'Atorvastatina 20 mg x30', principio: 'Atorvastatina', categoria: 5, proveedor: 2, compra: 4.8, venta: 10.5, stock: 55, minimo: 10, venceEnDias: 700, receta: true },
  { codigo: 'MED-009', nombre: 'Salbutamol inhalador 100 mcg', principio: 'Salbutamol', categoria: 6, proveedor: 3, compra: 5.5, venta: 11.9, stock: 30, minimo: 10, venceEnDias: 18, receta: true },
  { codigo: 'MED-010', nombre: 'Diclofenaco gel 1% 60 g', principio: 'Diclofenaco', categoria: 1, proveedor: 1, compra: 3.2, venta: 6.8, stock: 44, minimo: 10, venceEnDias: 365, receta: false },
  { codigo: 'MED-011', nombre: 'Vitamina C 1 g x10 efervescente', principio: 'Ácido ascórbico', categoria: 7, proveedor: 3, compra: 2.0, venta: 4.6, stock: 130, minimo: 25, venceEnDias: 500, receta: false },
  { codigo: 'MED-012', nombre: 'Complejo B x30', principio: 'Vitaminas B1, B6, B12', categoria: 7, proveedor: 4, compra: 3.4, venta: 7.2, stock: 62, minimo: 15, venceEnDias: 450, receta: false },
  { codigo: 'MED-013', nombre: 'Suero oral 500 ml', principio: 'Sales de rehidratación', categoria: 3, proveedor: 1, compra: 0.9, venta: 2.1, stock: 4, minimo: 20, venceEnDias: 200, receta: false },
  { codigo: 'MED-014', nombre: 'Alcohol antiséptico 70% 250 ml', principio: 'Etanol', categoria: 9, proveedor: 4, compra: 1.1, venta: 2.6, stock: 85, minimo: 20, venceEnDias: 900, receta: false },
  { codigo: 'MED-015', nombre: 'Gasas estériles 10x10 x10', principio: '-', categoria: 9, proveedor: 4, compra: 0.8, venta: 1.9, stock: 150, minimo: 30, venceEnDias: 1200, receta: false },
  { codigo: 'MED-016', nombre: 'Termómetro digital', principio: '-', categoria: 8, proveedor: 3, compra: 4.0, venta: 9.9, stock: 22, minimo: 5, venceEnDias: 1800, receta: false },
  { codigo: 'MED-017', nombre: 'Jarabe antitusivo 120 ml', principio: 'Dextrometorfano', categoria: 6, proveedor: 2, compra: 2.7, venta: 5.9, stock: 12, minimo: 15, venceEnDias: 40, receta: false },
  { codigo: 'MED-018', nombre: 'Ácido acetilsalicílico 100 mg x28', principio: 'Ácido acetilsalicílico', categoria: 5, proveedor: 1, compra: 1.4, venta: 3.1, stock: 110, minimo: 20, venceEnDias: 640, receta: false },
  { codigo: 'MED-019', nombre: 'Cetirizina 10 mg x10', principio: 'Cetirizina', categoria: 4, proveedor: 2, compra: 1.6, venta: 3.6, stock: 75, minimo: 15, venceEnDias: 330, receta: false },
  { codigo: 'MED-020', nombre: 'Protector solar FPS 50 100 ml', principio: '-', categoria: 8, proveedor: 3, compra: 7.5, venta: 15.9, stock: 36, minimo: 8, venceEnDias: 520, receta: false },
]
