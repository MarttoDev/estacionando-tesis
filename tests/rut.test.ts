import { describe, expect, it } from 'vitest'
import { isValidRut, normalizeRut } from '@/lib/auth/rut'

describe('Validación de RUT chileno', () => {
  describe('normalizeRut', () => {
    it('elimina puntos del RUT', () => {
      expect(normalizeRut('12.345.678-5')).toBe('12345678-5')
    })

    it('elimina espacios del RUT', () => {
      expect(normalizeRut(' 12 345 678-5 ')).toBe('12345678-5')
    })

    it('convierte la letra k a mayúscula', () => {
      expect(normalizeRut('1.000.005-k')).toBe('1000005-K')
    })
  })

  describe('isValidRut', () => {
    it('acepta un RUT válido con dígito verificador numérico', () => {
      expect(isValidRut('12345678-5')).toBe(true)
    })

    it('acepta un RUT válido con dígito verificador K', () => {
      expect(isValidRut('1000005-K')).toBe(true)
    })

    it('rechaza un RUT con dígito verificador incorrecto', () => {
      expect(isValidRut('12345678-9')).toBe(false)
    })

    it('rechaza un RUT sin guion', () => {
      expect(isValidRut('123456785')).toBe(false)
    })

    it('rechaza un RUT con menos de 7 dígitos', () => {
      expect(isValidRut('123456-5')).toBe(false)
    })

    it('rechaza un RUT con caracteres no permitidos', () => {
      expect(isValidRut('ABC45678-5')).toBe(false)
    })
  })
})