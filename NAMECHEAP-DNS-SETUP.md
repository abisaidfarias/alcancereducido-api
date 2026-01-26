# 🔧 Guía: Configurar Name Servers en Namecheap para Route 53

## 📋 Situación Actual

- **Name Servers actuales:** Namecheap (dns1.namecheaphosting.com, dns2.namecheaphosting.com)
- **Name Servers necesarios:** Route 53 (para validación automática del certificado SSL)

## ✅ Opción 1: Cambiar Name Servers a Route 53 (RECOMENDADO)

### Ventajas:
- ✅ Validación automática del certificado SSL
- ✅ Gestión de DNS centralizada en AWS
- ✅ Fácil configuración de subdominios
- ✅ Mejor integración con servicios AWS

### Pasos:

1. **Ir a Namecheap:**
   - Inicia sesión en tu cuenta de Namecheap
   - Ve a **Domain List**
   - Haz clic en **Manage** junto a `alcance-reducido.com`

2. **Cambiar Name Servers:**
   - Ve a la pestaña **Nameservers**
   - Cambia de **"Namecheap BasicDNS"** a **"Custom DNS"**

3. **Agregar Name Servers de Route 53:**
   Agrega estos 4 Name Servers (uno por línea):
   ```
   ns-636.awsdns-15.net
   ns-2035.awsdns-62.co.uk
   ns-143.awsdns-17.com
   ns-1301.awsdns-34.org
   ```

4. **Guardar cambios:**
   - Haz clic en **"Save Changes"**
   - Los cambios pueden tardar 24-48 horas en propagarse (normalmente 15-30 minutos)

5. **Verificar:**
   ```bash
   nslookup -type=NS alcance-reducido.com
   ```
   Deberías ver los Name Servers de Route 53.

### ⚠️ Importante:
- Una vez cambiados los Name Servers, **todos los registros DNS** deben estar en Route 53
- Si tienes registros A, CNAME, MX, etc. en Namecheap, necesitarás recrearlos en Route 53
- El certificado SSL se validará automáticamente una vez que los Name Servers se propaguen

---

## 🔄 Opción 2: Agregar CNAME Manualmente en Namecheap

Si **NO quieres cambiar** los Name Servers, puedes agregar los registros CNAME manualmente en Namecheap.

### Pasos:

1. **Ir a Namecheap:**
   - Inicia sesión en tu cuenta
   - Ve a **Domain List** → **Manage** → **Advanced DNS**

2. **Agregar registros CNAME:**
   
   Agrega estos 3 registros CNAME:

   **Registro 1:**
   - Tipo: `CNAME Record`
   - Host: `_6c8ff7deb3541d919b398b823fe77116.alcance-reducido.com`
   - Value: `_234c2424f394b97e427313f2aacc16b0.jkddzztszm.acm-validations.aws.`
   - TTL: `Automatic` o `300`

   **Registro 2:**
   - Tipo: `CNAME Record`
   - Host: `_c779718509c116d60b046b585ac05e24.api.alcance-reducido.com`
   - Value: `_76a3289b9dffffe71112bf92af1a1d10.jkddzztszm.acm-validations.aws.`
   - TTL: `Automatic` o `300`

   **Registro 3:**
   - Tipo: `CNAME Record`
   - Host: `_30ad283dc4200c325065412cad01659e.www.alcance-reducido.com`
   - Value: `_ce6facf78a4cca2dfb4e08f93d7b8ee2.jkddzztszm.acm-validations.aws.`
   - TTL: `Automatic` o `300`

3. **Guardar cambios:**
   - Haz clic en **"Save All Changes"**
   - Espera 5-30 minutos para que AWS valide el certificado

### ⚠️ Notas:
- Los registros CNAME deben tener el punto (.) al final del valor
- La validación puede tardar más que con Route 53
- Si agregas nuevos subdominios en el futuro, necesitarás agregar más CNAME manualmente

---

## 🔍 Verificación

### Verificar Name Servers:
```bash
nslookup -type=NS alcance-reducido.com
```

### Verificar estado del certificado:
```bash
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:438758934896:certificate/61dbb55e-1571-4209-9f5d-eb7b8d3291ab \
  --region us-east-1
```

Busca `"Status": "ISSUED"` cuando esté validado.

---

## 📝 Recomendación

**Recomiendo la Opción 1 (cambiar Name Servers a Route 53)** porque:
- Es más fácil de mantener a largo plazo
- Permite validación automática de certificados
- Facilita la gestión de subdominios
- Mejor integración con servicios AWS

Si ya tienes muchos registros DNS configurados en Namecheap y no quieres moverlos, usa la Opción 2.

---

## ⏱️ Tiempos de Propagación

- **Name Servers:** 24-48 horas (normalmente 15-30 minutos)
- **Registros CNAME:** 5-30 minutos
- **Validación de certificado:** 5-30 minutos después de que los CNAME estén activos


