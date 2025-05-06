-- Tabela para Clientes
CREATE TABLE clientes (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    morada VARCHAR(200) NOT NULL,
    data DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Parâmetros
CREATE TABLE parametros (
    id VARCHAR(50) PRIMARY KEY,
    categoria VARCHAR(100) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    campos TEXT NOT NULL,
    formula TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela para Proformas
CREATE TABLE proformas (
    id VARCHAR(50) PRIMARY KEY,
    cliente_id VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    parametros TEXT NOT NULL,
    totalpagar DECIMAL(10, 2) NOT NULL,
    data DATE NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('por analisar', 'analisada')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
);

-- Tabela para Análises
CREATE TABLE analises (
    id VARCHAR(50) PRIMARY KEY,
    proforma_id VARCHAR(50) NOT NULL,
    parametro_id VARCHAR(50) NOT NULL,
    valorfinal DECIMAL(10, 2) NOT NULL,
    data DATE NOT NULL,
    campos_valores JSONB NOT NULL, -- Armazena campos dinâmicos como { "x": 0, "y": 0, "z": 2 }
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE CASCADE,
    FOREIGN KEY (parametro_id) REFERENCES parametros(id) ON DELETE RESTRICT
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger às tabelas
CREATE TRIGGER update_clientes_timestamp
BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_parametros_timestamp
BEFORE UPDATE ON parametros
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_proformas_timestamp
BEFORE UPDATE ON proformas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_analises_timestamp
BEFORE UPDATE ON analises
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Índices para otimizar buscas
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_parametros_categoria ON parametros(categoria);
CREATE INDEX idx_parametros_nome ON parametros(nome);
CREATE INDEX idx_proformas_cliente_id ON proformas(cliente_id);
CREATE INDEX idx_proformas_estado ON proformas(estado);
CREATE INDEX idx_analises_proforma_id ON analises(proforma_id);
CREATE INDEX idx_analises_parametro_id ON analises(parametro_id);