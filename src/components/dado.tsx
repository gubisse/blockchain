import md5 from 'blueimp-md5';

export const usuarios = [
	{ id: "u001", nome: "admin", senha: md5("1234") },
	{ id: "u002", nome: "diretor", senha: md5("senha123") },
]
export const clientes = [
	{id: "c1", nome: "Antonio Miguel Antonio", telefone: "845421639", email: "e@gmail.com", morada: "Bairro 5 Chimoio", data: "2025-02-02 00:00"},
	{id: "c2", nome: "Merdi Mutombo", telefone: "875421632", email: "r@gmail.com", morada: "Bairro 5 Chimoio", data: "2025-02-02 00:00"},
	{id: "c3", nome: "Albano Antonio", telefone: "875421633", email: "ew@gmail.com", morada: "Bairro 5 Chimoio", data: "2025-02-02 00:00"},
	{id: "c4", nome: "Albano Antonio", telefone: "875421633", email: "ew@gmail.com", morada: "Bairro 5 Chimoio", data: "2025-02-02 00:00"},
	{id: "c5", nome: "Manuel Antonio", telefone: "875421633", email: "ew@gmail.com", morada: "Bairro 5 Chimoio", data: "2025-02-02 00:00"},
]
export const parametros = [

	{ id: "Cn", categoria: "Agua", valor: 1100, campos: "x,y", formula: "x/y" },
	{ id: "Na", categoria: "Agua", valor: 500, campos: "x,y,z", formula: "x*y/z" },
	{ id: "Mg", categoria: "Agua", valor: 750, campos: "x,y,z", formula: "x/z + y" },
	{ id: "Zn", categoria: "Alimento", valor: 900, campos: "x,y,z", formula: "x*y/z" },
	{ id: "Pr", categoria: "Alimento", valor: 300, campos: "x,y,z", formula: "x - y * z" },
	{ id: "C", categoria: "Alimento", valor: 1200, campos: "x,y,z", formula: "x/y + z" },
	{ id: "He", categoria: "Agua e Alimento", valor: 1000, campos: "x,y,z", formula: "x/y*x/z" },
	{ id: "Fr", categoria: "Agua e Alimento", valor: 400, campos: "x,y,z", formula: "x - y * z" },
	{ id: "N", categoria: "Agua e Alimento", valor: 800, campos: "x,y,z", formula: "(x + y) / z" },
];

export const proformas = [
	{ id: "a11e", cliente: "c1", nome: "Analise de Agua", parametros: "Zn,Na,Mg", totalpagar: 1000, data: "2025-02-02 00:00", estado: "analisada" },
	{ id: "a111", cliente: "c3", nome: "Analise de Agua", parametros: "Na,Mg", totalpagar: 1000, data: "2025-02-02 00:00", estado: "analisada" },
	{ id: "a1e1", cliente: "c1", nome: "Analise de Alimentos", parametros: "C,Cc,Fr,N", totalpagar: 1000, data: "2025-02-02 00:00", estado: "analisada" },
	{ id: "a1e1e", cliente: "c4", nome: "Analise de Agua", parametros: "Zn,N,Mg", totalpagar: 1000, data: "2025-02-02 00:00", estado: "por analisar" },
	{ id: "a1e12", cliente: "c5", nome: "Analise de Agua", parametros: "Cn,Na,Mg", totalpagar: 1000, data: "2025-02-02 00:00", estado: "por analisar" },
];

export const analises = [
	{ id: "b1", proforma: "a11e", parametro: "Zn", valorfinal: 5284, data: "2025-02-02 00:00", x: 0, y: 0, z: 2 },
	{ id: "b2", proforma: "a111", parametro: "Na", valorfinal: 5284, data: "2025-02-02 00:00", x: 0, y: 0, z: 2 },
	{ id: "b3", proforma: "a111", parametro: "N", valorfinal: 5284, data: "2025-02-02 00:00", x: 0, y: 0, z: 2 },
	{ id: "b3", proforma: "a11e", parametro: "Mg", valorfinal: 5284, data: "2025-02-02 00:00", x: 0, y: 0, z: 2 },
	{ id: "b3", proforma: "a1e1", parametro: "Mg", valorfinal: 5284, data: "2025-02-02 00:00", x: 0, y: 0, z: 2 },
	{ id: "b3", proforma: "a1e1e", parametro: "Mg", valorfinal: 5284, data: "2025-02-02 00:00", x: 0, y: 0, z: 2 },
];

export const comprovativos = [
	{id: "212", proforma: "a11e", data: "2025-02-02 00:00"}
]

