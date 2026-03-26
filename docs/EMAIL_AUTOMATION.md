# 📧 Email Automation - Dokumentacja

> Automatyczne wysyłanie ofert i komunikacja z klientami

**Data realizacji:** 26.01.2026  
**Status:** ✅ COMPLETED  
**Impact:** ŚREDNI-WYSOKI

---

## 🎯 **CEL**

Umożliwienie wysyłania profesjonalnych ofert emailem bezpośrednio z aplikacji, bez konieczności ręcznego kopiowania danych i otwierania Gmaila.

---

## ✅ **ZREALIZOWANE FUNKCJE**

### 1. **Wyślij ofertę emailem** 📧

**Lokalizacja:** Project Header → Button "Wyślij email"

**Funkcjonalność:**
- Jeden przycisk obok "Wystaw fakturę"
- Otwiera dialog z formularzem
- Automatyczne wysyłanie przez Resend API
- Professional email template z gradientem

**Implementacja:**
- Komponent: `SendEmailDialog.tsx`
- Server action: `sendProjectEmail()`
- Email sent from: `onboarding@resend.dev` (testowy, dla produkcji: `elektrosmartpro@gmail.com` lub `noreply@elektrosmart.pro`)
- Reply-to: user email (klient może odpowiedzieć bezpośrednio)

---

### 2. **Szablony emaili** 📝

**5 gotowych szablonów:**

#### A. **Oferta do rozpatrzenia** (offer)
```
- Standardowa oferta dla nowego projektu
- Zawiera: wykaz materiałów, ceny, termin ważności
- Automatycznie: projectName, totalAmount, userName
```

#### B. **Przypomnienie o ofercie** (reminder)
```
- Delikatny follow-up po wysłaniu oferty
- Zawiera: datę wysłania, termin ważności
- Tone: profesjonalny, nie nachalny
```

#### C. **Potwierdzenie realizacji** (confirmation)
```
- Po akceptacji oferty przez klienta
- Zawiera: zakres prac, wartość, termin rozpoczęcia
- Tone: formalny, biznesowy
```

#### D. **Follow-up po wykonaniu** (followup)
```
- Po zakończeniu prac
- Zawiera: podsumowanie, informacja o fakturze
- Tone: dziękujący, zapraszający do kolejnej współpracy
```

#### E. **Własny szablon** (custom)
```
- Pusty szablon do własnej treści
- User może pisać co chce
- Basic structure (header, footer) preserved
```

**Zmienne dostępne:**
```typescript
{{clientName}}     // Nazwa klienta
{{projectName}}    // Nazwa projektu
{{totalAmount}}    // Wartość brutto
{{userName}}       // Twoje imię
{{companyName}}    // Nazwa firmy
{{userEmail}}      // Twój email
{{userPhone}}      // Telefon
{{sentDate}}       // Data wysłania
{{expiryDate}}     // Data ważności (+30 dni)
{{startDate}}      // Data rozpoczęcia
{{duration}}       // Czas realizacji
```

---

### 3. **Podgląd przed wysłaniem** 👁️

**Funkcjonalność:**
- Tabs: "Utwórz email" / "Podgląd"
- Preview pokazuje:
  - Nadawca: User Name <onboarding@resend.dev>
  - Odbiorca: client email
  - Temat: z podmienionymi zmiennymi
  - Treść: HTML render z gradientem, logo, formatowaniem
- Live preview - zmienia się gdy edytujesz

**Formatowanie:**
- `**tekst**` → Bold (strong)
- Newlines → `<br />`
- Professional gradient header (purple-indigo)
- Footer: "Wysłano przez ElektroSmart PRO"

---

### 4. **Historia wysyłek** 📊

**Lokalizacja:** Project Page → Pod "Project Notes"

**Funkcjonalność:**
- Card z listą wszystkich wysłanych emaili
- Badge z liczbą wysyłek
- Empty state: "Nie wysłano jeszcze żadnych emaili"

**Wyświetlane informacje:**
```
✅ Nazwa odbiorcy
✅ Email odbiorcy
✅ Temat emaila
✅ Status: Wysłano / Błąd
✅ Data i godzina (Polish locale)
✅ Typ template (offer, reminder, etc.)
✅ Error message (jeśli failed)
```

**Status badges:**
- 🟢 Wysłano (green)
- 🔴 Błąd (red)
- ⏳ Oczekuje (gray - future feature)

---

