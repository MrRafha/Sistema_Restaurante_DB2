// DDDs brasileiros válidos (Anatel)
const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
  21, 22, 24,                          // RJ
  27, 28,                              // ES
  31, 32, 33, 34, 35, 37, 38,          // MG
  41, 42, 43, 44, 45, 46,              // PR
  47, 48, 49,                          // SC
  51, 53, 54, 55,                      // RS
  61,                                  // DF
  62, 64,                              // GO
  63,                                  // TO
  65, 66,                              // MT
  67,                                  // MS
  68,                                  // AC
  69,                                  // RO
  71, 73, 74, 75, 77,                  // BA
  79,                                  // SE
  81, 87,                              // PE
  82,                                  // AL
  83,                                  // PB
  84,                                  // RN
  85, 88,                              // CE
  86, 89,                              // PI
  91, 93, 94,                          // PA
  92, 97,                              // AM
  95,                                  // RR
  96,                                  // AP
  98, 99,                              // MA
]);

// Sequências óbvias a rejeitar (após normalizar para só dígitos, sem DDD)
const TRIVIAL_PATTERNS = [
  /^(\d)\1+$/,               // todos dígitos iguais: 11111111, 999999999
  /^0?123456789$/,           // 123456789
  /^0?1234567890$/,          // 1234567890
  /^0?12345678$/,            // 12345678
  /^0?123456789\d?$/,        // variações crescentes
  /^9?87654321\d?$/,         // variações decrescentes
  /^9?876543210$/,
];

export interface PhoneValidationResult {
  valid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Valida e normaliza um número de telefone brasileiro.
 * Retorna o número com apenas dígitos (sem formatação) se válido.
 */
export function validateBrazilianPhone(raw: string): PhoneValidationResult {
  if (!raw || !raw.trim()) {
    return { valid: false, normalized: "", error: "Telefone é obrigatório." };
  }

  // Remove tudo exceto dígitos
  const digits = raw.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 11) {
    return {
      valid: false,
      normalized: digits,
      error: "Telefone deve ter 10 ou 11 dígitos (com DDD).",
    };
  }

  // Valida DDD
  const ddd = Number(digits.slice(0, 2));
  if (!VALID_DDDS.has(ddd)) {
    return {
      valid: false,
      normalized: digits,
      error: `DDD ${ddd} inválido.`,
    };
  }

  // Número sem DDD
  const numberOnly = digits.slice(2);

  // Celular com 9 dígitos deve começar com 9
  if (numberOnly.length === 9 && numberOnly[0] !== "9") {
    return {
      valid: false,
      normalized: digits,
      error: "Celular com 9 dígitos deve começar com 9.",
    };
  }

  // Rejeita padrões triviais no número sem DDD
  for (const pattern of TRIVIAL_PATTERNS) {
    if (pattern.test(numberOnly)) {
      return {
        valid: false,
        normalized: digits,
        error: "Número de telefone inválido ou sequencial.",
      };
    }
  }

  return { valid: true, normalized: digits };
}

/**
 * Formata um número normalizado (só dígitos) para exibição.
 * Ex: "11987654321" → "(11) 98765-4321"
 *     "1134567890"  → "(11) 3456-7890"
 */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return digits;
}