export const elementosQuimicos118 = [
  { id: "CO2", nome: "Dióxido de Carbono", descricao: "Presente em águas naturais e tratadas; influencia o pH e a acidez da água." },
  { id: "DA", nome: "Demanda Ácida", descricao: "Quantidade de base necessária para neutralizar os ácidos presentes na amostra." },
  { id: "Cl", nome: "Cloro", descricao: "Desinfetante amplamente usado; avalia-se o teor residual para garantir eficácia sem toxicidade." },
  { id: "SO3", nome: "Sulfitos", descricao: "Utilizados como conservantes; quantidades excessivas podem ser tóxicas." },
  { id: "Fe", nome: "Ferro", descricao: "Presente por corrosão ou minerais; pode causar coloração e sabor metálico." },
  { id: "Cl-", nome: "Cloreto", descricao: "Naturalmente presente; em excesso pode indicar contaminação por esgoto ou intrusão salina." },
  { id: "Cd", nome: "Cádmio", descricao: "Metal pesado tóxico; deve estar ausente ou em níveis traços." },
  { id: "Pb", nome: "Chumbo", descricao: "Altamente tóxico; geralmente relacionado a encanamentos antigos ou contaminações industriais." },
  { id: "Cu", nome: "Cobre", descricao: "Essencial em pequenas quantidades, mas tóxico em excesso; causa coloração azul-esverdeada." },
  { id: "Zn", nome: "Zinco", descricao: "Essencial à saúde, mas pode alterar sabor da água em altas concentrações." },
  { id: "Hg", nome: "Mercúrio", descricao: "Extremamente tóxico, mesmo em quantidades mínimas." },
  { id: "As", nome: "Arsénio", descricao: "Elemento altamente tóxico; pode estar presente em águas subterrâneas." },
  { id: "pH", nome: "pH", descricao: "Mede a acidez ou alcalinidade da água; essencial para qualidade e tratamento." },
  { id: "Cor", nome: "Cor", descricao: "Avalia a presença de matéria orgânica e metais; importante para a aceitação visual da água." },
  { id: "Tu", nome: "Turbidez", descricao: "Indica partículas em suspensão; associada a microrganismos e qualidade estética." },
  { id: "Cond", nome: "Condutividade", descricao: "Mede a capacidade da água de conduzir corrente elétrica, relacionada à presença de sais." },
  { id: "DT", nome: "Dureza Total", descricao: "Relacionada à concentração de cálcio e magnésio; influencia a formação de depósitos e uso de sabões." },
  { id: "T", nome: "Temperatura", descricao: "Afeta a solubilidade de gases e a atividade biológica; importante em processos físico-químicos." },
  { id: "D", nome: "Densidade", descricao: "Massa por volume; varia conforme salinidade e temperatura." },
  { id: "Alc", nome: "Alcalinidade", descricao: "Capacidade da água em neutralizar ácidos; essencial para tamponamento do pH." },
  { id: "TDS", nome: "Sólidos Totais Dissolvidos", descricao: "Concentração total de substâncias dissolvidas; parâmetro de qualidade geral." },
  { id: "Sal", nome: "Salinidade", descricao: "Quantidade de sais dissolvidos; influencia na potabilidade e uso agrícola/industrial." },

  { id: "AT", nome: "Acidez Titulável", descricao: "Mede a quantidade de ácidos presentes; importante para conservação e sabor." },
  { id: "AR", nome: "Açúcares Redutores", descricao: "Indica glicose/frutose presentes; útil no controle de maturação e fermentação." },
  { id: "Cor", nome: "Cor", descricao: "Avalia a aparência visual do alimento; usada para controle de qualidade e padronização." },
  { id: "CH", nome: "Carboidratos", descricao: "Fonte energética principal nos alimentos; inclui açúcares simples e complexos." },
  { id: "VE", nome: "Valor Energético", descricao: "Quantifica a energia disponível no alimento em kcal ou kJ." },
  { id: "Cin", nome: "Cinzas", descricao: "Resíduo mineral após incineração; representa o teor de minerais totais." },
  { id: "SS", nome: "Sólidos Solúveis", descricao: "Concentração de açúcares, ácidos e sais; geralmente medido em °Brix." },
  { id: "Prot", nome: "Proteínas", descricao: "Macronutriente essencial para formação de tecidos e enzimas." },
  { id: "Gor", nome: "Gorduras", descricao: "Importante fonte de energia e ácidos graxos; pode ser saturada ou insaturada." },
  { id: "Hum", nome: "Humidade", descricao: "Quantidade de água presente; afeta conservação, textura e estabilidade." },
  { id: "pH", nome: "pH", descricao: "Afeta sabor, conservação e crescimento microbiano; controle importante em alimentos ácidos." },
  { id: "TA-D", nome: "Teor de Álcool por Destilação", descricao: "Determina o volume de etanol por processo físico de destilação." },
  { id: "TA-A", nome: "Teor de Álcool por Alcoolímetro", descricao: "Determinação rápida do teor alcoólico utilizando medidor densimétrico (alcoolímetro)." },

  { id: "BAM", nome: "Bactérias Aeróbias Mesófilas", descricao: "Indicador geral de contaminação e qualidade higiênico-sanitária." },
  { id: "BL", nome: "Bolores e Leveduras", descricao: "Fungos que indicam deterioração e possíveis toxinas em alimentos." },
  { id: "CF", nome: "Coliformes Fecais", descricao: "Indicadores de contaminação fecal recente; presença é crítica." },
  { id: "CT", nome: "Coliformes Totais", descricao: "Grupo geral de bactérias presentes no ambiente; usado como alerta." },
  { id: "EC", nome: "Escherichia coli", descricao: "Indicador específico de contaminação fecal; algumas cepas são patogênicas." }
];