## 📁 **STRUKTURA PLIKÓW**

### Nowe pliki:

```
supabase/migrations/
  20260126_add_email_logs.sql           // DB migration

lib/
  email-templates.ts                    // 5 templates + fillTemplate()

app/dashboard/projects/[id]/
  email-actions.ts                      // Server actions

components/project/
  send-email-dialog.tsx                 // Main dialog
  email-history.tsx                     // History component

lib/types/
  database.ts                           // + EmailLog interface
```

### Zmodyfikowane pliki:

```
components/project/
  project-header.tsx                    // + SendEmailDialog button

app/dashboard/projects/[id]/
  page.tsx                              // + EmailHistory component
```

---

## 🗄️ **DATABASE SCHEMA**

### Tabela: `email_logs`

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  template_type TEXT NOT NULL,  -- 'offer', 'reminder', 'confirmation', 'followup', 'custom'
  status TEXT NOT NULL,          -- 'sent', 'failed', 'opened', 'clicked'
  resend_id TEXT,                -- Resend API email ID
  error_message TEXT,            -- Error details if failed
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_project_id ON email_logs(project_id);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- RLS Policies
- Users can view their own email logs (SELECT)
- Users can insert their own email logs (INSERT)
```

---

## 🔧 **TECHNICAL DETAILS**

### Email Provider: Resend

**Dlaczego Resend?**
- ✅ Już było w dependencies
- ✅ Prosty API (vs AWS SES, SendGrid)
- ✅ Dobre deliverability rates
- ✅ Free tier: 100 emails/day

**Konfiguracja:**
```env
RESEND_API_KEY=re_xxxxx
```

**Email domain:**
```
From: User Name <onboarding@resend.dev>
Reply-To: user@email.com (user's actual email)
```

### Server Actions:

**1. sendProjectEmail()**
```typescript
Input:
  - projectId, recipientEmail, recipientName
  - subject, body, templateType

Process:
  1. Validate user auth
  2. Get project details
  3. Get user profile (for sender info)
  4. Fill template variables
  5. Convert markdown → HTML
  6. Send via Resend API
  7. Log to database (sent/failed)
  8. Revalidate project page

Output:
  - success: boolean
  - messageId: string (Resend ID)
  - error?: string
```

**2. getProjectEmailHistory()**
```typescript
- Fetch all emails for specific project
- Ordered by sent_at DESC
- RLS filtering (user can see only their emails)
```

**3. getAllEmailLogs()**
```typescript
- Fetch last 50 emails for user
- With project relation (name)
- For potential dashboard view (future)
```

---

## 💡 **USER FLOW**

### Typowy scenariusz:

1. **Elektryk** kończy kosztorys projektu
2. Klika **"Wyślij email"** w header
3. **Dialog się otwiera:**
   - Wybiera szablon: "Oferta do rozpatrzenia"
   - Wpisuje dane klienta: Imię + Email
   - (Opcjonalnie) edytuje treść
4. **Klika "Podgląd":**
   - Widzi jak będzie wyglądać email
   - Sprawdza czy wszystko OK
5. **Klika "Wyślij email"**
6. **Toast:** "✅ Email wysłany! Oferta wysłana do Jan Kowalski"
7. **EmailHistory** pokazuje nową pozycję
8. **Klient otrzymuje email** z professional template
9. **Klient może odpowiedzieć** bezpośrednio na elektryk@email.com

---

## 🎨 **EMAIL DESIGN**

### HTML Template structure:

```html
<div style="max-width: 600px; margin: 0 auto;">
  <!-- Header -->
  <div style="background: gradient purple-indigo; padding: 30px;">
    <h1>⚡ Company Name</h1>
  </div>
  
  <!-- Body -->
  <div style="background: #f9fafb; padding: 30px;">
    <div style="background: white; padding: 20px;">
      {{email_body}}
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; font-size: 12px;">
      Wysłano przez ElektroSmart PRO
    </div>
  </div>
</div>
```

### Design principles:
- **Professional:** Gradient header, clean layout
- **Readable:** White background, good contrast
- **Mobile-friendly:** Max-width 600px
- **On-brand:** ElektroSmart PRO branding

---

## 📊 **METRYKI & KPIs**

### Tracking (current):
- ✅ Liczba wysłanych emaili
- ✅ Success/Failure rate
- ✅ Template usage distribution

### Future tracking (with Resend webhooks):
- [ ] Open rate (opened_at)
- [ ] Click rate (clicked links)
- [ ] Bounce rate
- [ ] Spam reports

---

## 🚀 **FUTURE ENHANCEMENTS**

### Q2 2026:
- [ ] **PDF Attachment** - Attach generated PDF estimate
- [ ] **Bulk send** - Wyślij do wielu klientów naraz
- [ ] **Scheduled send** - Wyślij o określonej godzinie
- [ ] **Email sequences** - Auto follow-up po X dniach
- [ ] **A/B testing** - Test różnych templates

### Q3 2026:
- [ ] **Email tracking** - Open/click tracking z Resend webhooks
- [ ] **Custom domains** - Send from elektryk@mojafirma.pl
- [ ] **Email builder** - Drag-and-drop template creator
- [ ] **CRM integration** - Link z Simple CRM (gdy będzie)

---

## ⚠️ **KNOWN LIMITATIONS**

1. **No PDF attachment (yet)**
   - Planned for Q2
   - For now: klient może otworzyć projekt w app

2. **No open/click tracking**
   - Resend supports it, ale need webhooks
   - Planned for Q3

3. **Manual send only**
   - No automated sequences (yet)
   - Manual trigger required

4. **Single recipient**
   - Can't CC/BCC (yet)
   - One email = one recipient

5. **No email editor**
   - Plain text with basic markdown
   - No rich WYSIWYG editor (yet)

---

## 🛠️ **TROUBLESHOOTING**

### Email nie wysyła się:

**Problem 1: "RESEND_API_KEY is not configured"**
```bash
Solution: Dodaj RESEND_API_KEY do .env.local
```

**Problem 2: "Failed to send email"**
```bash
Sprawdź:
- Resend API key jest valid
- Email recipient jest valid
- Resend account ma limit emails
```

**Problem 3: "Email log nie zapisuje się"**
```bash
Sprawdź:
- RLS policies dla email_logs
- User ma proper permissions
- Migration została uruchomiona
```

### Email trafia do spamu:

**Solutions:**
- Verify domain w Resend dashboard
- Add SPF/DKIM records
- Use proper from address
- Avoid spam trigger words in subject

---

## 📈 **IMPACT ANALYSIS**

### Before:
1. Elektryk kończy kosztorys
2. Export do PDF ❌ (slow)
3. Otwórz Gmail ❌ (context switch)
4. Napisz email ręcznie ❌ (time-consuming)
5. Attach PDF ❌
6. Wyślij ❌
7. **Total time: ~5-10 minut**

### After:
1. Elektryk kończy kosztorys
2. Klik "Wyślij email" ✅
3. Wybierz szablon ✅ (1 click)
4. Wpisz email klienta ✅ (10 sekund)
5. Klik "Wyślij" ✅
6. **Total time: ~30 sekund** 🚀

**Time savings:** 80-90% reduction!

### Business value:
- **Faster response time** - Klient dostaje ofertę od razu
- **Professional image** - Branded email template
- **Better tracking** - Historia wysyłek w jednym miejscu
- **Less errors** - Auto-fill from project data
- **More offers sent** - Mniej friction = więcej ofert

---

## 🎓 **BEST PRACTICES**

### Dla użytkowników:

1. **Zawsze preview przed wysłaniem**
   - Sprawdź czy wszystkie zmienne są OK
   - Upewnij się że kwoty się zgadzają

2. **Personalizuj template**
   - Dodaj własne uwagi jeśli trzeba
   - Adjust tone dla konkretnego klienta

3. **Follow-up systematycznie**
   - Jeśli klient nie odpowiada po 7 dniach → reminder
   - Ale nie spamuj - max 2 follow-ups

4. **Track results**
   - Sprawdzaj EmailHistory
   - Zobacz które templates działają najlepiej

### Dla developerów:

1. **Always log emails**
   - Nawet failed attempts
   - Store error messages for debugging

2. **Use transactions**
   - If email sends but logging fails, handle gracefully
   - Don't fail whole operation for logging error

3. **Rate limiting (future)**
   - Resend has daily limits
   - Implement rate limiting for users

4. **Security**
   - Sanitize email content
   - Validate recipient emails
   - No injection attacks

---

**🎉 Email Automation DONE! Teraz elektrycy mogą wysyłać oferty w 30 sekund! 📧⚡**

*Dokumentacja utworzona: 26.01.2026*  
*Autor: ElektroSmart PRO Development Team*
